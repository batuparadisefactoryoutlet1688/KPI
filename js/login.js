/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Login
 * FILE         : login.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Halaman login: memeriksa username dan password lewat API,
 * menyimpan token, lalu masuk ke dashboard.
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
 * - api.js
 * - ui.js
 *
 * Used By
 * - index.html
 *
 ******************************************************************/

/******************************************************************
 * INISIALISASI
 ******************************************************************/
document.addEventListener("DOMContentLoaded", initLoginPage);

/******************************************************************
 * Function : initLoginPage()
 * Tujuan   : Menyiapkan halaman login. Jika sudah login langsung
 *            ke dashboard.
 ******************************************************************/
function initLoginPage() {
  if (getToken() && getUser()) {
    window.location.replace(PAGE.DASHBOARD);
    return;
  }
  if (getQueryParam("expired")) {
    showLoginError(MSG_SESSION_EXPIRED);
  }
  byId("loginForm").addEventListener("submit", submitLogin);
}

/******************************************************************
 * Function : showLoginError()
 * Tujuan   : Menampilkan pesan error di bawah form login.
 ******************************************************************/
function showLoginError(message) {
  const box = byId("loginError");
  box.textContent = message;
  box.hidden = false;
}

/******************************************************************
 * Function : submitLogin()
 * Tujuan   : Mengirim username dan password ke API.
 ******************************************************************/
async function submitLogin(event) {
  event.preventDefault();
  const form = event.target;
  const username = form.username.value.trim();
  const password = form.password.value;
  const button = byId("loginButton");
  byId("loginError").hidden = true;

  if (!username || !password) {
    showLoginError("Username dan password wajib diisi.");
    return;
  }

  setButtonBusy(button, true);
  const result = await apiCall("login", { username: username, password: password });
  setButtonBusy(button, false);

  if (!result.ok) {
    showLoginError(result.message);
    form.password.value = "";
    form.password.focus();
    return;
  }
  saveSession(result.data.token, result.data.user);
  window.location.replace(PAGE.DASHBOARD);
}
