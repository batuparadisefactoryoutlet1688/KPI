/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Archive
 * FILE         : arsip.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Halaman Arsip Saya (Penilai): semua penilaian milik penilai yang
 * sedang login, tombol ubah, dan riwayat perubahan nilai.
 * Arsip diambil dari data utama, bukan salinan terpisah.
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
 * - arsip.html
 *
 ******************************************************************/

/******************************************************************
 * STATE
 ******************************************************************/
let archiveList = [];

/******************************************************************
 * INISIALISASI
 ******************************************************************/
document.addEventListener("DOMContentLoaded", initArchivePage);

/******************************************************************
 * Function : initArchivePage()
 * Tujuan   : Menyiapkan halaman dan memuat arsip pribadi.
 ******************************************************************/
async function initArchivePage() {
  const user = initPage({ roles: [ROLE_PENILAI], active: "arsip", title: "Arsip Saya" });
  if (!user) { return; }

  byId("filterSearch").addEventListener("input", debounce(renderArchiveTable, SEARCH_DELAY));
  byId("archiveTable").addEventListener("click", onArchiveTableClick);

  byId("archiveTable").innerHTML = '<div class="empty">' + TEXT_LOADING + "</div>";
  const result = await apiCall("assessment.myList");
  if (!result.ok) { showError("archiveTable", result.message); return; }
  archiveList = result.data.items;
  renderArchiveTable();
}

/******************************************************************
 * Function : renderArchiveTable()
 * Tujuan   : Menggambar tabel arsip sesuai pencarian nama.
 ******************************************************************/
function renderArchiveTable() {
  const search = byId("filterSearch").value.trim().toLowerCase();
  const rows = archiveList.filter(function (item) {
    return !search || item.nama.toLowerCase().indexOf(search) !== -1;
  });
  byId("archiveCount").textContent = rows.length + " dari " + archiveList.length + " penilaian";

  const columns = [
    { label: "Nama", render: function (row) { return escapeHtml(row.nama); } },
    { label: "Departemen", render: function (row) { return escapeHtml(row.departemen); } }
  ];
  INDICATORS.forEach(function (indicator) {
    columns.push({ label: indicator.label, className: "num", render: function (row) { return row.scores[indicator.key] === "" ? TEXT_EMPTY : row.scores[indicator.key]; } });
  });
  columns.push({ label: "Dibuat", render: function (row) { return escapeHtml(row.createdAt); } });
  columns.push({ label: "Diperbarui", render: function (row) { return escapeHtml(row.updatedAt); } });
  columns.push({ label: "Aksi", render: function (row) {
    const id = escapeHtml(row.idKaryawan);
    return '<div class="actions"><a class="btn btn-small" href="' + PAGE.ASSESSMENT + "?edit=" + encodeURIComponent(row.idKaryawan) + '">Ubah</a>' +
      '<button type="button" class="btn btn-small" data-id="' + id + '">Riwayat</button></div>';
  } });

  renderTable("archiveTable", columns, rows, "Anda belum memberi penilaian.");
}

/******************************************************************
 * Function : onArchiveTableClick()
 * Tujuan   : Membuka riwayat perubahan saat tombol Riwayat diklik.
 ******************************************************************/
async function onArchiveTableClick(event) {
  const button = event.target.closest("button[data-id]");
  if (!button) { return; }
  const item = archiveList.filter(function (row) { return row.idKaryawan === button.dataset.id; })[0];
  if (!item) { return; }

  openModal("Riwayat: " + item.nama, '<div id="historyTable"><div class="empty">' + TEXT_LOADING + "</div></div>", { wide: true });
  const result = await apiCall("assessment.myHistory", { idKaryawan: item.idKaryawan });
  if (!result.ok) { showError("historyTable", result.message); return; }

  renderTable("historyTable", [
    { label: "Waktu", render: function (row) { return escapeHtml(row.timestamp); } },
    { label: "Aksi", render: function (row) { return escapeHtml(ACTION_LABELS[row.action] || row.action); } },
    { label: "Indikator", render: function (row) { return escapeHtml(indicatorLabel(row.field)); } },
    { label: "Perubahan", className: "num", render: function (row) { return escapeHtml(describeChangeText(row.oldValue, row.newValue)); } }
  ], result.data.items, "Belum ada riwayat.");
}

/******************************************************************
 * Function : describeChangeText()
 * Tujuan   : Teks perubahan nilai, contoh "80 -> 90".
 ******************************************************************/
function describeChangeText(oldValue, newValue) {
  const before = oldValue === "" ? TEXT_EMPTY : oldValue;
  const after = newValue === "" ? TEXT_EMPTY : newValue;
  return before + " \u2192 " + after;
}
