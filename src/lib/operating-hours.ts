
/**
 * Checks if a partner is currently open based on its operating hours string.
 * Supports formats like "18:00 - 04:00", "18h - 04h", "20:00 às 05:00".
 * Uses the system's local time.
 */
export const isPartnerOpen = (operatingHours?: string): boolean => {
  if (!operatingHours) return false;

  // Simple check for "24h" or "Sempre aberto"
  const normalizedHours = operatingHours.toLowerCase();
  if (normalizedHours.includes('24h') || normalizedHours.includes('sempre aberto') || normalizedHours.includes('todos os dias')) {
    // If it mentions "todos os dias" but also has hours, we should still check hours
    if (!normalizedHours.match(/\d/)) return true;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Regex to match times like 18:00, 18h, 18h30, 18:30
  // Group 1: hours (from : format)
  // Group 2: minutes (from : format)
  // Group 3: hours (from h format)
  // Group 4: minutes (from h format)
  const timeRegex = /(\d{1,2}):(\d{2})|(\d{1,2})h(\d{2})?|(\d{1,2})h/g;
  const matches = Array.from(operatingHours.matchAll(timeRegex));

  if (matches.length < 2) {
    // If we can't find two times, we can't reliably determine if it's open
    // For now, let's assume it's open if it's a special day or just text
    return true; 
  }

  const parseTimeMatch = (match: RegExpMatchArray) => {
    let hours = 0;
    let minutes = 0;

    if (match[1] !== undefined) {
      hours = parseInt(match[1]);
      minutes = parseInt(match[2] || "0");
    } else if (match[3] !== undefined) {
      hours = parseInt(match[3]);
      minutes = parseInt(match[4] || "0");
    } else if (match[5] !== undefined) {
      hours = parseInt(match[5]);
      minutes = 0;
    }

    return hours * 60 + minutes;
  };

  const startTime = parseTimeMatch(matches[0]);
  const endTime = parseTimeMatch(matches[1]);

  if (startTime < endTime) {
    // Normal range (e.g., 08:00 - 18:00)
    return currentTimeInMinutes >= startTime && currentTimeInMinutes <= endTime;
  } else {
    // Over midnight (e.g., 18:00 - 04:00)
    // It's open if current time is AFTER start OR BEFORE end
    return currentTimeInMinutes >= startTime || currentTimeInMinutes <= endTime;
  }
};

export const getStatusLabel = (operatingHours?: string) => {
  if (!operatingHours) return null;
  return isPartnerOpen(operatingHours) ? "Aberto" : "Fechado";
};
