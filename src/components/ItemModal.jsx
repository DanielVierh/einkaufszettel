import { useState } from "react";

const ItemModal = ({ item, onClose, onUpdate } = {}) => {
  const [amount, setAmount] = useState(() => item?.item_amount ?? 1);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    item_name: item?.item_name ?? "",
    item_on_weekly_list: !!item?.item_on_weekly_list,
    item_price: item?.item_price ?? "",
    item_comment: item?.item_comment ?? "",
  }));

  // When the modal is mounted per-item (we rely on parent key), initial state is set.
  // If you want to refresh while open, we would need effect-based syncing.

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{item.item_name}</h3>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Schließen"
          >
            ×
          </button>
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

              <div className="modal-row">
                <strong>Erstellt von:</strong>
                <span className="modal-comment">
                  {item.item_creator ?? "—"}
                </span>
              </div>
            </>
          ) : (
            <div className="modal-form">
              <label className="modal-label">
                Name
                <input
                  className="modal-input"
                  value={form.item_name}
                  onChange={(e) => handleChange("item_name", e.target.value)}
                />
              </label>

              <label className="modal-label">
                Auf Wochenliste
                <input
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
                  className="modal-input"
                  type="number"
                  step="0.01"
                  value={form.item_price ?? ""}
                  onChange={(e) => handleChange("item_price", e.target.value)}
                />
              </label>

              <label className="modal-label">
                Kommentar
                <textarea
                  className="modal-input"
                  value={form.item_comment ?? ""}
                  onChange={(e) => handleChange("item_comment", e.target.value)}
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
              <button className="btn cancel-btn" onClick={onClose}>
                Schließen
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={handleSave}>
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
