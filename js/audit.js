/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Audit
 * FILE         : audit.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Halaman Riwayat Perubahan (Admin): 200 aktivitas terbaru dari
 * AUDIT_LOG, dengan pencarian. Data hanya dibaca, tidak bisa diubah.
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
 * - audit.html
 *
 ******************************************************************/

/******************************************************************
 * STATE
 ******************************************************************/
let auditList = [];

/******************************************************************
 * INISIALISASI
 ******************************************************************/
document.addEventListener("DOMContentLoaded", initAuditPage);

/******************************************************************
 * Function : initAuditPage()
 * Tujuan   : Memuat riwayat perubahan.
 ******************************************************************/
async function initAuditPage() {
  const user = initPage({ roles: [ROLE_ADMIN], active: "audit", title: "Riwayat Perubahan" });
  if (!user) { return; }

  byId("filterSearch").addEventListener("input", debounce(renderAuditTable, SEARCH_DELAY));
  byId("auditTable").innerHTML = '<div class="empty">' + TEXT_LOADING + "</div>";
  const result = await apiCall("audit.list", { limit: AUDIT_LIMIT });
  if (!result.ok) { showError("auditTable", result.message); return; }
  auditList = result.data.items;
  renderAuditTable();
}

/******************************************************************
 * Function : renderAuditTable()
 * Tujuan   : Menggambar tabel riwayat sesuai pencarian.
 ******************************************************************/
function renderAuditTable() {
  const search = byId("filterSearch").value.trim().toLowerCase();
  const rows = auditList.filter(function (item) {
    const text = [item.actorId, item.namaKaryawan, item.idKaryawan, item.action, item.field].join(" ").toLowerCase();
    return !search || text.indexOf(search) !== -1;
  });
  byId("auditCount").textContent = rows.length + " dari " + auditList.length + " aktivitas";

  renderTable("auditTable", [
    { label: "Waktu", render: function (row) { return escapeHtml(row.timestamp); } },
    { label: "Pelaku", render: function (row) { return escapeHtml(row.actorId + " (" + row.actorRole + ")"); } },
    { label: "Aksi", render: function (row) { return escapeHtml(ACTION_LABELS[row.action] || row.action); } },
    { label: "Karyawan", render: function (row) { return escapeHtml(row.namaKaryawan || row.idKaryawan || TEXT_EMPTY); } },
    { label: "Bagian", render: function (row) { return escapeHtml(indicatorLabel(row.field) || TEXT_EMPTY); } },
    { label: "Lama", className: "num", render: function (row) { return escapeHtml(row.oldValue === "" ? TEXT_EMPTY : row.oldValue); } },
    { label: "Baru", className: "num", render: function (row) { return escapeHtml(row.newValue === "" ? TEXT_EMPTY : row.newValue); } }
  ], rows, "Belum ada aktivitas.");
}
