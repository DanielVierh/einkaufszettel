import { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";
import NewItemForm from "./NewItemForm";
import ItemModal from "./ItemModal";

const ItemList = ({ visible = false, onClose, userId, user_name } = {}) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [showWeeklySelectionModal, setShowWeeklySelectionModal] =
    useState(false);
  const [selectedWeeklyItemIds, setSelectedWeeklyItemIds] = useState([]);
  const [weeklySelectionSaving, setWeeklySelectionSaving] = useState(false);

  async function updateItem(id, changes) {
    try {
      const { error } = await supabase
        .from("shopping_items")
        .update(changes)
        .eq("id", id);
      if (error) throw error;
      window.dispatchEvent(new CustomEvent("items:changed"));
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem((prev) => ({ ...(prev ?? {}), ...changes }));
      }
    } catch (err) {
      console.error("Update error", err);
      alert("Fehler beim Aktualisieren: " + String(err));
    }
  }

  async function deleteItem(id) {
    try {
      const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
      window.dispatchEvent(new CustomEvent("items:changed"));
    } catch (err) {
      console.error("Delete error", err);
      alert("Fehler beim Löschen: " + String(err));
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data, error } = await supabase.from("shopping_items").select();

        if (error) {
          console.error("Supabase error:", error);
          return;
        }
        if (mounted) setItems(data ?? []);
      } catch (err) {
        console.error(err);
      }
    }

    load();

    const onItemsChanged = () => {
      load();
    };
    window.addEventListener("items:changed", onItemsChanged);

    return () => {
      mounted = false;
      window.removeEventListener("items:changed", onItemsChanged);
    };
  }, [userId]);

  async function handle_create_weeklyList() {
    const recurringItems = (items ?? []).filter(
      (item) => item.item_on_weekly_list,
    );
    setSelectedWeeklyItemIds(
      recurringItems.map((item) => item.id).filter(Boolean),
    );
    setShowWeeklySelectionModal(true);
  }

  function toggleWeeklySelectionItem(itemId) {
    setSelectedWeeklyItemIds((prev) => {
      if (prev.includes(itemId)) return prev.filter((id) => id !== itemId);
      return [...prev, itemId];
    });
  }

  async function handleApplyWeeklySelection() {
    if (selectedWeeklyItemIds.length === 0) return;

    setWeeklySelectionSaving(true);
    try {
      const { error } = await supabase
        .from("shopping_items")
        .update({
          item_on_list: true,
          added_at: new Date().toISOString(),
          item_creator: user_name ?? null,
        })
        .in("id", selectedWeeklyItemIds);
      if (error) throw error;

      setStatus(
        `${selectedWeeklyItemIds.length} Items auf Einkaufsliste gesetzt`,
      );
      const statusEl = document.getElementById("status");
      statusEl?.classList.add("active");
      setTimeout(() => {
        setStatus("");
        statusEl?.classList.remove("active");
      }, 3000);

      setShowWeeklySelectionModal(false);
      window.dispatchEvent(new CustomEvent("items:changed"));
      setSearchTerm("");
    } catch (err) {
      console.error("Apply weekly selection error", err);
      alert("Fehler beim Erstellen der Wocheneinkaufsliste: " + String(err));
    } finally {
      setWeeklySelectionSaving(false);
    }
  }

  const filteredItems =
    searchTerm && searchTerm.trim() !== ""
      ? items.filter((it) =>
          it.item_name
            .toString()
            .toLowerCase()
            .includes(searchTerm.toString().toLowerCase()),
        )
      : items;

  const recurringItems = (items ?? []).filter(
    (item) => item.item_on_weekly_list,
  );

  async function addExistingItem(id, product_name) {
    try {
      const { error } = await supabase
        .from("shopping_items")
        .update({
          item_on_list: true,
          added_at: new Date().toISOString(),
          item_creator: user_name ?? null,
        })
        .eq("id", id);
      handle_status(product_name);
      if (error) throw error;
      window.dispatchEvent(new CustomEvent("items:changed"));
      setSearchTerm("");
    } catch (err) {
      console.error("Add existing error", err);
      alert("Fehler beim Hinzufügen: " + String(err));
    }
  }

  function handle_status(product_name) {
    setStatus(`${product_name} hinzugefügt`);
    const statusEl = document.getElementById("status");
    statusEl?.classList.add("active");
    setTimeout(() => {
      setStatus("");
      statusEl?.classList.remove("active");
    }, 3000);
  }

  return (
    <section className={`product-list ${visible ? "active" : ""}`}>
      <h2>Alle Produkte ({filteredItems.length})</h2>
      <NewItemForm
        userId={userId}
        user_name={user_name}
        items={items}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        addExistingItem={addExistingItem}
      />
      <p id="status" className="status">
        {status}
      </p>
      <ul className="list-wrapper">
        {filteredItems.map((item) => (
          <li
            key={item.id ?? item.item_name}
            className={`product ${item.item_on_list ? "on-list" : ""}`}
            onClick={() => setSelectedItem(item)}
          >
            <div
              className={`item-price ${
                item.item_amount > 1 && "multiple-amount"
              }`}
            >
              {item.item_price && `${item.item_amount} x ${item.item_price} €`}
            </div>
            <div style={{ fontSize: "1rem" }}>
              {item.item_comment && "ℹ"} {item.item_on_weekly_list && "∞"}
            </div>
            <div className="product-name-div">{item.item_name}</div>
            <div
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                display: "flex",
                gap: 6,
              }}
            ></div>
          </li>
        ))}
      </ul>
      {selectedItem ? (
        <ItemModal
          key={selectedItem.id ?? "item-modal"}
          item={selectedItem}
          userId={userId}
          user_name={user_name}
          onClose={() => setSelectedItem(null)}
          onUpdate={updateItem}
          onDelete={deleteItem}
        />
      ) : null}
      <button className="btn" onClick={handle_create_weeklyList}>
        Wocheneinkaufsliste
      </button>
      {showWeeklySelectionModal ? (
        <div
          className="modal-overlay"
          onClick={() => {
            if (weeklySelectionSaving) return;
            setShowWeeklySelectionModal(false);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Wocheneinkaufsliste erstellen</h3>
            </div>

            <div className="modal-body">
              {recurringItems.length === 0 ? (
                <p style={{ margin: 0, color: "#bbb" }}>
                  Es sind keine wiederkehrenden Items vorhanden.
                </p>
              ) : (
                <div className="recipe-ingredient-list">
                  {recurringItems.map((item) => {
                    const selected = selectedWeeklyItemIds.includes(item.id);
                    return (
                      <label key={item.id} className="recipe-ingredient-row">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleWeeklySelectionItem(item.id)}
                        />
                        <span>{item.item_name}</span>
                        <span className="recipe-ingredient-market">
                          {item.supermarket || "-"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <p style={{ marginTop: 10, marginBottom: 0, color: "#bbb" }}>
                Ausgewählt: {selectedWeeklyItemIds.length}
              </p>
            </div>

            <div className="modal-footer" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn cancel-btn"
                onClick={() => setShowWeeklySelectionModal(false)}
                disabled={weeklySelectionSaving}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="btn submit-btn"
                onClick={handleApplyWeeklySelection}
                disabled={
                  weeklySelectionSaving || selectedWeeklyItemIds.length === 0
                }
              >
                {weeklySelectionSaving
                  ? "Setze auf Liste..."
                  : "Auf Einkaufsliste setzen"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <button
        className="btn product-list--button-ready"
        onClick={() => {
          if (typeof onClose === "function") onClose();
        }}
      >
        Fertig
      </button>
    </section>
  );
};

export default ItemList;
