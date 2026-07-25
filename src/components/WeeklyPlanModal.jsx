import { useCallback, useEffect, useMemo, useState } from "react";
import RecipeModal from "./RecipeModal";
import {
  WEEK_DAYS,
  addRecipeIngredientsToShoppingList,
  assignRecipeToWeekday,
  fetchRecipes,
  fetchWeeklyPlan,
  removeRecipeFromWeekday,
} from "../lib/weeklyPlanApi";

const WeeklyPlanModal = ({ visible, userId, userName, onClose } = {}) => {
  const [recipes, setRecipes] = useState([]);
  const [weeklyEntries, setWeeklyEntries] = useState([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [pickerWeekday, setPickerWeekday] = useState(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    document.body.classList.add("modal-open");
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showRecipeModal) {
          setShowRecipeModal(false);
          return;
        }
        if (showRecipePicker) {
          setShowRecipePicker(false);
          setPickerWeekday(null);
          setPickerSearch("");
          return;
        }
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [visible, showRecipeModal, showRecipePicker, onClose]);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const [recipesData, weeklyPlanData] = await Promise.all([
        fetchRecipes(userId),
        fetchWeeklyPlan(userId),
      ]);
      setRecipes(recipesData);
      setWeeklyEntries(weeklyPlanData);
    } catch (err) {
      console.error(err);
      setError("Wochenplan konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!visible) return;
    loadAll();
  }, [visible, loadAll]);

  useEffect(() => {
    if (!visible) return;
    const onWeeklyChanged = () => loadAll();
    window.addEventListener("weekly-plan:changed", onWeeklyChanged);
    return () =>
      window.removeEventListener("weekly-plan:changed", onWeeklyChanged);
  }, [visible, loadAll]);

  const entryByWeekday = useMemo(() => {
    const map = new Map();
    (weeklyEntries ?? []).forEach((entry) => {
      map.set(entry.weekday, entry);
    });
    return map;
  }, [weeklyEntries]);

  function openRecipePicker(weekday) {
    setPickerWeekday(weekday);
    setPickerSearch("");
    setShowRecipePicker(true);
  }

  async function handleAssign(weekday, recipeId) {
    setStatus("");
    setError("");
    if (!recipeId) {
      await handleRemove(weekday);
      return;
    }

    try {
      await assignRecipeToWeekday({
        userId,
        weekday,
        recipeId,
      });
      setStatus("Rezept wurde dem Tag zugewiesen.");
      window.dispatchEvent(new CustomEvent("weekly-plan:changed"));
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    }
  }

  async function handleRemove(weekday) {
    setStatus("");
    setError("");
    try {
      await removeRecipeFromWeekday({ userId, weekday });
      setStatus("Zuordnung entfernt.");
      window.dispatchEvent(new CustomEvent("weekly-plan:changed"));
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    }
  }

  async function handleAddIngredients(recipeId) {
    setStatus("");
    setError("");
    try {
      const count = await addRecipeIngredientsToShoppingList({
        recipeId,
        userName,
      });
      setStatus(`${count} Zutaten auf Einkaufsliste gesetzt.`);
      window.dispatchEvent(new CustomEvent("items:changed"));
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    }
  }

  async function handlePickRecipe(recipeId) {
    if (!pickerWeekday) return;
    await handleAssign(pickerWeekday, recipeId);
    setShowRecipePicker(false);
    setPickerWeekday(null);
    setPickerSearch("");
  }

  const filteredRecipesForPicker = useMemo(() => {
    const q = (pickerSearch ?? "").toString().trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((recipe) =>
      (recipe.title ?? "").toString().toLowerCase().includes(q),
    );
  }, [pickerSearch, recipes]);

  const pickerWeekdayLabel = useMemo(() => {
    return WEEK_DAYS.find((day) => day.value === pickerWeekday)?.label ?? "";
  }, [pickerWeekday]);

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={() => onClose?.()}>
      <div className="modal weekly-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Wochenplan Essen</h3>
          <button
            className="btn"
            onClick={() => {
              setEditingRecipe(null);
              setShowRecipeModal(true);
            }}
          >
            Rezept hinzufügen
          </button>
        </div>

        <div className="modal-body">
          {loading ? <p>Lade Wochenplan...</p> : null}
          {error ? <p style={{ color: "salmon" }}>{error}</p> : null}
          {status ? <p style={{ color: "lightgreen" }}>{status}</p> : null}

          <div className="weekly-grid">
            {WEEK_DAYS.map((day) => {
              const entry = entryByWeekday.get(day.value);
              const selectedRecipeId = entry?.recipe_id ?? "";
              const selectedRecipe = recipes.find(
                (recipe) => recipe.id === selectedRecipeId,
              );

              return (
                <div key={day.value} className="weekly-day-card">
                  <h4>{day.label}</h4>
                  <p className="weekly-recipe-hint">
                    {selectedRecipe
                      ? "Aktuell zugewiesen:"
                      : "Aktuell zugewiesen: Nicht geplant"}
                    {selectedRecipe ? (
                      <strong
                        style={{
                          marginLeft: 6,
                          color: "lightgreen",
                          fontSize: 14,
                        }}
                      >
                        {selectedRecipe.title}
                      </strong>
                    ) : null}
                  </p>

                  <div className="weekly-day-actions" style={{ marginTop: 8 }}>
                    <button
                      className="btn"
                      onClick={() => openRecipePicker(day.value)}
                    >
                      {selectedRecipe ? "Rezept ändern" : "Rezept hinzufügen"}
                    </button>
                  </div>

                  <p className="weekly-day-desc">
                    {entry?.recipes?.description || "Kein Rezept zugewiesen."}
                  </p>

                  <div className="weekly-day-actions">
                    <button
                      className="btn"
                      disabled={!selectedRecipeId}
                      onClick={() => handleAddIngredients(selectedRecipeId)}
                    >
                      Zutaten auf Liste
                    </button>
                    <button
                      className="btn cancel-btn"
                      disabled={!selectedRecipeId}
                      onClick={() => handleRemove(day.value)}
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {recipes.length === 0 ? (
            <p style={{ color: "#bbb" }}>
              Es gibt noch keine Rezepte. Lege zuerst ein Rezept an.
            </p>
          ) : null}
        </div>

        <div className="modal-footer">
          <button className="btn cancel-btn" onClick={() => onClose?.()}>
            Schließen
          </button>
        </div>

        <RecipeModal
          visible={showRecipeModal}
          userId={userId}
          recipeToEdit={editingRecipe}
          onClose={() => {
            setShowRecipeModal(false);
            setEditingRecipe(null);
          }}
          onCreated={() => {
            setShowRecipeModal(false);
            setEditingRecipe(null);
            window.dispatchEvent(new CustomEvent("weekly-plan:changed"));
          }}
          onUpdated={() => {
            setShowRecipeModal(false);
            setEditingRecipe(null);
            setStatus("Rezept wurde aktualisiert.");
            window.dispatchEvent(new CustomEvent("weekly-plan:changed"));
          }}
          onDeleted={() => {
            setShowRecipeModal(false);
            setEditingRecipe(null);
            setStatus("Rezept wurde gelöscht.");
            window.dispatchEvent(new CustomEvent("weekly-plan:changed"));
          }}
        />

        {showRecipePicker ? (
          <div
            className="modal-overlay"
            onClick={() => setShowRecipePicker(false)}
          >
            <div
              className="modal weekly-picker-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Rezept auswählen: {pickerWeekdayLabel}</h3>
              </div>
              <div className="modal-body">
                <input
                  className="input-fields"
                  placeholder="Rezept suchen..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                />

                <div className="weekly-picker-list">
                  {filteredRecipesForPicker.length === 0 ? (
                    <p className="weekly-recipe-hint">
                      Keine Rezepte gefunden.
                    </p>
                  ) : (
                    filteredRecipesForPicker.map((recipe) => (
                      <div key={recipe.id} className="weekly-picker-row">
                        <button
                          type="button"
                          className="weekly-picker-main"
                          onClick={() => handlePickRecipe(recipe.id)}
                        >
                          <strong>{recipe.title}</strong>
                          <span>
                            {recipe.description || "Keine Beschreibung"}
                          </span>
                        </button>
                        <div className="weekly-picker-actions">
                          <button
                            type="button"
                            className="btn"
                            onClick={() => {
                              setEditingRecipe(recipe);
                              setShowRecipeModal(true);
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ gap: 8 }}>
                <button
                  className="btn cancel-btn"
                  onClick={async () => {
                    if (pickerWeekday) await handleRemove(pickerWeekday);
                    setShowRecipePicker(false);
                    setPickerWeekday(null);
                    setPickerSearch("");
                  }}
                >
                  Nicht geplant
                </button>
                <button
                  className="btn cancel-btn"
                  onClick={() => {
                    setShowRecipePicker(false);
                    setPickerWeekday(null);
                    setPickerSearch("");
                  }}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default WeeklyPlanModal;
