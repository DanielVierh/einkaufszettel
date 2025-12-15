import { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";
import NewItemForm from "./NewItemForm";
import ItemModal from "./ItemModal";

const ItemList = ({ visible = false, onClose, userId, user_name } = {}) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
  }, []);

  const filteredItems =
    searchTerm && searchTerm.trim() !== ""
      ? items.filter((it) =>
          it.item_name
            .toString()
            .toLowerCase()
            .includes(searchTerm.toString().toLowerCase())
        )
      : items;

  async function addExistingItem(id) {
    try {
      const { error } = await supabase
        .from("shopping_items")
        .update({ item_on_list: true })
        .eq("id", id);
      if (error) throw error;
      window.dispatchEvent(new CustomEvent("items:changed"));
      setSearchTerm("");
    } catch (err) {
      console.error("Add existing error", err);
      alert("Fehler beim Hinzufügen: " + String(err));
    }
  }

  return (
    <section className={`product-list ${visible ? "active" : ""}`}>
      <h2>Alle Produkte</h2>
      <NewItemForm
        userId={userId}
        user_name={user_name}
        items={items}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        addExistingItem={addExistingItem}
      />
      <ul className="list-wrapper">
        {filteredItems.map((item) => (
          <li
            key={item.id ?? item.item_name}
            className={`product ${item.item_on_list ? "on-list" : ""}`}
            onClick={() => setSelectedItem(item)}
          >
            <div className="product-name-div">{item.item_name}</div>
            <div
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                display: "flex",
                gap: 6,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateItem(item.id, { item_on_list: !item.item_on_list });
                }}
                title="An/Aus auf Einkaufsliste"
              >
                {item.item_on_list ? "- List" : "+ List"}
              </button>
              <button
                className="product-list--delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Produkt "${item.item_name}" wirklich löschen?`))
                    deleteItem(item.id);
                }}
                title="Löschen"
              >
                🗑️
              </button>
            </div>
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
      {/* <button className="btn">Wocheneinkaufsliste</button> */}
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
