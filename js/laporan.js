/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Report
 * FILE         : laporan.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Halaman Laporan (Admin): nilai kumulatif semua karyawan per
 * indikator, jumlah penilai, ranking, dan perbandingan antar
 * departemen. Bisa diunduh sebagai Excel (CSV) atau dicetak PDF.
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
 * - laporan.html
 *
 ******************************************************************/

/******************************************************************
 * STATE
 ******************************************************************/
let reportData = null;

/******************************************************************
 * INISIALISASI
 ******************************************************************/
document.addEventListener("DOMContentLoaded", initReportPage);

/******************************************************************
 * Function : initReportPage()
 * Tujuan   : Memuat dan menggambar laporan.
 ******************************************************************/
async function initReportPage() {
  const user = initPage({ roles: [ROLE_ADMIN], active: "laporan", title: "Laporan" });
  if (!user) { return; }

  byId("btnPrintReport").addEventListener("click", function () { window.print(); });
  byId("btnCsvReport").addEventListener("click", exportReportCsv);
  byId("reportBody").innerHTML = '<div class="empty">' + TEXT_LOADING + "</div>";

  const result = await apiCall("report.data");
  if (!result.ok) { showError("reportBody", result.message); return; }
  reportData = result.data;
  renderReport();
}

/******************************************************************
 * Function : renderReport()
 * Tujuan   : Menggambar ringkasan, perbandingan departemen, dan
 *            tabel nilai seluruh karyawan.
 ******************************************************************/
function renderReport() {
  byId("printHeader").textContent = "KPI - Laporan Nilai Kumulatif - " + todayText();
  byId("reportBody").innerHTML =
    '<div class="stats">' +
    buildStat("Dibuat", reportData.generatedAt) +
    buildStat("Karyawan aktif", reportData.employees.length) +
    buildStat("Rata-rata keseluruhan", formatScore(reportData.overallAverage)) +
    buildStat("Minimal penilai untuk ranking", reportData.minEvaluatorRanking) +
    "</div>" +
    '<section class="panel"><h2>Perbandingan antar departemen</h2><div id="deptTable"></div></section>' +
    '<section class="panel"><h2>Nilai kumulatif per karyawan</h2>' +
    '<p class="muted small">Angka kecil dalam kurung = jumlah penilai pada indikator tersebut.</p><div id="employeeReportTable"></div></section>';

  renderTable("deptTable", [
    { label: "Departemen", render: function (row) { return escapeHtml(row.departemen); } },
    { label: "Karyawan", className: "num", render: function (row) { return row.employeeCount; } },
    { label: "Sudah dinilai", className: "num", render: function (row) { return row.ratedCount; } },
    { label: "Rata-rata nilai akhir", className: "num", render: function (row) { return formatScore(row.average); } }
  ], reportData.departments, "Belum ada data.");

  const columns = [
    { label: "Peringkat", className: "num", render: function (row) { return row.rank === "" ? TEXT_EMPTY : row.rank; } },
    { label: "Nama", render: function (row) { return '<a href="' + PAGE.DETAIL + "?id=" + encodeURIComponent(row.id) + '">' + escapeHtml(row.nama) + "</a>"; } },
    { label: "Departemen", render: function (row) { return escapeHtml(row.departemen); } }
  ];
  INDICATORS.forEach(function (indicator) {
    columns.push({ label: indicator.label, className: "num", render: function (row) {
      const item = row.indicators[indicator.key];
      return formatScore(item.average) + (item.evaluatorCount ? ' <small class="muted">(' + item.evaluatorCount + ")</small>" : "");
    } });
  });
  columns.push({ label: "Nilai akhir", className: "num", render: function (row) { return "<strong>" + formatScore(row.finalScore) + "</strong>"; } });
  columns.push({ label: "Penilai", className: "num", render: function (row) { return row.evaluatorCount; } });
  columns.push({ label: "Status ranking", render: function (row) { return rankStatusBadge(row.rankingStatus); } });

  renderTable("employeeReportTable", columns, reportData.employees, "Belum ada karyawan.");
}

/******************************************************************
 * Function : exportReportCsv()
 * Tujuan   : Mengunduh laporan karyawan sebagai CSV (Excel).
 ******************************************************************/
function exportReportCsv() {
  if (!reportData || reportData.employees.length === 0) {
    showToast("Tidak ada data untuk diunduh.", "error");
    return;
  }
  const headers = ["Peringkat", "ID", "Nama", "Departemen", "Jabatan"];
  INDICATORS.forEach(function (indicator) {
    headers.push(indicator.label);
    headers.push("Penilai " + indicator.label);
  });
  headers.push("Nilai Akhir", "Jumlah Penilai", "Kelengkapan", "Status Ranking");

  const rows = reportData.employees.map(function (row) {
    const line = [row.rank, row.id, row.nama, row.departemen, row.jabatan];
    INDICATORS.forEach(function (indicator) {
      line.push(row.indicators[indicator.key].average);
      line.push(row.indicators[indicator.key].evaluatorCount);
    });
    line.push(row.finalScore, row.evaluatorCount, row.completeness, row.rankingStatus);
    return line;
  });
  downloadCsv("laporan-kpi.csv", headers, rows);
}
