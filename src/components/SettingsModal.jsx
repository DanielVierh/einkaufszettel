import { THEMES } from "../lib/settings";

export default function SettingsModal({ visible, onClose, settings, onChange }) {
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal settings-modal"
        role="dialog"
        aria-label="Einstellungen"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Einstellungen</h3>
          <button className="modal-close" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <h4 className="settings-title">Theme</h4>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`theme-option${settings.theme === t.id ? " active" : ""}`}
                onClick={() => onChange({ ...settings, theme: t.id })}
                aria-pressed={settings.theme === t.id}
              >
                <span className="theme-swatches">
                  {t.colors.map((c) => (
                    <span key={c} style={{ background: c }} />
                  ))}
                </span>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
