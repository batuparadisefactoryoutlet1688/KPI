/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Dashboard
 * FILE         : dashboard.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Dashboard. Admin: ringkasan angka, ranking teratas, rata-rata
 * per indikator, aktivitas terbaru. Penilai: kemajuan penilaian
 * pribadi dan penilaian terakhir.
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
 * - dashboard.html
 *
 ******************************************************************/

/******************************************************************
 * INISIALISASI
 ******************************************************************/
document.addEventListener("DOMContentLoaded", initDashboardPage);

/******************************************************************
 * Function : initDashboardPage()
 * Tujuan   : Memilih tampilan sesuai role pengguna.
 ******************************************************************/
async function initDashboardPage() {
  const user = initPage({ roles: [ROLE_ADMIN, ROLE_PENILAI], active: "dashboard", title: "Dashboard" });
  if (!user) { return; }
  byId("dashboardContent").innerHTML = '<div class="empty">' + TEXT_LOADING + "</div>";
  if (user.role === ROLE_ADMIN) {
    await loadAdminDashboard();
  } else {
    await loadEvaluatorDashboard();
  }
}

/******************************************************************
 * Function : describeChange()
 * Tujuan   : Teks perubahan nilai, contoh "80 → 90".
 ******************************************************************/
function describeChange(oldValue, newValue) {
  const before = oldValue === "" ? TEXT_EMPTY : oldValue;
  const after = newValue === "" ? TEXT_EMPTY : newValue;
  return before + " \u2192 " + after;
}

/******************************************************************
 * DASHBOARD ADMIN
 ******************************************************************/

/******************************************************************
 * Function : loadAdminDashboard()
 * Tujuan   : Mengambil dan menggambar dashboard Admin.
 ******************************************************************/
async function loadAdminDashboard() {
  const result = await apiCall("dashboard.admin");
  if (!result.ok) { showError("dashboardContent", result.message); return; }
  const data = result.data;

  byId("dashboardContent").innerHTML =
    '<div class="stats">' +
    buildStat("Karyawan aktif", data.totalEmployees) +
    buildStat("Penilai aktif", data.totalEvaluators) +
    buildStat("Penilaian masuk", data.totalAssessments) +
    buildStat("Cakupan", formatScore(data.coveragePercent) + "%", data.ratedEmployees + " karyawan sudah dinilai") +
    buildStat("Rata-rata nilai", formatScore(data.overallAverage)) +
    buildStat("Belum dinilai", data.notRatedEmployees) +
    buildStat("Memenuhi syarat ranking", data.eligibleEmployees) +
    "</div>" +
    '<div class="grid-2">' +
    '<section class="panel"><h2>Ranking teratas</h2><div id="topTable"></div></section>' +
    '<section class="panel"><h2>Rata-rata per indikator</h2><div id="indicatorBars"></div></section>' +
    "</div>" +
    '<section class="panel"><h2>Aktivitas penilaian terbaru</h2><div id="activityTable"></div></section>';

  renderTable("topTable", [
    { label: "Peringkat", render: function (row) { return '<span class="rank-number">' + row.rank + "</span>"; } },
    { label: "Nama", render: function (row) { return '<a href="' + PAGE.DETAIL + "?id=" + encodeURIComponent(row.id) + '">' + escapeHtml(row.nama) + "</a>"; } },
    { label: "Departemen", render: function (row) { return escapeHtml(row.departemen); } },
    { label: "Nilai", className: "num", render: function (row) { return formatScore(row.value); } },
    { label: "Penilai", className: "num", render: function (row) { return row.evaluatorCount; } }
  ], data.topRanking, "Belum ada nilai masuk.");

  byId("indicatorBars").innerHTML = data.indicatorAverages.map(function (item) {
    const width = item.average === "" ? 0 : item.average;
    return '<div class="bar-row"><div>' + escapeHtml(item.label) + '</div><div class="bar-track"><div class="bar-fill" style="width:' +
      width + '%"></div></div><div class="bar-value">' + formatScore(item.average) + "</div></div>";
  }).join("");

  renderTable("activityTable", [
    { label: "Waktu", render: function (row) { return escapeHtml(row.timestamp); } },
    { label: "Penilai", render: function (row) { return escapeHtml(row.actorId); } },
    { label: "Aksi", render: function (row) { return escapeHtml(ACTION_LABELS[row.action] || row.action); } },
    { label: "Karyawan", render: function (row) { return escapeHtml(row.namaKaryawan || row.idKaryawan); } },
    { label: "Indikator", render: function (row) { return escapeHtml(indicatorLabel(row.field)); } },
    { label: "Perubahan", className: "num", render: function (row) { return escapeHtml(describeChange(row.oldValue, row.newValue)); } }
  ], data.recentActivity, "Belum ada aktivitas.");
}

/******************************************************************
 * DASHBOARD PENILAI
 ******************************************************************/

/******************************************************************
 * Function : loadEvaluatorDashboard()
 * Tujuan   : Mengambil dan menggambar dashboard Penilai.
 ******************************************************************/
async function loadEvaluatorDashboard() {
  const result = await apiCall("dashboard.evaluator");
  if (!result.ok) { showError("dashboardContent", result.message); return; }
  const data = result.data;
  const percent = data.totalEmployees > 0 ? Math.round(data.assessedCount / data.totalEmployees * 100) : 0;

  byId("dashboardContent").innerHTML =
    '<div class="page-head"><div><h2>' + escapeHtml(data.nama) + '</h2><div class="muted">' +
    escapeHtml([data.jabatan, data.departemen].filter(Boolean).join(" \u00b7 ")) + "</div></div>" +
    '<span class="spacer"></span><a class="btn btn-primary" href="' + PAGE.ASSESSMENT + '">Mulai penilaian</a>' +
    '<a class="btn" href="' + PAGE.ARCHIVE + '">Arsip saya</a></div>' +
    '<div class="stats">' +
    buildStat("Karyawan aktif", data.totalEmployees) +
    buildStat("Sudah Anda nilai", data.assessedCount) +
    buildStat("Belum Anda nilai", data.notAssessedCount) +
    buildStat("Aktivitas terakhir", data.lastActivity || TEXT_EMPTY) +
    "</div>" +
    '<section class="panel"><h2>Kemajuan penilaian: ' + percent + '%</h2>' +
    '<div class="bar-track"><div class="bar-fill" style="width:' + percent + '%"></div></div></section>' +
    '<section class="panel"><h2>Penilaian terakhir</h2><div id="recentTable"></div></section>';

  renderTable("recentTable", [
    { label: "Nama", render: function (row) { return escapeHtml(row.nama); } },
    { label: "Departemen", render: function (row) { return escapeHtml(row.departemen); } },
    { label: "Diperbarui", render: function (row) { return escapeHtml(row.updatedAt); } },
    { label: "", render: function (row) { return '<a class="btn btn-small" href="' + PAGE.ASSESSMENT + "?edit=" + encodeURIComponent(row.idKaryawan) + '">Ubah</a>'; } }
  ], data.recent, "Anda belum memberi penilaian.");
}
