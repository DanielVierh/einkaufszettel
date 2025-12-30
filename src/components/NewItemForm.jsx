import { useState, useMemo, useEffect } from "react";
import supabase from "../lib/supabaseClient";

const NewItemForm = ({
  userId,
  user_name,
  items = [],
  searchTerm = "",
  setSearchTerm = () => {},
  addExistingItem = () => {},
}) => {
  const [itemname, setItemname] = useState(searchTerm ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [item_price, setItem_price] = useState(0);
  const [item_amount, setItem_amount] = useState(1);
  const [item_comment, setItem_comment] = useState("");
  const [item_on_weekly_list, setItem_on_weekly_list] = useState(false);
  const [supermarket, setSupermarket] = useState("");
  const [supermarkets, setSupermarkets] = useState([]);
  const [customSupermarket, setCustomSupermarket] = useState("");
  const [showCustomSupermarket, setShowCustomSupermarket] = useState(false);

  // compute matches from provided items
  const matches = useMemo(() => {
    const q = (itemname || "").toString().toLowerCase();
    if (!q) return [];
    return items.filter((it) =>
      it.item_name.toString().toLowerCase().includes(q)
    );
  }, [items, itemname]);

  function handleInputChange(e) {
    const v = e.target.value;
    setItemname(v);
    setSearchTerm(v);
    setError("");
    setSuccess("");
  }

  async function handleAddItem(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!itemname || itemname.trim() === "") {
      setError("Ein Name muss eingetragen werden");
      return;
    }

    // Only block creation if there is an exact (case-insensitive) name match.
    const q = (itemname || "").toString().trim().toLowerCase();
    const hasExact = (matches || []).some(
      (it) => it.item_name.toString().trim().toLowerCase() === q
    );

    if (!hasExact) {
      // open modal to collect more data for new product
      setShowModal(true);
      return;
    }

    // if exact match exists, instruct user to click the found item
    setSuccess("Produkt bereits vorhanden — bitte aus der Liste auswählen");
  }

  async function createNewProduct(e) {
    e?.preventDefault?.();
    setError("");
    setSuccess("");

    if (!itemname || itemname.trim() === "") {
      setError("Ein Name muss eingetragen werden");
      return;
    }

    try {
      await supabase.from("shopping_items").insert({
        user_id: userId,
        item_name: itemname,
        item_price: Number(item_price) || 0.0,
        item_on_list: true,
        item_is_open: true,
        item_amount: Number(item_amount) || 1,
        item_on_weekly_list: Boolean(item_on_weekly_list),
        item_comment: item_comment || "",
        supermarket: supermarket || null,
        item_creator: user_name,
        added_at: new Date().toISOString(),
      });

      setSuccess("Neues Produkt erstellt und zur Liste hinzugefügt");
      setItemname("");
      setSearchTerm("");
      setShowModal(false);
      setItem_amount(1);
      setItem_price(0);
      setItem_on_weekly_list(false);
      setItem_comment("");
      setSupermarket("");

      try {
        window.dispatchEvent(new CustomEvent("items:changed"));
      } catch (e) {
        console.log(e);
      }
    } catch (err) {
      setError(String(err));
      console.error(err);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function loadSupermarkets() {
      try {
        const { data, error } = await supabase
          .from("shopping_items")
          .select("supermarket");
        if (error) {
          console.error("Supabase error (supermarkets):", error);
          return;
        }
        if (!mounted) return;
        const arr = (data || [])
          .map((r) => r.supermarket)
          .filter((s) => s && s.toString().trim() !== "");
        const unique = Array.from(
          new Set(arr.map((s) => s.toString().trim()))
        ).sort();
        setSupermarkets(unique);
      } catch (err) {
        console.error(err);
      }
    }

    loadSupermarkets();
    const onItemsChanged = () => loadSupermarkets();
    window.addEventListener("items:changed", onItemsChanged);
    return () => {
      mounted = false;
      window.removeEventListener("items:changed", onItemsChanged);
    };
  }, []);

  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <h4 style={{ margin: "0" }}>Produkt Suchen/Hinzufügen</h4>
      <form onSubmit={handleAddItem}>
        <input
          type="text"
          value={itemname}
          onChange={handleInputChange}
          placeholder="Item Bezeichnung"
          className="searchbar"
        />
        <datalist id="supermarket-list">
          {supermarkets.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button className="btn">Neu Hinzufügen</button>
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          {matches.length > 0 && (
            <div style={{ border: "1px solid #ddd", padding: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 6 }}>Treffer:</div>
              <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                {matches.map((m) => (
                  <li
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: 6,
                    }}
                  >
                    <span>{m.item_name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        addExistingItem(m.id);
                        // clear local and parent search state immediately
                        setItemname("");
                        setSearchTerm("");
                      }}
                      title={`Zur Einkaufsliste hinzufügen: ${m.item_name}`}
                      className="btn"
                    >
                      Hinzufügen
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {error ? (
          <p style={{ color: "red" }}>
            Da ist etwas schief gelaufen <br></br> {error}
          </p>
        ) : (
          <p style={{ color: "green" }}>{success}</p>
        )}
      </form>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            background: "#1b2336ff",
            border: "1px solid #ccc",
            padding: 12,
            zIndex: 50,
            boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
          }}
        >
          <h3>Neues Produkt anlegen</h3>
          <form onSubmit={createNewProduct}>
            <div className="modal-form editing">
              <label className="modal-label">
                Bezeichnung
                <span>{itemname}</span>
              </label>

              <label className="modal-label">
                Supermarkt
                <select
                  className="input-fields"
                  value={showCustomSupermarket ? "__other__" : supermarket}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__other__") {
                      setShowCustomSupermarket(true);
                      setCustomSupermarket("");
                      setSupermarket("");
                    } else {
                      setShowCustomSupermarket(false);
                      setSupermarket(v);
                      setCustomSupermarket("");
                    }
                  }}
                  style={{ width: "48%", minWidth: 160 }}
                >
                  <option value="">— auswählen —</option>
                  {supermarkets.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="__other__">
                    Neuen Supermarkt hinzufügen…
                  </option>
                </select>
                {showCustomSupermarket ? (
                  <input
                    list="supermarket-list"
                    placeholder="Neuer Supermarkt"
                    value={customSupermarket}
                    onChange={(e) => {
                      setCustomSupermarket(e.target.value);
                      setSupermarket(e.target.value);
                    }}
                    className="input-fields"
                    style={{ width: "48%" }}
                  />
                ) : null}
              </label>

              <label className="modal-label">
                Preis
                <input
                  type="number"
                  step="0.01"
                  value={item_price}
                  onChange={(e) => setItem_price(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="input-fields"
                />
              </label>

              <label className="modal-label">
                Menge
                <input
                  type="number"
                  min="1"
                  value={item_amount}
                  onChange={(e) => setItem_amount(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="input-fields"
                />
              </label>

              <label className="modal-label">
                Kommentar
                <input
                  type="text"
                  value={item_comment}
                  onChange={(e) => setItem_comment(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="input-fields"
                />
              </label>

              <label
                className="modal-label"
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                Auf Wochenliste
                <input
                  className="input-checkbox"
                  type="checkbox"
                  checked={item_on_weekly_list}
                  onChange={(e) => setItem_on_weekly_list(e.target.checked)}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                type="button"
                className="btn cancel-btn"
                onClick={() => {
                  setShowModal(false);
                }}
              >
                Abbrechen
              </button>
              <button type="submit" className="btn submit-btn">
                Erstellen
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default NewItemForm;
