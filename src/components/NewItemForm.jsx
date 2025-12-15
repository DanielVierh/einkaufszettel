import { useState, useMemo } from "react";
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
        item_creator: user_name,
      });

      setSuccess("Neues Produkt erstellt und zur Liste hinzugefügt");
      setItemname("");
      setSearchTerm("");
      setShowModal(false);
      setItem_amount(1);
      setItem_price(0);
      setItem_on_weekly_list(false);
      setItem_comment("");

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

  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <h2>Produkt Suchen/Hinzufügen</h2>
      <form onSubmit={handleAddItem}>
        <input
          type="text"
          value={itemname}
          onChange={handleInputChange}
          placeholder="Item Bezeichnung"
          className="searchbar"
        />

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
                      onClick={() => addExistingItem(m.id)}
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

        <button className="btn">Hinzufügen</button>

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
            <div style={{ marginBottom: 8 }}>
              <label>Bezeichnung:</label>
              <div>{itemname}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ marginRight: 12 }}>Preis:</label>
              <input
                type="number"
                step="0.01"
                value={item_price}
                onChange={(e) => setItem_price(e.target.value)}
                className="input-fields"
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ marginRight: 12 }}>Menge:</label>
              <input
                type="number"
                min="1"
                value={item_amount}
                onChange={(e) => setItem_amount(e.target.value)}
                className="input-fields"
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ marginRight: 12 }}>Kommentar:</label>
              <input
                type="text"
                value={item_comment}
                onChange={(e) => setItem_comment(e.target.value)}
                className="input-fields"
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>
                <input
                  type="checkbox"
                  checked={item_on_weekly_list}
                  onChange={(e) => setItem_on_weekly_list(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Auf Wochenliste
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
