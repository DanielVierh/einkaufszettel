import { useEffect, useState, useMemo } from "react";
import supabase from "../lib/supabaseClient";
import ItemModal from "./ItemModal";

const supermarketPalette = [
  "#0c90e2ff",
  "#f97316",
  "#11b47eff",
  "#ffffffff",
  "#ebf838ff",
  "#ed1414ff",
  "teal",
  "aqua",
];

const ShoppingList = ({ onToggleItemList, user_name } = {}) => {
  const [items, setItems] = useState([]);
  const [sortBy, setSortBy] = useState("added_at");
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemAmount, setItemAmount] = useState(0);
  const colorForSupermarket = (name) => {
    if (!name) return null;
    // simple deterministic hash
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = (h << 5) - h + name.charCodeAt(i);
      h |= 0;
    }
    const idx = Math.abs(h) % supermarketPalette.length;
    return supermarketPalette[idx];
  };

  const supermarketsList = useMemo(() => {
    const arr = (items || [])
      .map((it) => it.supermarket)
      .filter((s) => s && s.toString().trim() !== "")
      .map((s) => s.toString().trim());
    return Array.from(new Set(arr)).sort();
  }, [items]);

  const supermarketColorMap = useMemo(() => {
    const map = {};
    supermarketsList.forEach((s, i) => {
      if (i < supermarketPalette.length) {
        map[s] = supermarketPalette[i];
      } else {
        const hue = Math.round((i * 137.508) % 360); // golden angle for distribution
        map[s] = `hsl(${hue}, 65%, 55%)`;
      }
    });
    return map;
  }, [supermarketsList]);

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
      if (mounted) {
        setItems(data);
        // set count directly from freshly fetched data (avoid using stale `items` or timeouts)
        setItemAmount((data && data.length) || 0);
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

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "name") {
      const an = (a.item_name || "").toString();
      const bn = (b.item_name || "").toString();
      return an.localeCompare(bn, undefined, { sensitivity: "base" });
    }
    if (sortBy === "supermarket") {
      const sa = (a.supermarket || "").toString();
      const sb = (b.supermarket || "").toString();
      const cmp = sa.localeCompare(sb, undefined, { sensitivity: "base" });
      if (cmp !== 0) return cmp;
      // fallback to name when supermarkets equal
      const an = (a.item_name || "").toString();
      const bn = (b.item_name || "").toString();
      return an.localeCompare(bn, undefined, { sensitivity: "base" });
    }
    if (sortBy === "added_at") {
      const ta = a.added_at ? new Date(a.added_at).getTime() : 0;
      const tb = b.added_at ? new Date(b.added_at).getTime() : 0;
      return tb - ta; // newest first
    }
    return 0;
  });

  return (
    <section className="shopping-list">
      <h2>Einkaufszettel</h2>
      {supermarketsList.length > 0 ? (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            margin: "8px 10px",
          }}
        >
          {supermarketsList.map((s) => (
            <div
              key={s}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor:
                    supermarketColorMap[s] ?? colorForSupermarket(s),
                }}
              />
              <span style={{ fontSize: 12, color: "#666" }}>{s}</span>
            </div>
          ))}
        </div>
      ) : null}
      <span className="shopping-sum">Gesamt: {totalSum.toFixed(2)} €</span>
      <div>Anzahl {itemAmount}</div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 6,
        }}
      >
        <button
          className={"btn" + (sortBy === "name" ? " active" : "")}
          onClick={() => setSortBy((s) => (s === "name" ? "none" : "name"))}
          title="Alphabetisch nach Name"
        >
          A–Z
        </button>
        <button
          className={"btn" + (sortBy === "supermarket" ? " active" : "")}
          onClick={() =>
            setSortBy((s) => (s === "supermarket" ? "none" : "supermarket"))
          }
          title="Nach Supermarkt"
        >
          Supermarkt
        </button>
        <button
          className={"btn" + (sortBy === "added_at" ? " active" : "")}
          onClick={() =>
            setSortBy((s) => (s === "added_at" ? "none" : "added_at"))
          }
          title="Nach hinzugefügt (neueste zuerst)"
        >
          Datum
        </button>
      </div>
      {items.length > 0 ? (
        <ul className="list-wrapper">
          {sortedItems.map((item) => (
            <li
              key={item.id ?? item.item_name}
              className={`product ${item.item_on_list ? "on-list" : ""} ${
                item.item_is_open ? "item-open" : ""
              }`}
              onClick={() => setSelectedItem(item)}
            >
              {/* colored dot for supermarket */}
              {item.supermarket ? (
                <div
                  title={item.supermarket}
                  style={{
                    position: "absolute",
                    left: 5,
                    top: 5,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor:
                      supermarketColorMap[item.supermarket] ??
                      colorForSupermarket(item.supermarket),
                  }}
                />
              ) : null}
              <div
                className={`item-price ${
                  item.item_amount > 1 && "multiple-amount"
                }`}
              >
                {item.item_price &&
                  `${item.item_amount} x ${item.item_price} €`}
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
      ) : (
        <div>
          <h2> Einkaufsliste ist leer 🛒</h2>
          <p style={{ color: "gray" }}>"Habt ihr an Kaffee gedacht?" 🐑</p>
        </div>
      )}
      {selectedItem ? (
        <ItemModal
          key={selectedItem.id ?? "item-modal"}
          item={selectedItem}
          user_name={user_name}
          onClose={() => setSelectedItem(null)}
          onUpdate={updateItem}
          onDelete={deleteItem}
        />
      ) : null}
      <div style={{ marginTop: 12 }}>
        <button
          className="btn shopping-list--refresh-btn"
          onClick={async () => {
            window.location.reload();
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
