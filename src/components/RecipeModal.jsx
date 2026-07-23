import { useEffect, useMemo, useState } from "react";
import {
  createRecipe,
  fetchShoppingItemsForRecipe,
} from "../lib/weeklyPlanApi";

const RecipeModal = ({ visible, userId, onClose, onCreated } = {}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    document.body.classList.add("modal-open");
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (!visible || !userId) return;

    let mounted = true;
    async function load() {
      setError("");
      try {
        const data = await fetchShoppingItemsForRecipe(userId);
        if (mounted) setAvailableItems(data);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Zutaten konnten nicht geladen werden.");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [visible, userId]);

  const filteredItems = useMemo(() => {
    const q = (search ?? "").toString().trim().toLowerCase();
    if (!q) return availableItems;
    return (availableItems ?? []).filter((item) =>
      (item.item_name ?? "").toString().toLowerCase().includes(q),
    );
  }, [availableItems, search]);

  function toggleIngredient(itemId) {
    setSelectedIngredients((prev) => {
      if (prev.includes(itemId)) return prev.filter((id) => id !== itemId);
      return [...prev, itemId];
    });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setStatus("");

    if (!title.trim()) {
      setError("Bitte einen Titel eingeben.");
      return;
    }

    setSaving(true);
    try {
      const recipe = await createRecipe({
        userId,
        title,
        description,
        ingredientItemIds: selectedIngredients,
      });

      setStatus("Rezept wurde erstellt.");
      setTitle("");
      setDescription("");
      setSelectedIngredients([]);
      setSearch("");

      if (typeof onCreated === "function") onCreated(recipe);
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    } finally {
      setSaving(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={() => onClose?.()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <form
          onSubmit={handleCreate}
          style={{ minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <div className="modal-header">
            <h3>Rezept hinzufügen</h3>
          </div>

          <div className="modal-body">
            <div className="modal-form editing">
              <label className="modal-label">
                Titel
                <input
                  className="input-fields"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Nudeln mit Tomatensauce"
                />
              </label>

              <label className="modal-label">
                Beschreibung
                <textarea
                  className="input-fields"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kurzbeschreibung"
                />
              </label>

              <label className="modal-label">
                Zutaten suchen
                <input
                  className="input-fields"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nach Item suchen"
                />
              </label>

              <div className="recipe-ingredient-list">
                {filteredItems.length === 0 ? (
                  <p style={{ margin: 0, color: "#bbb" }}>
                    Keine passenden Zutaten gefunden.
                  </p>
                ) : (
                  filteredItems.map((item) => {
                    const selected = selectedIngredients.includes(item.id);
                    return (
                      <label key={item.id} className="recipe-ingredient-row">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleIngredient(item.id)}
                        />
                        <span>{item.item_name}</span>
                        <span className="recipe-ingredient-market">
                          {item.supermarket || "-"}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              <p style={{ margin: 0, color: "#bbb" }}>
                Ausgewählt: {selectedIngredients.length}
              </p>
              {status ? <p style={{ color: "lightgreen" }}>{status}</p> : null}
              {error ? <p style={{ color: "salmon" }}>{error}</p> : null}
            </div>
          </div>

          <div
            className="modal-footer"
            style={{ gap: 8, justifyContent: "center" }}
          >
            <button
              type="button"
              className="btn cancel-btn"
              onClick={() => onClose?.()}
            >
              Abbrechen
            </button>
            <button type="submit" className="btn submit-btn" disabled={saving}>
              {saving ? "Speichern..." : "Rezept speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipeModal;
