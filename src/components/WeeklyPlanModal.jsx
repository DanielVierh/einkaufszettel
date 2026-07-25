import { useCallback, useEffect, useMemo, useState } from "react";
import RecipeModal from "./RecipeModal";
import {
  WEEK_DAYS,
  assignRecipeToWeekday,
  fetchRecipes,
  fetchWeeklyPlan,
  removeRecipeFromWeekday,
} from "../lib/weeklyPlanApi";

const WeeklyPlanModal = ({ visible, userId, userName, onClose } = {}) => {
  const [recipes, setRecipes] = useState([]);
  const [weeklyEntries, setWeeklyEntries] = useState([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [openListSelectionOnOpen, setOpenListSelectionOnOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showAllRecipesModal, setShowAllRecipesModal] = useState(false);
  const [allRecipesSearch, setAllRecipesSearch] = useState("");
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
        if (showAllRecipesModal) {
          setShowAllRecipesModal(false);
          setAllRecipesSearch("");
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
  }, [
    visible,
    showRecipeModal,
    showAllRecipesModal,
    showRecipePicker,
    onClose,
  ]);

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

  function openRecipeModal(recipe) {
    if (!recipe) return;
    setOpenListSelectionOnOpen(false);
    setEditingRecipe(recipe);
    setShowRecipeModal(true);
  }

  function openRecipeListSelectionModal(recipe) {
    if (!recipe) return;
    setOpenListSelectionOnOpen(true);
    setEditingRecipe(recipe);
    setShowRecipeModal(true);
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

  const filteredAllRecipes = useMemo(() => {
    const q = (allRecipesSearch ?? "").toString().trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((recipe) =>
      (recipe.title ?? "").toString().toLowerCase().includes(q),
    );
  }, [allRecipesSearch, recipes]);

  const orderedWeekDays = useMemo(() => {
    const jsDay = new Date().getDay();
    const todayWeekday = jsDay === 0 ? 7 : jsDay;
    const startIndex = WEEK_DAYS.findIndex((day) => day.value === todayWeekday);
    if (startIndex < 0) return WEEK_DAYS;
    return [...WEEK_DAYS.slice(startIndex), ...WEEK_DAYS.slice(0, startIndex)];
  }, []);

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={() => onClose?.()}>
      <div className="modal weekly-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Wochenplan Essen</h3>
          <button
            className="btn weekly-recipe-btn"
            onClick={() => {
              setShowAllRecipesModal(true);
              setAllRecipesSearch("");
            }}
          >
            Alle Rezepte anzeigen
          </button>
          <button
            className="btn weekly-recipe-btn"
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
            {orderedWeekDays.map((day) => {
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
                      <button
                        type="button"
                        className="btn"
                        onClick={() => openRecipeModal(selectedRecipe)}
                        style={{
                          marginLeft: 6,
                          color: "lightgreen",
                          fontSize: 14,
                          padding: 10,
                          background: "green",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        {selectedRecipe.title}
                      </button>
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

                  <div className="weekly-day-actions">
                    <button
                      className="btn"
                      disabled={!selectedRecipeId}
                      onClick={() =>
                        openRecipeListSelectionModal(selectedRecipe)
                      }
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
          userName={userName}
          openListSelectionInitially={openListSelectionOnOpen}
          recipeToEdit={editingRecipe}
          onClose={() => {
            setShowRecipeModal(false);
            setOpenListSelectionOnOpen(false);
            setEditingRecipe(null);
          }}
          onCreated={() => {
            setShowRecipeModal(false);
            setOpenListSelectionOnOpen(false);
            setEditingRecipe(null);
            window.dispatchEvent(new CustomEvent("weekly-plan:changed"));
          }}
          onUpdated={() => {
            setShowRecipeModal(false);
            setOpenListSelectionOnOpen(false);
            setEditingRecipe(null);
            setStatus("Rezept wurde aktualisiert.");
            window.dispatchEvent(new CustomEvent("weekly-plan:changed"));
          }}
          onDeleted={() => {
            setShowRecipeModal(false);
            setOpenListSelectionOnOpen(false);
            setEditingRecipe(null);
            setStatus("Rezept wurde gelöscht.");
            window.dispatchEvent(new CustomEvent("weekly-plan:changed"));
          }}
        />

        {showAllRecipesModal ? (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowAllRecipesModal(false);
              setAllRecipesSearch("");
            }}
          >
            <div
              className="modal weekly-picker-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Alle Rezepte</h3>
              </div>

              <div className="modal-body">
                <input
                  className="input-fields"
                  placeholder="Rezept suchen..."
                  value={allRecipesSearch}
                  onChange={(e) => setAllRecipesSearch(e.target.value)}
                />

                <div className="weekly-picker-list">
                  {filteredAllRecipes.length === 0 ? (
                    <p className="weekly-recipe-hint">
                      Keine Rezepte gefunden.
                    </p>
                  ) : (
                    filteredAllRecipes.map((recipe) => (
                      <div key={recipe.id} className="weekly-picker-row">
                        <button
                          type="button"
                          className="weekly-picker-main"
                          onClick={() => {
                            setShowAllRecipesModal(false);
                            setAllRecipesSearch("");
                            openRecipeModal(recipe);
                          }}
                        >
                          <strong>{recipe.title}</strong>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ gap: 8 }}>
                <button
                  className="btn cancel-btn"
                  onClick={() => {
                    setShowAllRecipesModal(false);
                    setAllRecipesSearch("");
                  }}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
