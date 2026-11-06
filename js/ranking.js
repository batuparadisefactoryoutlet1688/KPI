/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Ranking
 * FILE         : ranking.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Halaman Ranking (Admin): 7 kategori (Keseluruhan dan 6 indikator),
 * Top 5/10/20/50/100, filter departemen dan status, pencarian nama,
 * hanya yang memenuhi syarat, unduh Excel (CSV), dan cetak PDF.
 * Peringkat dihitung di dalam hasil filter. Nilai sama = peringkat sama.
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
 * - ranking.html
 *
 ******************************************************************/

/******************************************************************
 * STATE
 ******************************************************************/
let rankingResult = null;

/******************************************************************
 * INISIALISASI
 ******************************************************************/
document.addEventListener("DOMContentLoaded", initRankingPage);

/******************************************************************
 * Function : initRankingPage()
 * Tujuan   : Menyiapkan pilihan kategori, Top N, departemen, lalu
 *            memuat ranking pertama.
 ******************************************************************/
async function initRankingPage() {
  const user = initPage({ roles: [ROLE_ADMIN], active: "ranking", title: "Ranking" });
  if (!user) { return; }

  const categories = [{ key: CATEGORY_OVERALL, label: CATEGORY_OVERALL_LABEL }].concat(INDICATORS);
  byId("rankCategory").innerHTML = categories.map(function (item) {
    return '<option value="' + item.key + '">' + escapeHtml(item.label) + "</option>";
  }).join("");
  byId("rankTop").innerHTML = RANKING_TOP_OPTIONS.map(function (count) {
    const selected = count === RANKING_TOP_DEFAULT ? " selected" : "";
    return '<option value="' + count + '"' + selected + ">Top " + count + "</option>";
  }).join("");

  ["rankCategory", "rankTop", "rankDept", "rankStatus", "rankEligible"].forEach(function (id) {
    byId(id).addEventListener("change", loadRanking);
  });
  byId("rankSearch").addEventListener("input", debounce(loadRanking, SEARCH_DELAY));
  byId("btnRefreshRanking").addEventListener("click", refreshRankingNow);
  byId("btnCsvRanking").addEventListener("click", exportRankingCsv);
  byId("btnPrintRanking").addEventListener("click", function () { window.print(); });

  const employees = await apiCall("employees.list");
  if (employees.ok) {
    byId("rankDept").innerHTML = '<option value="">Semua departemen</option>' + buildOptions(uniqueValues(employees.data.items, "departemen"), "");
  }
  await loadRanking();
}

/******************************************************************
 * RANKING
 ******************************************************************/

/******************************************************************
 * Function : loadRanking()
 * Tujuan   : Mengambil ranking sesuai semua pilihan dan filter.
 ******************************************************************/
async function loadRanking() {
  byId("rankingTable").innerHTML = '<div class="empty">' + TEXT_LOADING + "</div>";
  const result = await apiCall("ranking.get", {
    category: byId("rankCategory").value,
    top: Number(byId("rankTop").value),
    departemen: byId("rankDept").value,
    status: byId("rankStatus").value,
    search: byId("rankSearch").value.trim(),
    onlyEligible: byId("rankEligible").checked
  });
  if (!result.ok) { showError("rankingTable", result.message); return; }
  rankingResult = result.data;

  byId("rankingInfo").textContent = "Ranking " + rankingResult.label + ": menampilkan " + rankingResult.items.length + " dari " + rankingResult.total + " karyawan.";
  byId("printHeader").textContent = "KPI - Ranking " + rankingResult.label + " - " + todayText();

  renderTable("rankingTable", [
    { label: "Peringkat", render: function (row) { return '<span class="rank-number">' + row.rank + "</span>"; } },
    { label: "Nama", render: function (row) { return '<a href="' + PAGE.DETAIL + "?id=" + encodeURIComponent(row.id) + '">' + escapeHtml(row.nama) + "</a>"; } },
    { label: "Departemen", render: function (row) { return escapeHtml(row.departemen); } },
    { label: "Nilai " + rankingResult.label, className: "num", render: function (row) { return formatScore(row.value); } },
    { label: "Jumlah penilai", className: "num", render: function (row) { return row.evaluatorCount; } },
    { label: "Kelengkapan indikator", className: "num", render: function (row) { return escapeHtml(row.completeness); } },
    { label: "Status ranking", render: function (row) { return rankStatusBadge(row.rankingStatus); } }
  ], rankingResult.items, "Belum ada nilai untuk filter ini.");
}

/******************************************************************
 * Function : refreshRankingNow()
 * Tujuan   : Admin memperbarui sheet RANKING secara manual.
 ******************************************************************/
async function refreshRankingNow() {
  const button = byId("btnRefreshRanking");
  setButtonBusy(button, true);
  const result = await apiCall("ranking.refresh");
  setButtonBusy(button, false);
  showToast(result.message, result.ok ? "success" : "error");
  if (result.ok) { await loadRanking(); }
}

/******************************************************************
 * Function : exportRankingCsv()
 * Tujuan   : Mengunduh ranking yang sedang tampil (dibuka di Excel).
 ******************************************************************/
function exportRankingCsv() {
  if (!rankingResult || rankingResult.items.length === 0) {
    showToast("Tidak ada data untuk diunduh.", "error");
    return;
  }
  const rows = rankingResult.items.map(function (row) {
    return [row.rank, row.id, row.nama, row.departemen, row.value, row.evaluatorCount, row.completeness, row.rankingStatus];
  });
  downloadCsv("ranking-" + rankingResult.category.toLowerCase() + ".csv",
    ["Peringkat", "ID", "Nama", "Departemen", "Nilai " + rankingResult.label, "Jumlah Penilai", "Kelengkapan", "Status Ranking"], rows);
}
