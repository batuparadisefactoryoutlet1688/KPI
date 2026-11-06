/******************************************************************
 * PROJECT      : KPI
 * MODULE       : Core
 * FILE         : config.js
 * VERSION      : v1.0.0
 * AUTHOR       : Sandri Irawan
 * CREATED      : 2026-11-05
 * LAST UPDATE  : 2026-11-05
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Semua konstanta dan pengaturan website KPI: alamat API, nama
 * halaman, role, indikator, menu, dan pesan standar.
 * Ganti API_URL jika Web App Apps Script di-deploy ulang sebagai
 * deployment baru. Jangan menaruh password atau rahasia di file ini.
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
 * - (tidak ada)
 *
 * Used By
 * - Semua file js/ lainnya
 *
 ******************************************************************/

/******************************************************************
 * CONSTANTS - APLIKASI
 * ----------------------------------------------------------------
 * Identitas aplikasi dan alamat API (Apps Script Web App).
 ******************************************************************/
const APP_NAME = "KPI";
const APP_VERSION = "v1.0.0";

/******************************************************************
 * CONFIGURATION - API DAN SESSION
 * ----------------------------------------------------------------
 * Token login disimpan di sessionStorage (hilang saat tab ditutup).
 ******************************************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbyLYd6fIK6zfkn46EetghLVL2QrsXMIUfwnPrVe9AyjBokVL80Vcjg4MIfuRf_vO5li/exec";
const API_TIMEOUT = 30000;
const SESSION_EXPIRED_HINT = "login ulang";
const STORAGE_TOKEN = "kpi_token";
const STORAGE_USER = "kpi_user";

/******************************************************************
 * CONSTANTS - ROLE DAN STATUS
 ******************************************************************/
const ROLE_ADMIN = "ADMIN";
const ROLE_PENILAI = "PENILAI";
const ROLE_LABELS = { ADMIN: "Admin", PENILAI: "Penilai" };

const STATUS_ACTIVE = "Aktif";
const STATUS_INACTIVE = "Nonaktif";
const STATUS_ALL = "ALL";
const POSITIONS = ["Manager", "Supervisor"];

/******************************************************************
 * CONSTANTS - HALAMAN
 ******************************************************************/
const PAGE = {
  LOGIN: "index.html",
  DASHBOARD: "dashboard.html",
  EMPLOYEES: "karyawan.html",
  EVALUATORS: "penilai.html",
  ASSESSMENT: "penilaian.html",
  ARCHIVE: "arsip.html",
  RANKING: "ranking.html",
  REPORT: "laporan.html",
  DETAIL: "detail.html",
  AUDIT: "audit.html",
  PASSWORD: "password.html"
};

const MENU_ITEMS = [
  { key: "dashboard", label: "Dashboard", page: PAGE.DASHBOARD, roles: [ROLE_ADMIN, ROLE_PENILAI] },
  { key: "penilaian", label: "Penilaian", page: PAGE.ASSESSMENT, roles: [ROLE_PENILAI] },
  { key: "arsip", label: "Arsip Saya", page: PAGE.ARCHIVE, roles: [ROLE_PENILAI] },
  { key: "ranking", label: "Ranking", page: PAGE.RANKING, roles: [ROLE_ADMIN] },
  { key: "laporan", label: "Laporan", page: PAGE.REPORT, roles: [ROLE_ADMIN] },
  { key: "karyawan", label: "Data Karyawan", page: PAGE.EMPLOYEES, roles: [ROLE_ADMIN] },
  { key: "penilai", label: "Data Penilai", page: PAGE.EVALUATORS, roles: [ROLE_ADMIN] },
  { key: "audit", label: "Riwayat Perubahan", page: PAGE.AUDIT, roles: [ROLE_ADMIN] },
  { key: "password", label: "Ganti Password", page: PAGE.PASSWORD, roles: [ROLE_ADMIN, ROLE_PENILAI] }
];

/******************************************************************
 * CONSTANTS - INDIKATOR DAN RANKING
 * ----------------------------------------------------------------
 * key harus sama dengan nama kolom di sheet PENILAIAN.
 ******************************************************************/
const INDICATORS = [
  { key: "DISIPLIN", label: "Disiplin" },
  { key: "PELAYANAN", label: "Pelayanan" },
  { key: "PENJUALAN", label: "Penjualan" },
  { key: "KETELITIAN", label: "Ketelitian" },
  { key: "KERAPIAN", label: "Kerapian" },
  { key: "TANGGUNG_JAWAB", label: "Tanggung Jawab" }
];

const CATEGORY_OVERALL = "OVERALL";
const CATEGORY_OVERALL_LABEL = "Keseluruhan";
const RANKING_TOP_OPTIONS = [5, 10, 20, 50, 100];
const RANKING_TOP_DEFAULT = 100;

const SCORE_MIN = 0;
const SCORE_MAX = 100;
const MIN_PASSWORD_LENGTH = 8;

const RANK_STATUS_NONE = "Belum Dinilai";
const RANK_STATUS_LOW = "Data Penilaian Belum Cukup";
const RANK_STATUS_ELIGIBLE = "Memenuhi Syarat Ranking";

/******************************************************************
 * CONFIGURATION - TAMPILAN
 ******************************************************************/
const TOAST_DURATION = 4000;
const SEARCH_DELAY = 300;
const AUDIT_LIMIT = 200;
const CSV_SEPARATOR = ";";
const CSV_SEPARATOR_LINE = "sep=;";
const CSV_BOM = "\uFEFF";
const SCORE_DECIMALS = 2;

/******************************************************************
 * CONSTANTS - TEKS
 ******************************************************************/
const TEXT_EMPTY = "-";
const TEXT_NO_DATA = "Tidak ada data.";
const TEXT_LOADING = "Memuat...";
const TEXT_BUSY = "Memproses...";

const ACTION_LABELS = {
  ASSESSMENT_CREATE: "Memberi nilai",
  ASSESSMENT_UPDATE: "Mengubah nilai",
  EMPLOYEE_ADD: "Menambah karyawan",
  EMPLOYEE_UPDATE: "Mengubah karyawan",
  EMPLOYEE_STATUS: "Mengubah status karyawan",
  EVALUATOR_ADD: "Menambah penilai",
  EVALUATOR_UPDATE: "Mengubah penilai",
  EVALUATOR_STATUS: "Mengubah status penilai",
  PASSWORD_RESET: "Reset password",
  PASSWORD_CHANGE: "Ganti password"
};

const MSG_NETWORK_ERROR = "Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.";
const MSG_SESSION_EXPIRED = "Sesi berakhir. Silakan login lagi.";
const MSG_PASSWORD_MISMATCH = "Konfirmasi password tidak sama dengan password baru.";
const MSG_PASSWORD_TOO_SHORT = "Password baru minimal 8 karakter.";
const MSG_ASSESS_EMPTY = "Isi minimal satu indikator.";
const MSG_FIELDS_REQUIRED = "Semua kolom wajib diisi.";
