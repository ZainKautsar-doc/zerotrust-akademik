# Sistem Nilai Akademik - Zero Trust Security (NIST SP 800-207)

Aplikasi demonstrasi penerapan prinsip **Zero Trust Architecture (NIST SP 800-207)** pada Sistem Akademik Pengelolaan Nilai & Transkrip Mahasiswa. Dilengkapi dengan **API Gateway (PEP & PE/PA)**, backend microservices, database bersama menggunakan **Supabase (PostgreSQL)**, dan frontend interaktif **React (Vite + Tailwind CSS)** dengan simulasi pengujian konteks perangkat dan jam akses secara langsung.

---

## 1. Arsitektur Sistem

```text
                  ┌───────────────────────────────┐
                  │       Frontend (React)        │
                  │         (Port 5173)           │
                  └───────────────┬───────────────┘
                                  │
                                  │ HTTP (Authorization: Bearer <token>, X-Device-ID)
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│ API Gateway (Port 3000)                                                │
│ ├── Policy Enforcement Point (PEP)                                     │
│ ├── Policy Engine & Policy Administrator (PE/PA)                       │
│ ├── Auth Controller (/auth/login, /auth/refresh, /auth/service)        │
│ └── Live Audit Logger (Persistensi ke tabel audit_logs)                │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   │ (X-Gateway-Secret, Token)       │ (X-Gateway-Secret, Service Token)
                   ▼                                 ▼
┌───────────────────────────────────┐    ┌──────────────────────────────────┐
│ Service Nilai (Port 3001)         │    │ Service Transkrip (Port 3002)    │
│ • Validasi Gateway Secret & JWT   │    │ • Validasi Gateway Secret & JWT  │
│ • Kelola Kelas & Nilai Mahasiswa  │    │ • Sinkronisasi Transkrip Resmi   │
│ • Panggil Gateway saat Finalisasi │    │   (Khusus role: 'service')       │
└─────────────────┬─────────────────┘    └─────────────────┬────────────────┘
                  │                                        │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │      Supabase PostgreSQL      │
                      │       (Shared Database)       │
                      └───────────────────────────────┘
```

---

## 2. Fitur Zero Trust yang Diimplementasikan

1. **Never Trust, Always Verify & Defense-in-Depth:**
   - Semua request wajib masuk melalui API Gateway (Port 3000).
   - Akses langsung ke backend service (Port 3001 & 3002) diblokir (`403 Forbidden`) menggunakan validasi header rahasia `X-Gateway-Secret`.
   - Backend service tetap memverifikasi ulang keaslian tanda tangan dan masa berlaku JWT.
2. **Context Verification (Perangkat Terdaftar):**
   - Setiap request user wajib membawa header `X-Device-ID`.
   - Jika device ID tidak cocok dengan perangkat yang terdaftar untuk akun tersebut di database, Gateway menolak request (`403 Forbidden`).
3. **Context Verification (Jam Operasional):**
   - Perubahan nilai (`PUT /nilai/:id`) dan finalisasi kelas (`POST /kelas/:id/finalisasi`) hanya diizinkan pada jam **07.00 – 21.00**.
   - Dilengkapi *Time Simulator* pada header aplikasi agar pengujian di luar jam kerja dapat didemokan kapan saja.
4. **Least Privilege & Data Isolation:**
   - Mahasiswa hanya dapat melihat nilai dan transkrip miliknya sendiri (melihat NIM lain ditolak `403 Forbidden`).
   - Dosen hanya dapat menginput/mengubah nilai pada kelas yang diampunya.
   - Endpoint sinkronisasi transkrip (`POST /transkrip/sinkron`) **hanya menerima token service**. Token user mana pun ditolak.
5. **Token Lifecycle & Revocation:**
   - Access Token: JWT masa berlaku 10 menit.
   - Refresh Token: JWT masa berlaku 1 hari, tersimpan di database dan dapat dicabut secara instan saat logout.
   - Service Token: JWT masa berlaku 5 menit (`role: 'service'`) diperoleh Service Nilai via `POST /auth/service` menggunakan client credentials.
6. **Live Audit Logging:**
   - Setiap keputusan (`ALLOW` atau `DENY`) dicatat ke tabel `audit_logs` di database Supabase lengkap dengan waktu, subjek, endpoint, device ID, dan alasan penolakan.

---

## 3. Daftar Akun Uji Coba & Device ID

Semua akun memiliki password default: **`password123`**

| Role | Username | Nama Lengkap | NIM / NIP | Device ID Terdaftar | Keterangan Akses |
|---|---|---|---|---|---|
| **Admin** | `admin_utama` | Administrator Akademik | `ADM001` | `DEV-ADMIN-01` | Dapat melihat transkrip seluruh NIM mahasiswa & audit log |
| **Dosen** | `dosen_budi` | Dr. Budi Santoso, M.T. | `198001012005011001` | `DEV-DOSEN-BUDI` | Mengampu kelas: *Keamanan Informasi (KP70065004)* |
| **Dosen** | `dosen_ani` | Ani Rahmawati, M.Kom. | `198502022008042002` | `DEV-DOSEN-ANI` | Mengampu kelas: *Jaringan Komputer Lanjut (IF40023002)* |
| **Mahasiswa** | `mhs_andi` | Andi Pratama | `2207001` | `DEV-MHS-ANDI` | Terdaftar di Kelas Keamanan Informasi & Jaringan Komputer |
| **Mahasiswa** | `mhs_bima` | Bima Satria | `2207002` | `DEV-MHS-BIMA` | Terdaftar di Kelas Keamanan Informasi & Jaringan Komputer |
| **Mahasiswa** | `mhs_citra` | Citra Lestari | `2207003` | `DEV-MHS-CITRA` | Terdaftar di Kelas Keamanan Informasi |

*Catatan: Pada UI Simulator, tersedia juga opsi **`DEV-HACKER-UNREGISTERED`** untuk menguji penolakan otomatis oleh Gateway.*

---

## 4. Cara Menjalankan Aplikasi

### Prasyarat
- **Node.js** (v18 ke atas)

### Langkah 1: Jalankan Backend Services
Buka terminal baru di folder `backend/`:
```bash
cd backend
npm install
node startAll.js
```
*Script `startAll.js` akan menjalankan 3 service sekaligus:*
- API Gateway pada `http://127.0.0.1:3000`
- Service Nilai pada `http://127.0.0.1:3001`
- Service Transkrip pada `http://127.0.0.1:3002`

### Langkah 2: Jalankan Frontend React
Buka terminal baru di folder `frontend/`:
```bash
cd frontend
npm install
npm run dev
```
Buka browser pada alamat yang muncul (biasanya `http://localhost:5173`).

---

## 5. Panduan Skenario Rekaman Video Demo (6 - 9 Menit)

Berikut urutan alur demo yang disarankan untuk memenuhi seluruh rubrik penilaian:

### Menit 1 - 2: Penjelasan Arsitektur & Prinsip Zero Trust
- Tunjukkan diagram arsitektur di README: jelaskan peran API Gateway sebagai **PEP & PE/PA (NIST SP 800-207)** serta pemisahan Service Nilai dan Service Transkrip.
- Tunjukkan tabel database di dashboard Supabase (`users`, `devices`, `grades`, `transcripts`, `audit_logs`).

### Menit 2 - 4: Demonstrasi Autentikasi & Verifikasi Konteks Perangkat
1. **Login Berhasil:** Pilih akun `dosen_budi`, pastikan Device Selector di atas memilih `DEV-DOSEN-BUDI`. Klik Login $\rightarrow$ Berhasil masuk.
2. **Uji Kasus Negatif (Device Tidak Terdaftar):** 
   - Logout. Pilih user `dosen_budi`, lalu ganti Device Selector menjadi `DEV-HACKER-UNREGISTERED`. Klik Login.
   - Perlihatkan pesan error: *"Perangkat tidak terdaftar untuk akun ini"*.
   - Tunjukkan tabel **Live Audit Log** di bawah yang langsung mencatat status `DENY` dengan alasan *"Device ID is not registered"*.

### Menit 4 - 6: Demonstrasi Jam Akses & Mutasi Nilai
1. Login kembali sebagai `dosen_budi` dengan device yang benar (`DEV-DOSEN-BUDI`).
2. **Uji Kasus Negatif (Di Luar Jam Kerja):**
   - Pada toolbar atas, ubah Jam Akses menjadi **23:00 (Luar Jam Kerja)**.
   - Klik tombol **Edit** pada salah satu mahasiswa dan coba simpan nilai baru.
   - Tunjukkan bahwa request ditolak dengan pesan: *"Zero Trust Deny: Perubahan nilai hanya diizinkan pukul 07:00 - 21:00"*.
3. **Uji Kasus Positif (Dalam Jam Kerja):**
   - Ubah kembali jam akses ke **10:00 (Jam Kerja)**.
   - Simpan nilai $\rightarrow$ Berhasil diperbarui.
4. **Finalisasi Kelas & Panggilan Antar-Service:**
   - Klik tombol **Finalisasi & Sinkron**.
   - Jelaskan kode di balik tombol ini: Service Nilai meminta Service Token ke Gateway (`POST /auth/service`), lalu mengirim request ke `POST /transkrip/sinkron` melalui Gateway. Nilai kelas kini terkunci.

### Menit 6 - 8: Demonstrasi Least Privilege (Mahasiswa & Admin)
1. Logout dan login sebagai `mhs_andi` (Device: `DEV-MHS-ANDI`).
   - Tunjukkan bahwa mahasiswa dapat melihat nilai dan transkrip resmi miliknya sendiri.
   - Buka DevTools/Console atau jelaskan bahwa mahasiswa tidak bisa mengakses transkrip mahasiswa lain (`2207002`).
2. Logout dan login sebagai `admin_utama` (Device: `DEV-ADMIN-01`).
   - Tunjukkan fitur pencarian transkrip berdasarkan NIM mahasiswa manapun (`2207001`, `2207002`, `2207003`).

### Menit 8 - 9: Demonstrasi Defense-in-Depth & Kesimpulan
1. **Direct Access Bypass Prevention:**
   - Tunjukkan pengujian via curl/terminal: mencoba memanggil `http://127.0.0.1:3001/nilai` secara langsung tanpa melalui gateway $\rightarrow$ ditolak karena tidak ada header `X-Gateway-Secret`.
2. Tunjukkan **Live Audit Log** lengkap di portal Admin yang mencatat seluruh histori pengujian tadi.
