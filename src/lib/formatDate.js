export default function formatDate(isoString, options = {}) {
  if (!isoString) return "—";
  let s = String(isoString);

  // Normalize common DB timestamp formats to an ISO string with timezone (UTC)
  // If the string already contains a timezone indicator (Z or +/-HH:MM), leave it.
  const hasTZ = /Z|[+-]\d{2}:?\d{2}$/.test(s);
  if (!hasTZ) {
    // Replace space between date and time with 'T' if needed
    if (s.indexOf(" ") !== -1 && s.indexOf("T") === -1) {
      s = s.replace(" ", "T");
    }
    // If still no timezone info, assume the stored value is in UTC and append 'Z'
    if (!/Z|[+-]\d{2}:?\d{2}$/.test(s)) {
      s = s + "Z";
    }
  }

  const d = new Date(s);
  const opts = {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };
  try {
    return d.toLocaleString("de-DE", opts);
  } catch (e) {
    console.log(e);

    return d.toLocaleString();
  }
}
