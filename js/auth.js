/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Core
 * FILE         : auth.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Pengelolaan login di sisi browser: menyimpan token, penjaga
 * halaman berdasarkan role, dan logout.
 * Penjaga halaman hanya untuk kenyamanan tampilan. Keamanan
 * sebenarnya diperiksa di backend Apps Script pada setiap request.
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
 * - api.js
 *
 * Used By
 * - ui.js
 * - api.js
 * - login.js
 *
 ******************************************************************/

/******************************************************************
 * SESSION
 * ----------------------------------------------------------------
 * Token dan data pengguna disimpan di sessionStorage.
 ******************************************************************/

/******************************************************************
 * Function : saveSession()
 * Tujuan   : Menyimpan token dan data pengguna setelah login.
 ******************************************************************/
function saveSession(token, user) {
  sessionStorage.setItem(STORAGE_TOKEN, token);
  sessionStorage.setItem(STORAGE_USER, JSON.stringify(user));
}

/******************************************************************
 * Function : getToken()
 * Tujuan   : Mengambil token login (teks kosong jika belum login).
 ******************************************************************/
function getToken() {
  return sessionStorage.getItem(STORAGE_TOKEN) || "";
}

/******************************************************************
 * Function : getUser()
 * Tujuan   : Mengambil data pengguna yang sedang login.
 ******************************************************************/
function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_USER) || "null");
  } catch (error) {
    console.error("[AUTH GET USER]", error);
    return null;
  }
}

/******************************************************************
 * Function : clearSession()
 * Tujuan   : Menghapus token dan data pengguna.
 ******************************************************************/
function clearSession() {
  sessionStorage.removeItem(STORAGE_TOKEN);
  sessionStorage.removeItem(STORAGE_USER);
}

/******************************************************************
 * PENJAGA HALAMAN
 ******************************************************************/

/******************************************************************
 * Function : guardPage()
 * Tujuan   : Memastikan pengguna sudah login dan role-nya boleh
 *            membuka halaman. Mengembalikan data pengguna atau
 *            null (lalu mengalihkan halaman).
 ******************************************************************/
function guardPage(allowedRoles) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.replace(PAGE.LOGIN);
    return null;
  }
  if (allowedRoles && allowedRoles.indexOf(user.role) === -1) {
    window.location.replace(PAGE.DASHBOARD);
    return null;
  }
  return user;
}

/******************************************************************
 * Function : handleSessionExpired()
 * Tujuan   : Dipanggil saat backend menolak token. Menghapus
 *            session lalu kembali ke halaman login.
 ******************************************************************/
function handleSessionExpired() {
  clearSession();
  window.location.replace(PAGE.LOGIN + "?expired=1");
}

/******************************************************************
 * Function : performLogout()
 * Tujuan   : Logout di backend, hapus session, kembali ke login.
 ******************************************************************/
async function performLogout() {
  try {
    await apiCall("logout");
  } catch (error) {
    console.error("[LOGOUT]", error);
  }
  clearSession();
  window.location.replace(PAGE.LOGIN);
}
