/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Assessment
 * FILE         : penilaian.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Halaman Penilaian (Penilai): daftar karyawan aktif dengan status
 * sudah/belum dinilai, dan form 6 indikator (0-100).
 * Kolom nilai boleh dikosongkan, angka 0 tetap dihitung.
 * Membuka penilaian.html?edit=K001 langsung membuka form karyawan itu.
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
 * - penilaian.html
 * - arsip.js (lewat tautan)
 *
 ******************************************************************/

/******************************************************************
 * STATE
 ******************************************************************/
let assessmentEmployees = [];

/******************************************************************
 * INISIALISASI
 ******************************************************************/
document.addEventListener("DOMContentLoaded", initAssessmentPage);

/******************************************************************
 * Function : initAssessmentPage()
 * Tujuan   : Menyiapkan halaman, memuat daftar, dan membuka form
 *            jika ada parameter ?edit=.
 ******************************************************************/
async function initAssessmentPage() {
  const user = initPage({ roles: [ROLE_PENILAI], active: "penilaian", title: "Penilaian" });
  if (!user) { return; }

  byId("filterSearch").addEventListener("input", debounce(renderAssessmentTable, SEARCH_DELAY));
  byId("filterDept").addEventListener("change", renderAssessmentTable);
  byId("filterStatus").addEventListener("change", renderAssessmentTable);
  byId("assessmentTable").addEventListener("click", onAssessmentTableClick);
  await loadAssessmentEmployees();

  const editId = getQueryParam("edit");
  if (editId) {
    const employee = assessmentEmployees.filter(function (item) { return item.id === editId; })[0];
    if (employee) { openAssessmentForm(employee); }
  }
}

/******************************************************************
 * Function : loadAssessmentEmployees()
 * Tujuan   : Mengambil daftar karyawan beserta status penilaian.
 ******************************************************************/
async function loadAssessmentEmployees() {
  byId("assessmentTable").innerHTML = '<div class="empty">' + TEXT_LOADING + "</div>";
  const result = await apiCall("assessment.employees");
  if (!result.ok) { showError("assessmentTable", result.message); return; }
  assessmentEmployees = result.data.items;

  const select = byId("filterDept");
  const selected = select.value;
  select.innerHTML = '<option value="">Semua departemen</option>' + buildOptions(uniqueValues(assessmentEmployees, "departemen"), selected);
  renderAssessmentTable();
}

/******************************************************************
 * TABEL
 ******************************************************************/

/******************************************************************
 * Function : renderAssessmentTable()
 * Tujuan   : Menggambar daftar sesuai pencarian dan filter, serta
 *            ringkasan kemajuan.
 ******************************************************************/
function renderAssessmentTable() {
  const search = byId("filterSearch").value.trim().toLowerCase();
  const dept = byId("filterDept").value;
  const status = byId("filterStatus").value;

  const assessedTotal = assessmentEmployees.filter(function (item) { return item.assessed; }).length;
  byId("assessmentProgress").textContent = assessedTotal + " dari " + assessmentEmployees.length + " karyawan sudah Anda nilai";

  const rows = assessmentEmployees.filter(function (item) {
    return (!search || item.nama.toLowerCase().indexOf(search) !== -1) &&
      (!dept || item.departemen === dept) &&
      (!status || (status === "sudah" ? item.assessed : !item.assessed));
  });

  renderTable("assessmentTable", [
    { label: "Nama", render: function (row) { return escapeHtml(row.nama); } },
    { label: "Departemen", render: function (row) { return escapeHtml(row.departemen); } },
    { label: "Jabatan", render: function (row) { return escapeHtml(row.jabatan); } },
    { label: "Status", render: function (row) {
      return row.assessed
        ? '<span class="badge badge-green">Sudah (' + row.filledCount + "/" + INDICATORS.length + ")</span>"
        : '<span class="badge badge-gray">Belum</span>';
    } },
    { label: "Diperbarui", render: function (row) { return escapeHtml(row.updatedAt || TEXT_EMPTY); } },
    { label: "", render: function (row) {
      return '<button type="button" class="btn btn-small' + (row.assessed ? "" : " btn-primary") + '" data-id="' + escapeHtml(row.id) + '">' + (row.assessed ? "Ubah" : "Nilai") + "</button>";
    } }
  ], rows, "Tidak ada karyawan yang cocok.");
}

/******************************************************************
 * Function : onAssessmentTableClick()
 * Tujuan   : Membuka form saat tombol Nilai/Ubah diklik.
 ******************************************************************/
function onAssessmentTableClick(event) {
  const button = event.target.closest("button[data-id]");
  if (!button) { return; }
  const employee = assessmentEmployees.filter(function (item) { return item.id === button.dataset.id; })[0];
  if (employee) { openAssessmentForm(employee); }
}

/******************************************************************
 * FORM PENILAIAN
 ******************************************************************/

/******************************************************************
 * Function : parseScoreInput()
 * Tujuan   : Memeriksa satu isian nilai. Mengembalikan
 *            { blank: true } atau { value } atau { error: true }.
 ******************************************************************/
function parseScoreInput(text) {
  const clean = String(text).trim().replace(",", ".");
  if (clean === "") { return { blank: true }; }
  const number = Number(clean);
  if (!isFinite(number) || number < SCORE_MIN || number > SCORE_MAX) { return { error: true }; }
  return { value: number };
}

/******************************************************************
 * Function : updateScorePreview()
 * Tujuan   : Menampilkan rata-rata nilai yang sedang diisi.
 ******************************************************************/
function updateScorePreview(form) {
  const values = [];
  INDICATORS.forEach(function (indicator) {
    const parsed = parseScoreInput(form[indicator.key].value);
    if (parsed.value !== undefined) { values.push(parsed.value); }
  });
  const total = values.reduce(function (sum, value) { return sum + value; }, 0);
  byId("scorePreview").textContent = values.length === 0
    ? "Belum ada nilai diisi."
    : "Rata-rata nilai yang diisi: " + formatScore(total / values.length) + " (" + values.length + " dari " + INDICATORS.length + " indikator)";
}

/******************************************************************
 * Function : openAssessmentForm()
 * Tujuan   : Membuka form penilaian satu karyawan. Nilai lama
 *            (jika ada) diisi otomatis.
 ******************************************************************/
async function openAssessmentForm(employee) {
  const loaded = await apiCall("assessment.get", { idKaryawan: employee.id });
  if (!loaded.ok) { showToast(loaded.message, "error"); return; }
  const existing = loaded.data.assessment;

  const fields = INDICATORS.map(function (indicator) {
    const value = existing && existing.scores[indicator.key] !== "" ? existing.scores[indicator.key] : "";
    return '<label class="field"><span>' + escapeHtml(indicator.label) + '</span><input name="' + indicator.key +
      '" type="text" inputmode="decimal" autocomplete="off" placeholder="0-100" value="' + escapeHtml(value) + '"></label>';
  }).join("");

  openModal("Penilaian: " + employee.nama,
    '<p class="muted">' + escapeHtml([employee.departemen, employee.jabatan].filter(Boolean).join(" \u00b7 ")) +
    (existing ? "<br>Terakhir diubah: " + escapeHtml(existing.updatedAt) : "") + "</p>" +
    '<form id="assessmentForm" novalidate><div class="field-grid">' + fields + "</div>" +
    '<p class="muted small">Isi angka ' + SCORE_MIN + "-" + SCORE_MAX + ". Kosongkan indikator yang tidak ingin Anda nilai (kosong tidak dihitung). Angka 0 tetap dihitung sebagai nilai.</p>" +
    '<div class="preview" id="scorePreview"></div>' +
    '<div id="formError" class="form-error" hidden></div>' +
    '<div class="form-actions"><button type="button" class="btn" id="formCancel">Batal</button>' +
    '<button type="submit" class="btn btn-primary">' + (existing ? "Perbarui" : "Simpan") + "</button></div></form>",
    { wide: true });

  const form = byId("assessmentForm");
  updateScorePreview(form);
  form.addEventListener("input", function () { updateScorePreview(form); });
  byId("formCancel").addEventListener("click", closeModal);
  form.addEventListener("submit", function (event) { submitAssessment(event, employee); });
  form[INDICATORS[0].key].focus();
}

/******************************************************************
 * Function : submitAssessment()
 * Tujuan   : Memeriksa isian, meminta konfirmasi, lalu menyimpan.
 ******************************************************************/
async function submitAssessment(event, employee) {
  event.preventDefault();
  const form = event.target;
  const scores = {};
  let filled = 0;

  for (let i = 0; i < INDICATORS.length; i++) {
    const indicator = INDICATORS[i];
    const parsed = parseScoreInput(form[indicator.key].value);
    if (parsed.error) {
      showFormError("Nilai " + indicator.label + " harus angka " + SCORE_MIN + "-" + SCORE_MAX + ".");
      form[indicator.key].focus();
      return;
    }
    scores[indicator.key] = parsed.blank ? "" : parsed.value;
    if (!parsed.blank) { filled++; }
  }
  if (filled === 0) { showFormError(MSG_ASSESS_EMPTY); return; }
  if (!(await confirmDialog("Simpan penilaian untuk " + employee.nama + "?"))) { return; }

  const button = form.querySelector('button[type="submit"]');
  setButtonBusy(button, true);
  const result = await apiCall("assessment.save", { idKaryawan: employee.id, scores: scores });
  setButtonBusy(button, false);

  if (!result.ok) { showFormError(result.message); return; }
  closeModal();
  showToast(result.message, "success");
  await loadAssessmentEmployees();
}
