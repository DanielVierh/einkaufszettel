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
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [visible, showRecipeModal, onClose]);

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

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={() => onClose?.()}>
      <div className="modal weekly-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Wochenplan Essen</h3>
          <button className="btn" onClick={() => setShowRecipeModal(true)}>
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

              return (
                <div key={day.value} className="weekly-day-card">
                  <h4>{day.label}</h4>
                  <select
                    className="input-fields"
                    value={selectedRecipeId}
                    onChange={(e) => handleAssign(day.value, e.target.value)}
                  >
                    <option value="">Nicht geplant</option>
                    {recipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.title}
                      </option>
                    ))}
                  </select>

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
          onClose={() => setShowRecipeModal(false)}
          onCreated={() => {
            setShowRecipeModal(false);
            window.dispatchEvent(new CustomEvent("weekly-plan:changed"));
          }}
        />
      </div>
    </div>
  );
};

export default WeeklyPlanModal;
