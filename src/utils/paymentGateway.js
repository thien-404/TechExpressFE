const PAYMENT_SESSION_STORAGE_KEY = "techexpress_payment_session_v1";
const PAYMENT_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function canUseSessionStorage() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

export function buildCheckoutPaymentUrls(origin) {
  const resolvedOrigin =
    origin || (typeof window !== "undefined" ? window.location.origin : "");
  const returnUrl = `${resolvedOrigin}/checkout?paymentReturn=1`;

  return {
    returnUrl,
    cancelUrl: `${returnUrl}&cancel=true`,
  };
}

export function storePendingPaymentSessionId(sessionId) {
  if (!sessionId || !canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(
      PAYMENT_SESSION_STORAGE_KEY,
      JSON.stringify({
        sessionId,
        savedAt: Date.now(),
      }),
    );
  } catch (error) {
    console.warn("Failed to persist payment session id:", error);
  }
}

export function readPendingPaymentSessionId() {
  if (!canUseSessionStorage()) return "";

  try {
    const raw = window.sessionStorage.getItem(PAYMENT_SESSION_STORAGE_KEY);
    if (!raw) return "";

    const parsed = JSON.parse(raw);
    if (!parsed?.sessionId || typeof parsed.sessionId !== "string") {
      return "";
    }

    const savedAt = Number(parsed.savedAt) || 0;
    if (savedAt && Date.now() - savedAt > PAYMENT_SESSION_MAX_AGE_MS) {
      clearPendingPaymentSessionId();
      return "";
    }

    return parsed.sessionId;
  } catch (error) {
    console.warn("Failed to read payment session id:", error);
    return "";
  }
}

export function clearPendingPaymentSessionId() {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(PAYMENT_SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear payment session id:", error);
  }
}
