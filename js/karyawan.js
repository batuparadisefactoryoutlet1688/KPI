/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Employees
 * FILE         : karyawan.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Halaman Data Karyawan (Admin): daftar, cari, filter, tambah,
 * tempel banyak sekaligus dari Excel, ubah, dan aktif/nonaktif.
 * ID karyawan dibuat otomatis oleh backend (K001, K002, dst.).
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
 * - karyawan.html
 *
 ******************************************************************/

/******************************************************************
 * STATE
 ******************************************************************/
let employeeList = [];

/******************************************************************
 * INISIALISASI
 ******************************************************************/
document.addEventListener("DOMContentLoaded", initEmployeePage);

/******************************************************************
 * Function : initEmployeePage()
 * Tujuan   : Menyiapkan halaman dan memuat daftar karyawan.
 ******************************************************************/
async function initEmployeePage() {
  const user = initPage({ roles: [ROLE_ADMIN], active: "karyawan", title: "Data Karyawan" });
  if (!user) { return; }

  byId("btnAddEmployee").addEventListener("click", function () { openEmployeeForm(null); });
  byId("btnBulkEmployee").addEventListener("click", openBulkForm);
  byId("filterSearch").addEventListener("input", debounce(renderEmployeeTable, SEARCH_DELAY));
  byId("filterDept").addEventListener("change", renderEmployeeTable);
  byId("filterStatus").addEventListener("change", renderEmployeeTable);
  byId("employeeTable").addEventListener("click", onEmployeeTableClick);
  await loadEmployees();
}

/******************************************************************
 * Function : loadEmployees()
 * Tujuan   : Mengambil daftar karyawan dari API.
 ******************************************************************/
async function loadEmployees() {
  byId("employeeTable").innerHTML = '<div class="empty">' + TEXT_LOADING + "</div>";
  const result = await apiCall("employees.list");
  if (!result.ok) { showError("employeeTable", result.message); return; }
  employeeList = result.data.items;

  const select = byId("filterDept");
  const selected = select.value;
  select.innerHTML = '<option value="">Semua departemen</option>' + buildOptions(uniqueValues(employeeList, "departemen"), selected);
  renderEmployeeTable();
}

/******************************************************************
 * TABEL
 ******************************************************************/

/******************************************************************
 * Function : renderEmployeeTable()
 * Tujuan   : Menggambar tabel sesuai pencarian dan filter.
 ******************************************************************/
function renderEmployeeTable() {
  const search = byId("filterSearch").value.trim().toLowerCase();
  const dept = byId("filterDept").value;
  const status = byId("filterStatus").value;

  const rows = employeeList.filter(function (item) {
    return (!search || item.nama.toLowerCase().indexOf(search) !== -1) &&
      (!dept || item.departemen === dept) &&
      (!status || item.status === status);
  });
  byId("employeeCount").textContent = rows.length + " dari " + employeeList.length + " karyawan";

  renderTable("employeeTable", [
    { label: "ID", render: function (row) { return escapeHtml(row.id); } },
    { label: "Nama", render: function (row) { return escapeHtml(row.nama); } },
    { label: "Departemen", render: function (row) { return escapeHtml(row.departemen); } },
    { label: "Jabatan", render: function (row) { return escapeHtml(row.jabatan); } },
    { label: "Status", render: function (row) { return statusBadge(row.status); } },
    { label: "Aksi", render: function (row) {
      const toggleLabel = row.status === STATUS_ACTIVE ? "Nonaktifkan" : "Aktifkan";
      return '<div class="actions"><button type="button" class="btn btn-small" data-action="edit" data-id="' + escapeHtml(row.id) + '">Ubah</button>' +
        '<button type="button" class="btn btn-small" data-action="toggle" data-id="' + escapeHtml(row.id) + '">' + toggleLabel + "</button></div>";
    } }
  ], rows, "Belum ada karyawan. Klik Tambah Karyawan atau Tempel Banyak.");
}

/******************************************************************
 * Function : onEmployeeTableClick()
 * Tujuan   : Menangani tombol Ubah dan Aktifkan/Nonaktifkan.
 ******************************************************************/
async function onEmployeeTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) { return; }
  const employee = employeeList.filter(function (item) { return item.id === button.dataset.id; })[0];
  if (!employee) { return; }

  if (button.dataset.action === "edit") {
    openEmployeeForm(employee);
    return;
  }
  const newStatus = employee.status === STATUS_ACTIVE ? STATUS_INACTIVE : STATUS_ACTIVE;
  const note = newStatus === STATUS_INACTIVE ? " Karyawan nonaktif tidak bisa dinilai dan tidak masuk ranking." : "";
  if (!(await confirmDialog(newStatus + "kan " + employee.nama + "?" + note))) { return; }

  const result = await apiCall("employees.setStatus", { id: employee.id, status: newStatus });
  showToast(result.message, result.ok ? "success" : "error");
  if (result.ok) { await loadEmployees(); }
}

/******************************************************************
 * FORM TAMBAH / UBAH
 ******************************************************************/

/******************************************************************
 * Function : openEmployeeForm()
 * Tujuan   : Membuka form tambah (employee = null) atau ubah.
 ******************************************************************/
function openEmployeeForm(employee) {
  const isEdit = !!employee;
  const data = employee || { nama: "", departemen: "", jabatan: "" };

  openModal(isEdit ? "Ubah Karyawan" : "Tambah Karyawan",
    '<form id="employeeForm" novalidate>' +
    '<label class="field"><span>Nama lengkap</span><input name="nama" type="text" maxlength="100" value="' + escapeHtml(data.nama) + '" required></label>' +
    '<label class="field"><span>Departemen</span><input name="departemen" type="text" maxlength="100" list="deptList" value="' + escapeHtml(data.departemen) + '" required>' +
    "<small>Pilih dari saran agar penulisan seragam.</small></label>" +
    '<label class="field"><span>Jabatan</span><input name="jabatan" type="text" maxlength="100" list="positionList" value="' + escapeHtml(data.jabatan) + '" required></label>' +
    buildDatalist("deptList", uniqueValues(employeeList, "departemen")) +
    buildDatalist("positionList", uniqueValues(employeeList, "jabatan")) +
    '<div id="formError" class="form-error" hidden></div>' +
    '<div class="form-actions"><button type="button" class="btn" id="formCancel">Batal</button>' +
    '<button type="submit" class="btn btn-primary">Simpan</button></div></form>');

  byId("formCancel").addEventListener("click", closeModal);
  byId("employeeForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.target;
    const payload = {
      nama: form.nama.value.trim(),
      departemen: form.departemen.value.trim(),
      jabatan: form.jabatan.value.trim()
    };
    if (!payload.nama || !payload.departemen || !payload.jabatan) {
      showFormError(MSG_FIELDS_REQUIRED);
      return;
    }
    if (isEdit) { payload.id = employee.id; }

    const button = form.querySelector('button[type="submit"]');
    setButtonBusy(button, true);
    const result = await apiCall(isEdit ? "employees.update" : "employees.add", payload);
    setButtonBusy(button, false);

    if (!result.ok) { showFormError(result.message); return; }
    closeModal();
    showToast(result.message, "success");
    await loadEmployees();
  });
}

/******************************************************************
 * FORM TEMPEL BANYAK
 ******************************************************************/

/******************************************************************
 * Function : parseBulkText()
 * Tujuan   : Mengubah teks tempelan (tab, titik koma, atau koma)
 *            menjadi daftar { nama, departemen, jabatan }.
 *            Baris judul "nama" dilewati.
 ******************************************************************/
function parseBulkText(text) {
  const lines = text.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(function (line) { return line.length > 0; });
  const items = lines.map(function (line) {
    const separator = line.indexOf("\t") !== -1 ? "\t" : (line.indexOf(";") !== -1 ? ";" : ",");
    const parts = line.split(separator).map(function (part) { return part.trim(); });
    return { nama: parts[0] || "", departemen: parts[1] || "", jabatan: parts[2] || "" };
  });
  if (items.length > 0 && items[0].nama.toLowerCase() === "nama") { items.shift(); }
  return items;
}

/******************************************************************
 * Function : openBulkForm()
 * Tujuan   : Form untuk menempel banyak karyawan sekaligus.
 *            Jika ada satu baris salah, tidak ada yang disimpan.
 ******************************************************************/
function openBulkForm() {
  openModal("Tempel Banyak Karyawan",
    '<form id="bulkForm" novalidate>' +
    '<p class="muted">Salin dari Excel tiga kolom <strong>Nama, Departemen, Jabatan</strong> (satu karyawan per baris), lalu tempel di bawah. ID dibuat otomatis.</p>' +
    '<label class="field"><span>Data karyawan</span><textarea name="bulk" placeholder="Budi Santoso&#9;Front Office&#9;Receptionist"></textarea></label>' +
    '<div id="formError" class="form-error" hidden></div>' +
    '<div class="form-actions"><button type="button" class="btn" id="formCancel">Batal</button>' +
    '<button type="submit" class="btn btn-primary">Simpan semua</button></div></form>');

  byId("formCancel").addEventListener("click", closeModal);
  byId("bulkForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const items = parseBulkText(event.target.bulk.value);
    if (items.length === 0) { showFormError("Data kosong."); return; }
    if (!(await confirmDialog("Simpan " + items.length + " karyawan baru?"))) { return; }

    const button = event.target.querySelector('button[type="submit"]');
    setButtonBusy(button, true);
    const result = await apiCall("employees.addBulk", { items: items });
    setButtonBusy(button, false);

    if (!result.ok) {
      showFormError(result.message, result.data && result.data.errors);
      return;
    }
    closeModal();
    showToast(result.data.count + " karyawan ditambahkan.", "success");
    await loadEmployees();
  });
}
