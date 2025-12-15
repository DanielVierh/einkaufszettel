import { useState } from "react";

const ItemModal = ({ item, onClose, onUpdate } = {}) => {
  const [amount, setAmount] = useState(() => item?.item_amount ?? 1);

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
            <span className="modal-comment">{item.item_creator ?? "—"}</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn cancel-btn" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
