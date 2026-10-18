const STORAGE_KEY = "einkaufszettel.settings";

export const THEMES = [
  { id: "default-blue", name: "Default Blue", colors: ["#0e354c", "#115e96", "#47a0ff"] },
  { id: "forest-green", name: "Forest Green", colors: ["#1b4d2e", "#5c963c", "#9bc53d"] },
  { id: "royal-purple", name: "Royal Purple", colors: ["#4a2a8a", "#be46c8", "#8a4fd6"] },
  { id: "light", name: "Light", colors: ["#f4f6f8", "#2f7fc1", "#4fb0a0"] },
  { id: "rose-pink", name: "Rose Pink", colors: ["#8c2250", "#f06e96", "#ffc2d9"] },
  { id: "mono-dark", name: "Mono Dark", colors: ["#000000", "#6e6e6e", "#ffd400"] },
  { id: "arctic-mint", name: "Arctic Mint", colors: ["#e8fbf7", "#3aa995", "#176b75"] },
  { id: "black-white", name: "Black & White", colors: ["#ffffff", "#bdbdbd", "#000000"] },
  { id: "midnight-teal", name: "Midnight Teal", colors: ["#061c24", "#0b5966", "#39d0c5"] },
  { id: "deep-space", name: "Deep Space", colors: ["#080b1c", "#25245c", "#7874ff"] },
  { id: "neon-cyber", name: "Neon Cyber", colors: ["#090016", "#ec167f", "#00f0ff"] },
];

export const DEFAULT_SETTINGS = { theme: "default-blue" };

export function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const settings = { ...DEFAULT_SETTINGS, ...stored };
    if (!THEMES.some((t) => t.id === settings.theme)) {
      settings.theme = DEFAULT_SETTINGS.theme;
    }
    return settings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable; setting only lasts for this session
  }
}

export function applySettings(settings) {
  document.documentElement.dataset.theme = settings.theme;
}
