/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Password
 * FILE         : password.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Halaman Ganti Password (semua pengguna). Password baru minimal
 * 8 karakter dan harus dikonfirmasi dua kali.
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
 * - password.html
 *
 ******************************************************************/

/******************************************************************
 * INISIALISASI
 ******************************************************************/
document.addEventListener("DOMContentLoaded", initPasswordPage);

/******************************************************************
 * Function : initPasswordPage()
 * Tujuan   : Menyiapkan form ganti password.
 ******************************************************************/
function initPasswordPage() {
  const user = initPage({ roles: [ROLE_ADMIN, ROLE_PENILAI], active: "password", title: "Ganti Password" });
  if (!user) { return; }
  byId("passwordForm").addEventListener("submit", submitPasswordChange);
}

/******************************************************************
 * Function : submitPasswordChange()
 * Tujuan   : Memeriksa isian lalu mengirim ke API.
 ******************************************************************/
async function submitPasswordChange(event) {
  event.preventDefault();
  const form = event.target;
  const oldPassword = form.oldPassword.value;
  const newPassword = form.newPassword.value;

  if (!oldPassword || !newPassword) { showFormError(MSG_FIELDS_REQUIRED); return; }
  if (newPassword.length < MIN_PASSWORD_LENGTH) { showFormError(MSG_PASSWORD_TOO_SHORT); return; }
  if (newPassword !== form.confirmPassword.value) { showFormError(MSG_PASSWORD_MISMATCH); return; }

  const button = form.querySelector('button[type="submit"]');
  byId("formError").hidden = true;
  setButtonBusy(button, true);
  const result = await apiCall("password.change", { oldPassword: oldPassword, newPassword: newPassword });
  setButtonBusy(button, false);

  if (!result.ok) { showFormError(result.message); return; }
  form.reset();
  showToast(result.message, "success");
}
