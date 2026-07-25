import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addIngredientItemsToShoppingList,
  createRecipe,
  deleteRecipe,
  fetchRecipeIngredientItems,
  fetchShoppingItemsForRecipe,
  updateRecipe,
} from "../lib/weeklyPlanApi";

const RecipeModal = ({
  visible,
  userId,
  userName,
  openListSelectionInitially = false,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
  recipeToEdit,
} = {}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showListSelectionModal, setShowListSelectionModal] = useState(false);
  const [listSelectionItems, setListSelectionItems] = useState([]);
  const [selectedListItemIds, setSelectedListItemIds] = useState([]);
  const [listSelectionLoading, setListSelectionLoading] = useState(false);
  const [didAutoOpenListSelection, setDidAutoOpenListSelection] =
    useState(false);
  const isEditMode = Boolean(recipeToEdit?.id);

  useEffect(() => {
    if (!visible) return;

    if (isEditMode && recipeToEdit) {
      setTitle(recipeToEdit.title ?? "");
      setDescription(recipeToEdit.description ?? "");
      setSelectedIngredients(
        (recipeToEdit.recipe_ingredients ?? [])
          .map((it) => it.shopping_item_id)
          .filter(Boolean),
      );
    } else {
      setTitle("");
      setDescription("");
      setSelectedIngredients([]);
    }

    setSearch("");
    setStatus("");
    setError("");
    setShowListSelectionModal(false);
    setListSelectionItems([]);
    setSelectedListItemIds([]);
    setListSelectionLoading(false);
    setDidAutoOpenListSelection(false);
  }, [visible, isEditMode, recipeToEdit]);

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

  const selectedIngredientItems = useMemo(() => {
    if (!selectedIngredients.length) return [];
    const selectedSet = new Set(selectedIngredients);
    return (availableItems ?? []).filter((item) => selectedSet.has(item.id));
  }, [availableItems, selectedIngredients]);

  function toggleIngredient(itemId) {
    setSelectedIngredients((prev) => {
      if (prev.includes(itemId)) return prev.filter((id) => id !== itemId);
      return [...prev, itemId];
    });
  }

  function toggleListSelectionItem(itemId) {
    setSelectedListItemIds((prev) => {
      if (prev.includes(itemId)) return prev.filter((id) => id !== itemId);
      return [...prev, itemId];
    });
  }

  const openListSelectionModal = useCallback(async () => {
    if (!recipeToEdit?.id) return;

    setError("");
    setStatus("");
    setListSelectionLoading(true);
    try {
      const ingredientItems = await fetchRecipeIngredientItems(recipeToEdit.id);
      setListSelectionItems(ingredientItems);
      setSelectedListItemIds(ingredientItems.map((item) => item.id));
      setShowListSelectionModal(true);
    } catch (err) {
      console.error(err);
      setError("Zutaten konnten nicht geladen werden.");
    } finally {
      setListSelectionLoading(false);
    }
  }, [recipeToEdit]);

  useEffect(() => {
    if (!visible) return;
    if (!openListSelectionInitially) return;
    if (!isEditMode || !recipeToEdit?.id) return;
    if (didAutoOpenListSelection) return;
    if (showListSelectionModal || listSelectionLoading) return;
    setDidAutoOpenListSelection(true);
    openListSelectionModal();
  }, [
    visible,
    openListSelectionInitially,
    isEditMode,
    recipeToEdit,
    didAutoOpenListSelection,
    showListSelectionModal,
    listSelectionLoading,
    openListSelectionModal,
  ]);

  async function handleAddSelectedItemsToList() {
    setError("");
    setStatus("");
    setSaving(true);
    try {
      const count = await addIngredientItemsToShoppingList({
        itemIds: selectedListItemIds,
        userName,
      });
      setStatus(`${count} Zutaten auf Einkaufsliste gesetzt.`);
      setShowListSelectionModal(false);
      window.dispatchEvent(new CustomEvent("items:changed"));
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setStatus("");

    if (!title.trim()) {
      setError("Bitte einen Titel eingeben.");
      return;
    }

    setSaving(true);
    try {
      if (isEditMode && recipeToEdit?.id) {
        await updateRecipe({
          recipeId: recipeToEdit.id,
          title,
          description,
          ingredientItemIds: selectedIngredients,
        });
        setStatus("Rezept wurde aktualisiert.");
        if (typeof onUpdated === "function") onUpdated(recipeToEdit.id);
      } else {
        const recipe = await createRecipe({
          userId,
          title,
          description,
          ingredientItemIds: selectedIngredients,
        });

        setStatus("Rezept wurde erstellt.");
        if (typeof onCreated === "function") onCreated(recipe);
      }
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!recipeToEdit?.id) return;
    if (!window.confirm(`Rezept "${recipeToEdit.title}" wirklich löschen?`)) {
      return;
    }

    setSaving(true);
    setError("");
    setStatus("");
    try {
      await deleteRecipe(recipeToEdit.id);
      if (typeof onDeleted === "function") onDeleted(recipeToEdit.id);
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
    <div
      className="modal-overlay recipe-modal-overlay"
      onClick={() => onClose?.()}
    >
      <div className="modal recipe-modal" onClick={(e) => e.stopPropagation()}>
        <form
          onSubmit={handleSubmit}
          style={{ minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <div className="modal-header">
            <h3>{isEditMode ? "Rezept bearbeiten" : "Rezept hinzufügen"}</h3>
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
                <textarea
                  className="input-fields"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Anleitung"
                />
              </label>

              <label className="modal-label">
                Zutaten suchen
                <input
                  className="input-fields"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.currentTarget.select()}
                  placeholder="Nach Item suchen"
                />
              </label>

              {isEditMode ? (
                <div className="recipe-selected-ingredients">
                  <p className="recipe-selected-title">Aktuell im Rezept</p>
                  {selectedIngredientItems.length === 0 ? (
                    <p className="recipe-selected-empty">
                      Noch keine Zutaten ausgewählt.
                    </p>
                  ) : (
                    <div className="recipe-selected-list">
                      {selectedIngredientItems.map((item) => (
                        <div key={item.id} className="recipe-selected-item">
                          <span>{item.item_name}</span>
                          <small>{item.supermarket || "-"}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

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
            style={{ gap: 20, justifyContent: "center" }}
          >
            {isEditMode ? (
              <button
                type="button"
                className="btn"
                onClick={openListSelectionModal}
                disabled={saving || listSelectionLoading}
              >
                {listSelectionLoading
                  ? "Lade Zutaten..."
                  : "Zutaten auf Einkaufsliste"}
              </button>
            ) : null}
            <button
              type="button"
              className="btn cancel-btn"
              onClick={() => onClose?.()}
            >
              Abbrechen
            </button>
            {isEditMode ? (
              <button
                type="button"
                className="btn product-list--delete-btn"
                onClick={handleDelete}
                disabled={saving}
                style={{ color: "red" }}
              >
                Löschen
              </button>
            ) : null}
            <button type="submit" className="btn submit-btn" disabled={saving}>
              {saving
                ? "Speichern..."
                : isEditMode
                  ? "Änderungen speichern"
                  : "Rezept speichern"}
            </button>
          </div>
        </form>

        {showListSelectionModal ? (
          <div
            className="modal-overlay"
            onClick={() => setShowListSelectionModal(false)}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Zutaten wählen: {recipeToEdit?.title}</h3>
              </div>

              <div className="modal-body">
                {listSelectionItems.length === 0 ? (
                  <p style={{ margin: 0, color: "#bbb" }}>
                    Dieses Rezept hat keine hinterlegten Zutaten.
                  </p>
                ) : (
                  <div className="recipe-ingredient-list">
                    {listSelectionItems.map((item) => {
                      const selected = selectedListItemIds.includes(item.id);
                      return (
                        <label key={item.id} className="recipe-ingredient-row">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleListSelectionItem(item.id)}
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
                  Ausgewählt: {selectedListItemIds.length}
                </p>
              </div>

              <div className="modal-footer" style={{ gap: 8 }}>
                <button
                  type="button"
                  className="btn cancel-btn"
                  onClick={() => setShowListSelectionModal(false)}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="btn submit-btn"
                  onClick={handleAddSelectedItemsToList}
                  disabled={saving || selectedListItemIds.length === 0}
                >
                  {saving ? "Setze auf Liste..." : "Auf Liste setzen"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RecipeModal;
