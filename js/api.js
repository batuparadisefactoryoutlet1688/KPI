/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Core
 * FILE         : api.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Komunikasi ke backend Apps Script. Semua permintaan memakai
 * POST dengan Content-Type text/plain (agar tidak memicu CORS
 * preflight) dan body JSON { action, token, payload }.
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release.
 *
 ******************************************************************/

/******************************************************************
 * DEPENDENCIES
 * ----------------------------------------------------------------
 *
 * Required
 * - config.js
 * - auth.js
 *
 * Used By
 * - Semua file halaman
 *
 ******************************************************************/

/******************************************************************
 * Function : apiCall()
 * Tujuan   : Memanggil satu aksi API. Selalu mengembalikan objek
 *            { ok, message, data }, tidak pernah melempar error.
 *            Jika token ditolak backend, pengguna dikembalikan ke
 *            halaman login.
 ******************************************************************/
async function apiCall(action, payload) {
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, API_TIMEOUT);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: action, token: getToken(), payload: payload || {} }),
      signal: controller.signal
    });
    const result = await response.json();

    const isExpired = !result.ok && String(result.message || "").indexOf(SESSION_EXPIRED_HINT) !== -1;
    if (isExpired && action !== "login") {
      handleSessionExpired();
    }
    return result;
  } catch (error) {
    console.error("[API " + action + "]", error);
    return { ok: false, message: MSG_NETWORK_ERROR, data: null };
  } finally {
    clearTimeout(timer);
  }
}
