import { useState } from "react";
import formatDate from "../lib/formatDate";

const ItemModal = ({ item, onClose, onUpdate, onDelete, user_name } = {}) => {
  const [amount, setAmount] = useState(() => item?.item_amount ?? 1);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    item_name: item?.item_name ?? "",
    item_on_weekly_list: !!item?.item_on_weekly_list,
    item_price: item?.item_price ?? "",
    item_comment: item?.item_comment ?? "",
  }));

  if (!item) return null;

  const changeAmount = async (delta) => {
    const newAmount = Math.max(0, (amount ?? 0) + delta);
    setAmount(newAmount);
    try {
      if (typeof onUpdate === "function")
        await onUpdate(item.id, { item_amount: newAmount });
    } catch (err) {
      console.error("Fehler beim Setzen der Menge:", err);
    }
  };

  const parsePrice = (val) => {
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  };

  const unitPrice = parsePrice(isEditing ? form.item_price : item.item_price);
  const totalPrice = (unitPrice * (amount ?? 0)).toFixed(2);

  const handleEditClick = () => {
    setForm({
      item_name: item?.item_name ?? "",
      item_on_weekly_list: !!item?.item_on_weekly_list,
      item_price: item?.item_price ?? "",
      item_comment: item?.item_comment ?? "",
    });
    setIsEditing(true);
  };

  const handleChange = (key, value) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  const handleSave = async () => {
    const payload = {
      item_name: form.item_name,
      item_on_weekly_list: !!form.item_on_weekly_list,
      item_price: form.item_price === "" ? null : form.item_price,
      item_comment: form.item_comment,
    };
    try {
      if (typeof onUpdate === "function") await onUpdate(item.id, payload);
      setIsEditing(false);
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      alert("Fehler beim Speichern: " + String(err));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleRemoveFromList = async () => {
    try {
      if (typeof onUpdate === "function")
        await onUpdate(item.id, {
          item_on_list: false,
          added_at: null,
          item_creator: null,
        });
      if (typeof onClose === "function") onClose();
    } catch (err) {
      console.error("Fehler beim Entfernen von Liste:", err);
      alert("Fehler beim Entfernen: " + String(err));
    }
  };

  const handleAddToList = async () => {
    try {
      const creator = user_name ?? null;
      if (typeof onUpdate === "function")
        await onUpdate(item.id, {
          item_on_list: true,
          added_at: new Date().toISOString(),
          item_creator: creator,
        });
    } catch (err) {
      console.error("Fehler beim Hinzufügen zur Liste:", err);
      alert("Fehler beim Hinzufügen: " + String(err));
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Produkt "${item.item_name}" wirklich löschen?`)) return;
    try {
      if (typeof onDelete === "function") await onDelete(item.id);
      if (typeof onClose === "function") onClose();
    } catch (err) {
      console.error("Fehler beim Löschen:", err);
      alert("Fehler beim Löschen: " + String(err));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{item.item_name}</h3>
          {item.item_on_list ? (
            <button
              className="btn btn-remove-from-list"
              onClick={handleRemoveFromList}
            >
              Von Liste entfernen ☑️
            </button>
          ) : (
            <button className="btn submit-btn" onClick={handleAddToList}>
              Zur Liste hinzufügen ➕
            </button>
          )}
        </div>

        <div className="modal-body">
          <div className="modal-row">
            <strong>Menge:</strong>
            <div className="amount-controls">
              <button onClick={() => changeAmount(-1)} className="amount-btn">
                −
              </button>
              <span className="amount-value">{amount}</span>
              <button onClick={() => changeAmount(1)} className="amount-btn">
                +
              </button>
            </div>
          </div>

          <div className="modal-row">
            <strong>Preis pro Einheit:</strong>
            <span className="modal-comment">
              {unitPrice > 0 ? `${unitPrice.toFixed(2)} €` : "—"}
            </span>
          </div>

          <div className="modal-row">
            <strong>Gesamtpreis:</strong>
            <span className="modal-comment">{`${totalPrice} €`}</span>
          </div>

          {!isEditing ? (
            <>
              <div className="modal-row">
                <strong>Kommentar:</strong>
                <span className="modal-comment">
                  {item.item_comment ? item.item_comment : "—"}
                </span>
              </div>

              <div className="modal-row">
                <strong style={{ textAlign: "left" }}>Auf Wochenliste:</strong>
                <span className="modal-comment">
                  {item.item_on_weekly_list ? "JA" : "—"}
                </span>
              </div>

              {item.item_on_list && item.added_at ? (
                <div className="modal-row">
                  <strong>Hinzugefügt am:</strong>
                  <span className="modal-comment">
                    {formatDate(item.added_at)}
                  </span>
                </div>
              ) : null}

              {item.item_on_list ? (
                <div className="modal-row">
                  <strong>Hinzugefügt von:</strong>
                  <span className="modal-comment">
                    {item.item_creator ?? "—"}
                  </span>
                </div>
              ) : null}
            </>
          ) : (
            <div className="modal-form editing">
              <label className="modal-label">
                Name
                <input
                  className="input-fields"
                  value={form.item_name}
                    onChange={(e) => handleChange("item_name", e.target.value)}
                    onFocus={(e) => e.target.select()}
                />
              </label>

              <label className="modal-label">
                Auf Wochenliste
                <input
                  className="input-checkbox"
                  type="checkbox"
                  checked={!!form.item_on_weekly_list}
                  onChange={(e) =>
                    handleChange("item_on_weekly_list", e.target.checked)
                  }
                />
              </label>

              <label className="modal-label">
                Preis
                <input
                  className="input-fields"
                  type="number"
                  step="0.01"
                  value={form.item_price ?? ""}
                    onChange={(e) => handleChange("item_price", e.target.value)}
                    onFocus={(e) => e.target.select()}
                />
              </label>

              <label className="modal-label">
                Kommentar
                <textarea
                  className="input-fields"
                  value={form.item_comment ?? ""}
                  onChange={(e) => handleChange("item_comment", e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
              </label>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!isEditing ? (
            <>
              <button className="btn" onClick={handleEditClick}>
                Edit
              </button>
              <button
                className="btn product-list--delete-btn"
                onClick={handleDelete}
                style={{ color: "red" }}
              >
                Löschen
              </button>
              <button className="btn cancel-btn" onClick={onClose}>
                Schließen
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-save" onClick={handleSave}>
                Save
              </button>
              <button className="btn cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
