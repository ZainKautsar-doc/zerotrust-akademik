# SIAKAD ZERO TRUST — NIST SP 800-207
> Sistem Informasi Pengelolaan Nilai & Transkrip Akademik Berbasis Arsitektur Keamanan Zero Trust

Aplikasi demonstrasi implementasi standar keamanan **Zero Trust Architecture (NIST SP 800-207)** pada sistem akademik pengelolaan nilai dan transkrip mahasiswa. Dilengkapi dengan **API Gateway (PEP & PE/PA)**, backend microservices terisolasi, database bersama berbasis **Supabase (PostgreSQL)**, dan antarmuka interaktif **React (Vite + Tailwind CSS)** bertema *Frosted Glass Cathedral at Midnight* (AuthKit Design System) dengan simulator konteks perangkat (`X-Device-ID`) dan jam kerja operasional secara live.

---

## 1. Arsitektur Sistem (NIST SP 800-207)

```text
               [ Browser / Klien Frontend (Port 5173) ]
                                    │
                                    │ HTTP (Authorization: Bearer <JWT>, Header: X-Device-ID)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   API GATEWAY (Port 3000)                              │
│                                                                        │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │ PEP (Policy Enforcement)  │ ───► │ PDP / PE (Policy Engine)    │   │
│   │ Menahan seluruh request   │      │ Evaluasi Token, Jam, Device │   │
│   └───────────────────────────┘      └─────────────────────────────┘   │
│                 │                                   │                  │
│                 │ Lolos Evaluasi                    │ Catat Keputusan  │
│                 ▼                                   ▼                  │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │ Reverse Proxy Forwarder   │      │ Audit Logger (Realtime)     │   │
│   │ Menyisipkan Gateway Secret│      │ Simpan status ALLOW / DENY  │   │
│   └───────────────────────────┘      └─────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┬──────────────────┘
                   │                                  │
    (X-Gateway-Secret, Token User)     (X-Gateway-Secret, Token Service)
                   ▼                                  ▼
   ┌──────────────────────────────┐   ┌──────────────────────────────┐
   │ Service Nilai (Port 3001)    │   │ Service Transkrip (Port 3002)│
   │ • Kelola Nilai & Kelas       │   │ • Transkrip Resmi Mahasiswa  │
   │ • Finalisasi & Unfinalisasi  │   │ • Rekap Semua Mahasiswa      │
   │ • Pemicu Token Antar-Layanan │   │ • Sinkronisasi Antar-Layanan │
   └──────────────┬───────────────┘   └──────────────┬───────────────┘
                  │                                  │
                  │ Sinkron via Gateway              │
                  │ (POST /transkrip/sinkron)        │
                  └─────────────────┬────────────────┘
                                    │
                                    ▼
                      ┌────────────────────────────┐
                      │ Shared Database (Supabase) │
                      │ Users, Grades, Audit Logs  │
                      └────────────────────────────┘
```

---

## 2. Fitur Keamanan Zero Trust Utama

1. **Never Trust, Always Verify:**
   - Seluruh request wajib melalui API Gateway (Port 3000).
   - Akses langsung ke Service Nilai (3001) atau Service Transkrip (3002) tanpa melewati Gateway ditolak dengan error `403 Forbidden` (`X-Gateway-Secret missing`).
2. **Context Verification — Perangkat Terdaftar (*Device Context*):**
   - Klien wajib menyertakan header `X-Device-ID`.
   - Gateway mencocokkan ID perangkat dengan whitelist di database. Perangkat ilegal (contoh: `DEV-HACKER-UNREGISTERED`) langsung diblokir (`403 Forbidden: Device Untrusted`).
3. **Context Verification — Jam Operasional (*Temporal Context*):**
   - Mutasi data nilai dan finalisasi kelas dibatasi hanya pada jam operasional (**07:00 – 21:00 WIB**). Request di luar jam tersebut ditolak oleh Policy Engine (`403 Forbidden: Outside working hours`).
4. **Least Privilege Principle:**
   - **Mahasiswa:** Hanya dapat melihat nilai dan transkrip miliknya sendiri (melihat NIM lain ditolak `403 Forbidden`).
   - **Dosen:** Hanya dapat menginput/mengubah nilai pada kelas yang diampunya.
   - **Admin:** Memiliki otorisasi audit untuk melihat seluruh rekap mahasiswa dan riwayat log, namun tidak dapat memanipulasi nilai kelas langsung.
5. **Fitur Finalisasi & Buka Kunci (Unfinalisasi):**
   - Dosen dapat mengunci nilai melalui **Finalisasi** (memicu sinkronisasi data antar-service).
   - Dosen dapat membatalkan penguncian melalui tombol **Buka Kunci Nilai (Unfinalisasi)** jika diperlukan revisi nilai sebelum batas akhir.
6. **Assume Breach & Service-to-Service Token:**
   - Komunikasi antar-service (Service Nilai $\rightarrow$ Service Transkrip) wajib menggunakan **Token Service** resmi berumur 5 menit dengan klaim `role: 'service'`. Token user biasa ditolak pada endpoint sinkronisasi.
7. **Live Gateway Audit Logging:**
   - Setiap keputusan (`ALLOW` / `DENY`) dicatat secara realtime ke tabel `audit_logs` di Supabase lengkap dengan atribut subjek, role, endpoint, device ID, dan badge aksi CRUD (`EDIT NILAI`, `FINALISASI`, `BUKA KUNCI`, `REKAP SEMUA MHS`, dll).

---

## 3. Daftar Akun & Device ID Awal

Seluruh akun memiliki password default: **`password123`**

### A. Akun Preset Demo Cepat di Halaman Login
| Role | Username | Nama Lengkap | NIM / NIP | Device ID Terdaftar | Keterangan Akses |
|---|---|---|---|---|---|
| **Admin** | `admin_utama` | Administrator Akademik | `ADM001` | `DEV-ADMIN-01` | Rekap transkrip seluruh 10 mahasiswa & live audit log |
| **Dosen** | `dosen_budi` | Dr. Budi Santoso, M.T. | `198001012005011001` | `DEV-DOSEN-BUDI` | Mengampu kelas: *Keamanan Informasi (KP70065004)* |
| **Dosen** | `dosen_ani` | Ani Rahmawati, M.Kom. | `198502022008042002` | `DEV-DOSEN-ANI` | Mengampu kelas: *Jaringan Komputer Lanjut (IF40023002)* |
| **Mahasiswa** | `mhs_andi` | Andi Pratama | `2207001` | `DEV-MHS-ANDI` | Mahasiswa demo (Nilai Kelas & Transkrip pribadi) |
| **Mahasiswa** | `mhs_bima` | Bima Satria | `2207002` | `DEV-MHS-BIMA` | Mahasiswa demo (Nilai Kelas & Transkrip pribadi) |

### B. Data Lengkap Seluruh Mahasiswa di Database (10 Mahasiswa)
Tersedia 10 mahasiswa di database yang nilainya dapat dikelola di portal Dosen dan dimonitor langsung di portal Admin:

| No | NIM | Nama Mahasiswa | Username | Device ID Terdaftar | Kelas Terdaftar |
|---|---|---|---|---|---|
| 1 | `2207001` | Andi Pratama | `mhs_andi` | `DEV-MHS-ANDI` | Keamanan Informasi, Jaringan Komputer |
| 2 | `2207002` | Bima Satria | `mhs_bima` | `DEV-MHS-BIMA` | Keamanan Informasi, Jaringan Komputer |
| 3 | `2207003` | Citra Lestari | `mhs_citra` | `DEV-MHS-CITRA` | Keamanan Informasi |
| 4 | `2207004` | Dimas Wahyu Prasetyo | `mhs_dimas` | `DEV-MHS-DIMAS` | Keamanan Informasi, Jaringan Komputer |
| 5 | `2207005` | Eka Putri Handayani | `mhs_eka` | `DEV-MHS-EKA` | Keamanan Informasi, Jaringan Komputer |
| 6 | `2207006` | Fajar Nugraha | `mhs_fajar` | `DEV-MHS-FAJAR` | Keamanan Informasi |
| 7 | `2207007` | Gita Ayu Saraswati | `mhs_gita` | `DEV-MHS-GITA` | Keamanan Informasi, Jaringan Komputer |
| 8 | `2207008` | Hadi Kusuma | `mhs_hadi` | `DEV-MHS-HADI` | Keamanan Informasi |
| 9 | `2207009` | Indah Permatasari | `mhs_indah` | `DEV-MHS-INDAH` | Keamanan Informasi |
| 10 | `2207010` | Joko Tri Pamungkas | `mhs_joko` | `DEV-MHS-JOKO` | Keamanan Informasi |

> **Catatan Pengujian Keamanan:**  
> Pada dropdown simulator atas, tersedia pilihan **`DEV-HACKER-UNREGISTERED`** dan **`DEV-UNKNOWN-DEVICE`** untuk menguji penolakan otomatis oleh Gateway saat perangkat penyerang mencoba mengirim request.

---

## 4. Cara Menjalankan Aplikasi

### Prasyarat
- **Node.js** (v18 atau lebih baru)
- Koneksi internet aktif (untuk koneksi ke Supabase Database)

### Langkah 1: Jalankan Seluruh Backend Services
Buka terminal baru di folder `backend/`:
```powershell
cd backend
npm install
node startAll.js
```
*Script `startAll.js` akan menjalankan 3 service sekaligus:*
- **API Gateway (PEP/PDP):** `http://127.0.0.1:3000`
- **Service Nilai:** `http://127.0.0.1:3001`
- **Service Transkrip:** `http://127.0.0.1:3002`

*(Alternatif di Windows: cukup jalankan file `backend/run-backend.bat`).*

### Langkah 2: Jalankan Frontend Web
Buka terminal kedua di folder `frontend/`:
```powershell
cd frontend
npm install
npm run dev
```
Buka browser pada alamat: **`http://localhost:5173`**

*(Alternatif di Windows: cukup jalankan file `frontend/run-frontend.bat`).*

---

## 5. Ringkasan Endpoint API

| Layanan | Method | Endpoint | Hak Akses (Role) | Keterangan |
|---|---|---|---|---|
| **Gateway** | `POST` | `/auth/login` | Publik (Header Device wajib) | Autentikasi user & penerbitan token |
| **Gateway** | `POST` | `/auth/refresh` | User terotentikasi | Perpanjangan access token |
| **Gateway** | `POST` | `/auth/logout` | User terotentikasi | Pencabutan refresh token |
| **Gateway** | `POST` | `/auth/service` | Internal service credentials | Penerbitan token antar-service |
| **Gateway** | `GET` | `/api/audit-logs` | Publik / Admin | Rekam jejak evaluasi PEP real-time |
| **Gateway** | `GET` | `/api/devices/all` | Publik (Simulator HUD) | Daftar whitelist perangkat |
| **Service Nilai** | `GET` | `/kelas` | Dosen | Mengambil kelas yang diampu |
| **Service Nilai** | `GET` | `/nilai` | Dosen / Mahasiswa | Nilai kelas berjalan |
| **Service Nilai** | `PUT` | `/nilai/:id` | Dosen (Jam Kerja) | Update nilai Tugas/UTS/UAS |
| **Service Nilai** | `POST` | `/kelas/:id/finalisasi` | Dosen (Jam Kerja) | Kunci nilai & pemicu sinkronisasi |
| **Service Nilai** | `POST` | `/kelas/:id/unfinalisasi` | Dosen (Jam Kerja) / Admin | Buka kunci nilai untuk revisi |
| **Service Transkrip** | `GET` | `/transkrip/:nim` | Mahasiswa (Milik sendiri) / Admin | Transkrip resmi perorangan |
| **Service Transkrip** | `GET` | `/transkrip/all` | Admin | Rekap seluruh 10 mahasiswa |
| **Service Transkrip** | `POST` | `/transkrip/sinkron` | Service Token (`role: service`) | Menerima sinkronisasi nilai resmi |
