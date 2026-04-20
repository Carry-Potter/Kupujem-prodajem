/** Session debug ingest (Cursor) – bez PII/tokena */
// #region agent log
export function agentLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
): void {
  fetch("http://127.0.0.1:7861/ingest/7d71eaa8-9c33-47b8-be5b-d2ad4789a45b", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "b49b2f",
    },
    body: JSON.stringify({
      sessionId: "b49b2f",
      location,
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
    }),
  }).catch(() => {});
}
// #endregion
