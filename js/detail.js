/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Report
 * FILE         : detail.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Halaman Detail Karyawan (Admin): nilai akhir, rata-rata dan jumlah
 * penilai per indikator, serta nilai dari setiap penilai.
 * Dibuka lewat detail.html?id=K001.
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
 * - detail.html
 *
 ******************************************************************/

/******************************************************************
 * INISIALISASI
 ******************************************************************/
document.addEventListener("DOMContentLoaded", initDetailPage);

/******************************************************************
 * Function : initDetailPage()
 * Tujuan   : Memuat rincian satu karyawan dari parameter ?id=.
 ******************************************************************/
async function initDetailPage() {
  const user = initPage({ roles: [ROLE_ADMIN], active: "ranking", title: "Detail Karyawan" });
  if (!user) { return; }
  byId("btnPrintDetail").addEventListener("click", function () { window.print(); });

  const id = getQueryParam("id");
  if (!id) { showError("detailBody", "ID karyawan tidak ada di alamat halaman."); return; }

  byId("detailBody").innerHTML = '<div class="empty">' + TEXT_LOADING + "</div>";
  const result = await apiCall("report.employee", { idKaryawan: id });
  if (!result.ok) { showError("detailBody", result.message); return; }
  renderDetail(result.data.summary, result.data.evaluators);
}

/******************************************************************
 * Function : renderDetail()
 * Tujuan   : Menggambar ringkasan dan nilai tiap penilai.
 ******************************************************************/
function renderDetail(summary, evaluators) {
  byId("printHeader").textContent = "KPI - Detail " + summary.nama + " - " + todayText();
  byId("detailBody").innerHTML =
    '<div class="page-head"><div><h2>' + escapeHtml(summary.nama) + '</h2><div class="muted">' +
    escapeHtml([summary.id, summary.departemen, summary.jabatan].filter(Boolean).join(" \u00b7 ")) + "</div></div>" +
    '<span class="spacer"></span>' + statusBadge(summary.status) + "</div>" +
    '<div class="stats">' +
    buildStat("Nilai akhir", formatScore(summary.finalScore)) +
    buildStat("Jumlah penilai", summary.evaluatorCount) +
    buildStat("Kelengkapan indikator", summary.completeness) +
    '<div class="stat"><div class="stat-value" style="font-size:1rem">' + rankStatusBadge(summary.rankingStatus) + '</div><div class="stat-label">Status ranking</div></div>' +
    "</div>" +
    '<section class="panel"><h2>Rata-rata per indikator</h2><div id="indicatorTable"></div></section>' +
    '<section class="panel"><h2>Nilai dari setiap penilai</h2><div id="evaluatorScoreTable"></div></section>';

  renderTable("indicatorTable", [
    { label: "Indikator", render: function (row) { return escapeHtml(row.label); } },
    { label: "Rata-rata", className: "num", render: function (row) { return formatScore(row.average); } },
    { label: "Jumlah penilai", className: "num", render: function (row) { return row.count; } }
  ], INDICATORS.map(function (indicator) {
    const item = summary.indicators[indicator.key];
    return { label: indicator.label, average: item.avg, count: item.count };
  }));

  const columns = [
    { label: "Penilai", render: function (row) { return escapeHtml(row.nama || row.idPenilai); } },
    { label: "Jabatan", render: function (row) { return escapeHtml(row.jabatan); } }
  ];
  INDICATORS.forEach(function (indicator) {
    columns.push({ label: indicator.label, className: "num", render: function (row) { return row.scores[indicator.key] === "" ? TEXT_EMPTY : row.scores[indicator.key]; } });
  });
  columns.push({ label: "Diperbarui", render: function (row) { return escapeHtml(row.updatedAt); } });
  renderTable("evaluatorScoreTable", columns, evaluators, "Belum ada penilai yang memberi nilai.");
}
