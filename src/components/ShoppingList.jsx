import { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";
import ItemModal from "./ItemModal";

const ShoppingList = ({ onToggleItemList } = {}) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  async function handleGetList() {
    try {
      const { data, error } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("item_on_list", true);

      if (error) {
        console.error("Supabase error:", error);
        return [];
      }
      return data ?? [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async function updateItem(id, changes) {
    try {
      const { error } = await supabase
        .from("shopping_items")
        .update(changes)
        .eq("id", id);
      if (error) throw error;
      window.dispatchEvent(new CustomEvent("items:changed"));
      // If the updated item is currently selected in the modal, update it locally so the modal shows new values immediately
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
      if (selectedItem && selectedItem.id === id) setSelectedItem(null);
    } catch (err) {
      console.error("Delete error", err);
      alert("Fehler beim Löschen: " + String(err));
    }
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      const data = await handleGetList();
      if (mounted) setItems(data);
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
  }, []);

  const parsePrice = (val) => {
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  };

  const totalSum = items.reduce((acc, it) => {
    const price = parsePrice(it.item_price);
    const amount = Number.isFinite(Number(it.item_amount))
      ? Number(it.item_amount)
      : 0;
    return acc + price * amount;
  }, 0);

  return (
    <section className="shopping-list">
      <h2>Einkaufszettel</h2>
      <div>
        <span className="shopping-sum">Gesamt: {totalSum.toFixed(2)} €</span>
      </div>
      <ul className="list-wrapper">
        {items.map((item) => (
          <li
            key={item.id ?? item.item_name}
            className={`product ${item.item_on_list ? "on-list" : ""} ${
              item.item_is_open ? "item-open" : ""
            }`}
            onClick={() => setSelectedItem(item)}
          >
            <div>{item.item_comment ? "ℹ️" : ""}</div>
            <div>
              {item.item_amount > 1 ? (
                <span className="amount-label">{item.item_amount} x</span>
              ) : (
                ""
              )}
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
          onClose={() => setSelectedItem(null)}
          onUpdate={updateItem}
          onDelete={deleteItem}
        />
      ) : null}
      <div style={{ marginTop: 12 }}>
        <button
          className="btn shopping-list--refresh-btn"
          onClick={async () => {
            const data = await handleGetList();
            setItems(data);
          }}
        >
          Aktualisieren
        </button>
        <br />
        <button
          className="btn shopping-list--add-btn"
          onClick={() => {
            if (typeof onToggleItemList === "function") onToggleItemList();
          }}
        >
          Hinzufügen
        </button>
      </div>
    </section>
  );
};

export default ShoppingList;
