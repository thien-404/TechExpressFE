const CUSTOM_PC_GUEST_SESSION_KEY = "techexpress_custom_pc_guest_session";

function generateSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getCustomPcGuestSessionId() {
  try {
    return localStorage.getItem(CUSTOM_PC_GUEST_SESSION_KEY);
  } catch {
    return null;
  }
}

export function getOrCreateCustomPcGuestSessionId() {
  const existingSessionId = getCustomPcGuestSessionId();
  if (existingSessionId) {
    return existingSessionId;
  }

  const nextSessionId = generateSessionId();

  try {
    localStorage.setItem(CUSTOM_PC_GUEST_SESSION_KEY, nextSessionId);
  } catch {
    return nextSessionId;
  }

  return nextSessionId;
}

export function clearCustomPcGuestSessionId() {
  try {
    localStorage.removeItem(CUSTOM_PC_GUEST_SESSION_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

