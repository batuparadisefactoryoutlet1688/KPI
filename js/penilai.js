/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Evaluators
 * FILE         : penilai.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Halaman Data Penilai (Admin): daftar, tambah (akun dan password
 * sementara dibuat otomatis), ubah, aktif/nonaktif, reset password.
 * Password sementara hanya tampil sekali setelah dibuat.
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
 * - penilai.html
 *
 ******************************************************************/

/******************************************************************
 * STATE
 ******************************************************************/
let evaluatorList = [];

/******************************************************************
 * INISIALISASI
 ******************************************************************/
document.addEventListener("DOMContentLoaded", initEvaluatorPage);

/******************************************************************
 * Function : initEvaluatorPage()
 * Tujuan   : Menyiapkan halaman dan memuat daftar penilai.
 ******************************************************************/
async function initEvaluatorPage() {
  const user = initPage({ roles: [ROLE_ADMIN], active: "penilai", title: "Data Penilai" });
  if (!user) { return; }

  byId("btnAddEvaluator").addEventListener("click", function () { openEvaluatorForm(null); });
  byId("filterSearch").addEventListener("input", debounce(renderEvaluatorTable, SEARCH_DELAY));
  byId("filterStatus").addEventListener("change", renderEvaluatorTable);
  byId("evaluatorTable").addEventListener("click", onEvaluatorTableClick);
  await loadEvaluators();
}

/******************************************************************
 * Function : loadEvaluators()
 * Tujuan   : Mengambil daftar penilai dari API.
 ******************************************************************/
async function loadEvaluators() {
  byId("evaluatorTable").innerHTML = '<div class="empty">' + TEXT_LOADING + "</div>";
  const result = await apiCall("evaluators.list");
  if (!result.ok) { showError("evaluatorTable", result.message); return; }
  evaluatorList = result.data.items;
  renderEvaluatorTable();
}

/******************************************************************
 * TABEL
 ******************************************************************/

/******************************************************************
 * Function : renderEvaluatorTable()
 * Tujuan   : Menggambar tabel sesuai pencarian dan filter.
 ******************************************************************/
function renderEvaluatorTable() {
  const search = byId("filterSearch").value.trim().toLowerCase();
  const status = byId("filterStatus").value;

  const rows = evaluatorList.filter(function (item) {
    const text = (item.nama + " " + item.username).toLowerCase();
    return (!search || text.indexOf(search) !== -1) && (!status || item.status === status);
  });
  byId("evaluatorCount").textContent = rows.length + " dari " + evaluatorList.length + " penilai";

  renderTable("evaluatorTable", [
    { label: "ID", render: function (row) { return escapeHtml(row.id); } },
    { label: "Nama", render: function (row) { return escapeHtml(row.nama); } },
    { label: "Jabatan", render: function (row) { return escapeHtml(row.jabatan); } },
    { label: "Departemen", render: function (row) { return escapeHtml(row.departemen); } },
    { label: "Username", render: function (row) { return escapeHtml(row.username || TEXT_EMPTY); } },
    { label: "Status", render: function (row) { return statusBadge(row.status); } },
    { label: "Login terakhir", render: function (row) { return escapeHtml(row.lastLogin || TEXT_EMPTY); } },
    { label: "Aksi", render: function (row) {
      const id = escapeHtml(row.id);
      const toggleLabel = row.status === STATUS_ACTIVE ? "Nonaktifkan" : "Aktifkan";
      return '<div class="actions"><button type="button" class="btn btn-small" data-action="edit" data-id="' + id + '">Ubah</button>' +
        '<button type="button" class="btn btn-small" data-action="reset" data-id="' + id + '">Reset password</button>' +
        '<button type="button" class="btn btn-small" data-action="toggle" data-id="' + id + '">' + toggleLabel + "</button></div>";
    } }
  ], rows, "Belum ada penilai. Klik Tambah Penilai.");
}

/******************************************************************
 * Function : onEvaluatorTableClick()
 * Tujuan   : Menangani tombol Ubah, Reset password, dan status.
 ******************************************************************/
async function onEvaluatorTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) { return; }
  const evaluator = evaluatorList.filter(function (item) { return item.id === button.dataset.id; })[0];
  if (!evaluator) { return; }
  const action = button.dataset.action;

  if (action === "edit") {
    openEvaluatorForm(evaluator);
    return;
  }

  if (action === "reset") {
    if (!(await confirmDialog("Buat password sementara baru untuk " + evaluator.nama + "? Password lama tidak berlaku lagi."))) { return; }
    const result = await apiCall("evaluators.resetPassword", { id: evaluator.id });
    if (!result.ok) { showToast(result.message, "error"); return; }
    showSecret("Password baru: " + evaluator.nama, [
      { label: "Username", value: result.data.username },
      { label: "Password sementara", value: result.data.temporaryPassword }
    ]);
    return;
  }

  const newStatus = evaluator.status === STATUS_ACTIVE ? STATUS_INACTIVE : STATUS_ACTIVE;
  const note = newStatus === STATUS_INACTIVE ? " Penilai tidak akan bisa login. Nilai yang sudah diberikan tetap tersimpan." : "";
  if (!(await confirmDialog(newStatus + "kan " + evaluator.nama + "?" + note))) { return; }

  const result = await apiCall("evaluators.setStatus", { id: evaluator.id, status: newStatus });
  showToast(result.message, result.ok ? "success" : "error");
  if (result.ok) { await loadEvaluators(); }
}

/******************************************************************
 * FORM TAMBAH / UBAH
 ******************************************************************/

/******************************************************************
 * Function : openEvaluatorForm()
 * Tujuan   : Membuka form tambah (evaluator = null) atau ubah.
 ******************************************************************/
function openEvaluatorForm(evaluator) {
  const isEdit = !!evaluator;
  const data = evaluator || { nama: "", jabatan: POSITIONS[0], departemen: "" };
  const usernameField = isEdit ? "" :
    '<label class="field"><span>Username (boleh dikosongkan)</span><input name="username" type="text" maxlength="30" autocomplete="off">' +
    "<small>Kosong = dibuat otomatis dari nama. Jika ada nama kembar, bedakan, misalnya: Andi FO dan Andi HK.</small></label>";

  openModal(isEdit ? "Ubah Penilai" : "Tambah Penilai",
    '<form id="evaluatorForm" novalidate>' +
    '<label class="field"><span>Nama lengkap</span><input name="nama" type="text" maxlength="100" value="' + escapeHtml(data.nama) + '" required></label>' +
    '<label class="field"><span>Jabatan</span><select name="jabatan">' + buildOptions(POSITIONS, data.jabatan) + "</select></label>" +
    '<label class="field"><span>Departemen</span><input name="departemen" type="text" maxlength="100" list="deptList" value="' + escapeHtml(data.departemen) + '" required></label>' +
    buildDatalist("deptList", uniqueValues(evaluatorList, "departemen")) +
    usernameField +
    '<div id="formError" class="form-error" hidden></div>' +
    '<div class="form-actions"><button type="button" class="btn" id="formCancel">Batal</button>' +
    '<button type="submit" class="btn btn-primary">Simpan</button></div></form>');

  byId("formCancel").addEventListener("click", closeModal);
  byId("evaluatorForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.target;
    const payload = {
      nama: form.nama.value.trim(),
      jabatan: form.jabatan.value,
      departemen: form.departemen.value.trim()
    };
    if (!payload.nama || !payload.departemen) { showFormError(MSG_FIELDS_REQUIRED); return; }
    if (isEdit) { payload.id = evaluator.id; } else { payload.username = form.username.value.trim(); }

    const button = form.querySelector('button[type="submit"]');
    setButtonBusy(button, true);
    const result = await apiCall(isEdit ? "evaluators.update" : "evaluators.add", payload);
    setButtonBusy(button, false);

    if (!result.ok) { showFormError(result.message); return; }
    closeModal();
    if (isEdit) {
      showToast(result.message, "success");
    } else {
      showSecret("Penilai berhasil dibuat", [
        { label: "Nama", value: payload.nama },
        { label: "Username", value: result.data.username },
        { label: "Password sementara", value: result.data.temporaryPassword }
      ]);
    }
    await loadEvaluators();
  });
}
