/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Core
 * FILE         : ui.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Fungsi tampilan yang dipakai semua halaman: kerangka menu,
 * notifikasi, dialog, konfirmasi, tabel, badge, format angka,
 * dan unduh CSV (bisa dibuka di Excel).
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
 *
 * Used By
 * - Semua file halaman
 *
 ******************************************************************/

/******************************************************************
 * CONSTANTS - UI
 ******************************************************************/
const HTML_ESCAPE_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const CSV_DANGEROUS_START = /^[=+\-@]/;

/******************************************************************
 * HELPER DASAR
 ******************************************************************/

/******************************************************************
 * Function : byId()
 * Tujuan   : Singkatan document.getElementById.
 ******************************************************************/
function byId(id) {
  return document.getElementById(id);
}

/******************************************************************
 * Function : escapeHtml()
 * Tujuan   : Mengamankan teks sebelum dimasukkan ke HTML.
 *            WAJIB dipakai untuk semua data dari server.
 ******************************************************************/
function escapeHtml(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return text.replace(/[&<>"']/g, function (char) { return HTML_ESCAPE_MAP[char]; });
}

/******************************************************************
 * Function : getHost()
 * Tujuan   : Mengambil elemen penampung (toast/modal), membuatnya
 *            jika belum ada di halaman.
 ******************************************************************/
function getHost(id) {
  let host = byId(id);
  if (!host) {
    host = document.createElement("div");
    host.id = id;
    if (id === "toastHost") {
      host.className = "toast-host";
    }
    document.body.appendChild(host);
  }
  return host;
}

/******************************************************************
 * Function : formatScore()
 * Tujuan   : Format nilai dengan 2 desimal (koma). Kosong = "-".
 ******************************************************************/
function formatScore(value) {
  if (value === "" || value === null || value === undefined) {
    return TEXT_EMPTY;
  }
  return Number(value).toLocaleString("id-ID", {
    minimumFractionDigits: SCORE_DECIMALS,
    maximumFractionDigits: SCORE_DECIMALS
  });
}

/******************************************************************
 * Function : indicatorLabel()
 * Tujuan   : Nama tampil indikator dari key-nya.
 ******************************************************************/
function indicatorLabel(key) {
  const found = INDICATORS.filter(function (item) { return item.key === key; })[0];
  return found ? found.label : key;
}

/******************************************************************
 * Function : todayText()
 * Tujuan   : Tanggal hari ini dalam bahasa Indonesia.
 ******************************************************************/
function todayText() {
  return new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/******************************************************************
 * Function : getQueryParam()
 * Tujuan   : Membaca parameter di alamat halaman (?id=K001).
 ******************************************************************/
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

/******************************************************************
 * Function : debounce()
 * Tujuan   : Menunda fungsi sampai pengguna berhenti mengetik.
 ******************************************************************/
function debounce(task, delay) {
  let timer = null;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(task, delay);
  };
}

/******************************************************************
 * Function : uniqueValues()
 * Tujuan   : Daftar nilai unik (terurut) dari satu kolom.
 ******************************************************************/
function uniqueValues(list, key) {
  const seen = {};
  list.forEach(function (item) {
    if (item[key]) { seen[item[key]] = true; }
  });
  return Object.keys(seen).sort(function (a, b) { return a.localeCompare(b); });
}

/******************************************************************
 * Function : buildOptions()
 * Tujuan   : HTML <option> dari daftar nilai.
 ******************************************************************/
function buildOptions(values, selected) {
  return values.map(function (value) {
    const isSelected = String(value) === String(selected) ? " selected" : "";
    return '<option value="' + escapeHtml(value) + '"' + isSelected + ">" + escapeHtml(value) + "</option>";
  }).join("");
}

/******************************************************************
 * Function : buildDatalist()
 * Tujuan   : HTML <datalist> untuk saran isian (mengurangi salah ketik).
 ******************************************************************/
function buildDatalist(id, values) {
  return '<datalist id="' + id + '">' + values.map(function (value) {
    return '<option value="' + escapeHtml(value) + '"></option>';
  }).join("") + "</datalist>";
}

/******************************************************************
 * NOTIFIKASI DAN TOMBOL
 ******************************************************************/

/******************************************************************
 * Function : showToast()
 * Tujuan   : Menampilkan pesan singkat (info, success, error).
 ******************************************************************/
function showToast(message, type) {
  const toast = document.createElement("div");
  toast.className = "toast toast-" + (type || "info");
  toast.setAttribute("role", "status");
  toast.textContent = message;
  getHost("toastHost").appendChild(toast);
  setTimeout(function () { toast.remove(); }, TOAST_DURATION);
}

/******************************************************************
 * Function : setButtonBusy()
 * Tujuan   : Mengunci tombol saat proses berjalan.
 ******************************************************************/
function setButtonBusy(button, busy) {
  if (!button) { return; }
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = TEXT_BUSY;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.label || button.textContent;
    button.disabled = false;
  }
}

/******************************************************************
 * Function : showError()
 * Tujuan   : Menampilkan kotak pesan error di dalam elemen.
 ******************************************************************/
function showError(hostId, message) {
  byId(hostId).innerHTML = '<div class="error-box">' + escapeHtml(message) + "</div>";
}

/******************************************************************
 * Function : showFormError()
 * Tujuan   : Menampilkan pesan error di kotak #formError dalam dialog.
 *            lines = daftar kalimat tambahan (boleh kosong).
 ******************************************************************/
function showFormError(message, lines) {
  const box = byId("formError");
  if (!box) { return; }
  let html = escapeHtml(message);
  if (lines && lines.length > 0) {
    html += "<ul>" + lines.map(function (line) { return "<li>" + escapeHtml(line) + "</li>"; }).join("") + "</ul>";
  }
  box.innerHTML = html;
  box.hidden = false;
}

/******************************************************************
 * DIALOG
 ******************************************************************/

/******************************************************************
 * Function : openModal()
 * Tujuan   : Membuka jendela dialog. Mengembalikan elemen isinya.
 ******************************************************************/
function openModal(title, bodyHtml, options) {
  const wide = options && options.wide ? " modal-wide" : "";
  const host = getHost("modalHost");
  host.innerHTML =
    '<div class="modal-backdrop"><div class="modal' + wide + '" role="dialog" aria-modal="true">' +
    '<div class="modal-header"><h2>' + escapeHtml(title) + "</h2>" +
    '<button type="button" class="icon-btn" id="modalClose" aria-label="Tutup">&times;</button></div>' +
    '<div class="modal-body">' + bodyHtml + "</div></div></div>";
  byId("modalClose").addEventListener("click", closeModal);
  return host.querySelector(".modal-body");
}

/******************************************************************
 * Function : closeModal()
 * Tujuan   : Menutup jendela dialog.
 ******************************************************************/
function closeModal() {
  const host = byId("modalHost");
  if (host) { host.innerHTML = ""; }
}

/******************************************************************
 * Function : confirmDialog()
 * Tujuan   : Dialog konfirmasi bertumpuk di atas dialog lain.
 *            Mengembalikan Promise true (lanjut) atau false.
 ******************************************************************/
function confirmDialog(message, confirmText) {
  return new Promise(function (resolve) {
    const host = getHost("confirmHost");
    host.innerHTML =
      '<div class="modal-backdrop modal-top"><div class="modal modal-small" role="alertdialog" aria-modal="true">' +
      '<div class="modal-body"><p>' + escapeHtml(message) + "</p>" +
      '<div class="form-actions"><button type="button" class="btn" id="confirmNo">Batal</button>' +
      '<button type="button" class="btn btn-primary" id="confirmYes">' + escapeHtml(confirmText || "Ya, lanjutkan") + "</button></div></div></div></div>";

    function finish(result) {
      host.innerHTML = "";
      document.removeEventListener("keydown", onKey);
      resolve(result);
    }
    function onKey(event) {
      if (event.key === "Escape") { finish(false); }
    }
    document.addEventListener("keydown", onKey);
    byId("confirmYes").addEventListener("click", function () { finish(true); });
    byId("confirmNo").addEventListener("click", function () { finish(false); });
    byId("confirmYes").focus();
  });
}

/******************************************************************
 * Function : showSecret()
 * Tujuan   : Menampilkan data rahasia SEKALI (username dan password
 *            sementara) dengan tombol salin.
 *            rows = [{ label, value }]
 ******************************************************************/
function showSecret(title, rows) {
  const items = rows.map(function (row) {
    return "<dt>" + escapeHtml(row.label) + "</dt><dd>" + escapeHtml(row.value) + "</dd>";
  }).join("");
  openModal(title,
    '<p class="muted">Catat atau salin sekarang. Password ini <strong>tidak akan ditampilkan lagi</strong>. ' +
    "Minta pengguna menggantinya setelah login pertama.</p>" +
    '<dl class="secret-list">' + items + "</dl>" +
    '<div class="form-actions"><button type="button" class="btn" id="secretCopy">Salin</button>' +
    '<button type="button" class="btn btn-primary" id="secretDone">Selesai</button></div>');

  byId("secretDone").addEventListener("click", closeModal);
  byId("secretCopy").addEventListener("click", async function () {
    const text = rows.map(function (row) { return row.label + ": " + row.value; }).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      showToast("Tersalin.", "success");
    } catch (error) {
      console.error("[COPY]", error);
      showToast("Gagal menyalin. Salin manual.", "error");
    }
  });
}

document.addEventListener("keydown", function (event) {
  const confirmHost = byId("confirmHost");
  if (event.key === "Escape" && !(confirmHost && confirmHost.innerHTML)) {
    closeModal();
  }
});

/******************************************************************
 * TABEL DAN BADGE
 ******************************************************************/

/******************************************************************
 * Function : renderTable()
 * Tujuan   : Menggambar tabel ke elemen. columns =
 *            [{ label, className, render(row) -> HTML aman }].
 ******************************************************************/
function renderTable(hostId, columns, rows, emptyText) {
  const host = byId(hostId);
  if (!rows || rows.length === 0) {
    host.innerHTML = '<div class="empty">' + escapeHtml(emptyText || TEXT_NO_DATA) + "</div>";
    return;
  }
  const head = columns.map(function (column) {
    return '<th class="' + (column.className || "") + '">' + escapeHtml(column.label) + "</th>";
  }).join("");
  const body = rows.map(function (row) {
    return "<tr>" + columns.map(function (column) {
      return '<td class="' + (column.className || "") + '">' + column.render(row) + "</td>";
    }).join("") + "</tr>";
  }).join("");
  host.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr>' + head + "</tr></thead><tbody>" + body + "</tbody></table></div>";
}

/******************************************************************
 * Function : statusBadge()
 * Tujuan   : Badge status Aktif/Nonaktif.
 ******************************************************************/
function statusBadge(status) {
  const css = status === STATUS_ACTIVE ? "badge-green" : "badge-gray";
  return '<span class="badge ' + css + '">' + escapeHtml(status || TEXT_EMPTY) + "</span>";
}

/******************************************************************
 * Function : rankStatusBadge()
 * Tujuan   : Badge status kelayakan ranking.
 ******************************************************************/
function rankStatusBadge(status) {
  let css = "badge-gray";
  if (status === RANK_STATUS_ELIGIBLE) { css = "badge-green"; }
  if (status === RANK_STATUS_LOW) { css = "badge-amber"; }
  return '<span class="badge ' + css + '">' + escapeHtml(status || TEXT_EMPTY) + "</span>";
}

/******************************************************************
 * Function : buildStat()
 * Tujuan   : HTML satu kotak angka ringkasan.
 ******************************************************************/
function buildStat(label, value, note) {
  return '<div class="stat"><div class="stat-value">' + escapeHtml(value) + '</div><div class="stat-label">' +
    escapeHtml(label) + "</div>" + (note ? '<div class="stat-note">' + escapeHtml(note) + "</div>" : "") + "</div>";
}

/******************************************************************
 * EKSPOR
 ******************************************************************/

/******************************************************************
 * Function : csvCell()
 * Tujuan   : Mengubah satu nilai menjadi sel CSV yang aman (angka
 *            memakai koma desimal, rumus Excel dinetralkan).
 ******************************************************************/
function csvCell(value) {
  let text = value === null || value === undefined ? "" : String(value);
  if (typeof value === "number") {
    text = text.replace(".", ",");
  } else if (CSV_DANGEROUS_START.test(text)) {
    text = "'" + text;
  }
  return '"' + text.replace(/"/g, '""') + '"';
}

/******************************************************************
 * Function : downloadCsv()
 * Tujuan   : Mengunduh data sebagai file CSV (dibuka di Excel).
 ******************************************************************/
function downloadCsv(filename, headers, rows) {
  const lines = [CSV_SEPARATOR_LINE, headers.map(csvCell).join(CSV_SEPARATOR)].concat(
    rows.map(function (row) { return row.map(csvCell).join(CSV_SEPARATOR); })
  );
  const blob = new Blob([CSV_BOM + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/******************************************************************
 * KERANGKA HALAMAN
 ******************************************************************/

/******************************************************************
 * Function : initPage()
 * Tujuan   : Dipanggil pertama di setiap halaman terkunci. Memeriksa
 *            login dan role, menggambar menu samping, dan mengatur
 *            judul. Mengembalikan data pengguna atau null (hentikan
 *            proses halaman jika null).
 *            options = { roles, active, title }
 ******************************************************************/
function initPage(options) {
  const user = guardPage(options.roles);
  if (!user) { return null; }

  const items = MENU_ITEMS.filter(function (item) { return item.roles.indexOf(user.role) !== -1; });
  const links = items.map(function (item) {
    const active = item.key === options.active ? " active" : "";
    return '<a class="nav-link' + active + '" href="' + item.page + '">' + escapeHtml(item.label) + "</a>";
  }).join("");

  byId("sidebar").innerHTML =
    '<div class="brand"><img src="assets/logo.png" alt="" width="36" height="36"><span>' + APP_NAME + "</span></div>" +
    '<nav class="nav">' + links + "</nav>" +
    '<div class="user-box"><div class="user-name">' + escapeHtml(user.displayName || user.username) + "</div>" +
    '<div class="user-role">' + escapeHtml(ROLE_LABELS[user.role] || user.role) + "</div>" +
    '<button type="button" class="btn btn-block" id="logoutButton">Keluar</button></div>';

  byId("logoutButton").addEventListener("click", performLogout);
  byId("pageTitle").textContent = options.title;
  document.title = options.title + " | " + APP_NAME;

  const toggle = byId("menuToggle");
  const backdrop = byId("menuBackdrop");
  if (toggle) {
    toggle.addEventListener("click", function () { document.body.classList.toggle("menu-open"); });
  }
  if (backdrop) {
    backdrop.addEventListener("click", function () { document.body.classList.remove("menu-open"); });
  }
  return user;
}
