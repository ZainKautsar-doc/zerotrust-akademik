# Ringkasan Tugas Praktikum: Zero Trust Security

**Mata Kuliah:** Keamanan Informasi (KP70065004)  
**Program Studi:** Informatika, Universitas Siliwangi  
**Tipe:** Tugas Praktikum Individu

---

## 1. Tujuan Praktikum
1. Menerapkan prinsip dasar arsitektur **Zero Trust**:
   - **Never trust, always verify:** Setiap request diverifikasi identitas, token, dan konteksnya (device & jam akses).
   - **Least privilege:** Subjek hanya diberi hak akses minimum sesuai perannya.
   - **Assume breach:** Akses langsung ke service internal diblokir; komunikasi antar-service tetap diverifikasi identitasnya.
2. Membangun **API Gateway** yang berfungsi sebagai **Policy Enforcement Point (PEP)** dan **Policy Engine / Policy Administrator (PE/PA)** sesuai standar **NIST SP 800-207**.

---

## 2. Skenario & Role Sistem

Aplikasi yang dibangun adalah **Sistem Nilai Akademik** untuk Program Studi Informatika:
- Dosen menginput, mengubah, dan memfinalisasi nilai kelas yang diampunya.
- Setelah finalisasi kelas, nilai dikirim ke **Service Transkrip** agar masuk ke transkrip mahasiswa.
- Seluruh akses (baik dari user maupun panggilan antar-service) wajib melalui API Gateway.

### Tabel Role & Hak Akses
| Role | Hak Akses |
|---|---|
| **Mahasiswa** | Melihat nilai dan transkrip miliknya sendiri |
| **Dosen** | Melihat, mengubah, dan memfinalisasi nilai pada kelas yang diampunya |
| **Admin** | Melihat transkrip seluruh mahasiswa |

---

## 3. Arsitektur Sistem (NIST SP 800-207)

```
[ User (Browser/Client) ]
           │
           │ (Authorization: Bearer <token>, X-Device-ID)
           ▼
┌────────────────────────────────────────────────────────┐
│ API Gateway (Port 3000)                                │
│ ├── PEP (Policy Enforcement Point)                     │
│ ├── PE / PA (Policy Engine & Policy Administrator)     │
│ └── Audit Logger                                       │
└────────┬──────────────────────────────────────┬────────┘
         │                                      │
         │ (X-Gateway-Secret, JWT)              │ (X-Gateway-Secret, Service Token)
         ▼                                      ▼
┌─────────────────────────┐            ┌─────────────────────────┐
│ Service Nilai (Port 3001)│            │ Service Transkrip (3002)│
└────────┬────────────────┘            └────────┬────────────────┘
         │                                      │
         │ Panggilan antar-service via Gateway   │
         │ (POST /auth/service -> /transkrip/..) │
         └───────────────────┬──────────────────┘
                             │
                             ▼
               ┌───────────────────────────┐
               │ Shared Database           │
               └───────────────────────────┘
```

### Komponen Sistem
| Komponen | Peran NIST | Port | Tanggung Jawab |
|---|---|---|---|
| **API Gateway** | PEP & PE/PA | 3000 | Pintu masuk tunggal. Menangani login, issue/revoke token, evaluasi allow/deny berbasis policy & database, mencatat audit log, menempelkan `X-Gateway-Secret`, dan meneruskan request. |
| **Service Nilai** | Resource | 3001 | Mengelola data nilai dan kelas. Wajib validasi `X-Gateway-Secret` dan verifikasi tanda tangan token. Saat finalisasi, meminta token service dan memanggil Service Transkrip lewat gateway. |
| **Service Transkrip** | Resource | 3002 | Mengelola data transkrip mahasiswa. Wajib validasi `X-Gateway-Secret` dan token. Endpoint `/transkrip/sinkron` **hanya** menerima token dengan role `service`. |
| **Database** | Resource | - | Database bersama untuk menyimpan data user, device, kelas, nilai, transkrip, refresh token, dan audit log. |
| **Audit Log** | Data Source | - | Mencatat histori setiap keputusan akses dari gateway. |

---

## 4. Kebutuhan Sistem & Spesifikasi Teknis

### 4.1 Autentikasi dan Token
- **Access Token:** JWT masa berlaku 10 menit (`expiresIn: '10m'`), minimal berisi klaim `sub` (User ID / username) dan `role`. Dikirim via header `Authorization: Bearer <token>`.
- **Refresh Token:** Masa berlaku 1 hari (`expiresIn: '1d'`), disimpan di database sehingga dapat dicabut (*revocation*). Endpoint logout mencabut refresh token ini.
- **Token Service:** Khusus untuk panggilan antar-service (Service Nilai ke Service Transkrip). Diperoleh via `POST /auth/service` menggunakan `client_id` dan `client_secret`. Masa berlaku 5 menit (`expiresIn: '5m'`), berisi klaim `role: 'service'`.
- **Gateway Secret:** Gateway menyisipkan header `X-Gateway-Secret` pada setiap request yang diteruskan ke backend. Backend service menolak request tanpa header ini (mencegah akses bypass langsung ke service).
- **Verifikasi Ulang di Service:** Backend service tidak hanya memeriksa `X-Gateway-Secret`, namun juga memverifikasi validitas tanda tangan dan masa berlaku JWT.

### 4.2 Kebijakan Akses (Policy Table)
| Endpoint | Ditangani Oleh | Diizinkan | Kondisi Akses |
|---|---|---|---|
| `POST /auth/login` | Gateway | Semua user | Kredensial valid dan `X-Device-ID` terdaftar untuk user tersebut |
| `POST /auth/refresh` | Gateway | Semua user | Refresh token valid dan belum dicabut di database |
| `POST /auth/logout` | Gateway | Semua user | Mencabut refresh token di database |
| `POST /auth/service` | Gateway | Service Nilai | Client ID dan Client Secret valid |
| `GET /nilai` | Service Nilai | Mahasiswa, Dosen | **Mahasiswa:** hanya nilai miliknya sendiri.<br>**Dosen:** hanya kelas yang diampunya. |
| `PUT /nilai/:id` | Service Nilai | Dosen | Kelas yang diampu, status nilai belum final, dan berada dalam rentang jam akses. |
| `POST /kelas/:id/finalisasi` | Service Nilai | Dosen | Kelas yang diampu, berada dalam jam akses. Memicu Service Nilai memanggil `/transkrip/sinkron` via gateway. |
| `GET /transkrip/:nim` | Service Transkrip | Mahasiswa, Admin | **Mahasiswa:** hanya NIM miliknya sendiri.<br>**Admin:** semua NIM mahasiswa. |
| `POST /transkrip/sinkron` | Service Transkrip | Service Nilai | **Hanya menerima token dengan role `service`**. Token user apa pun ditolak. |

### 4.3 Verifikasi Konteks
1. **Device Terdaftar:**
   - Setiap request dari user wajib menyertakan header `X-Device-ID`.
   - Jika device ID tidak cocok dengan data device yang terdaftar untuk user tersebut di database, request ditolak (`403 Forbidden`).
2. **Jam Akses:**
   - Perubahan nilai (`PUT /nilai/:id`) dan finalisasi nilai (`POST /kelas/:id/finalisasi`) hanya diizinkan pada rentang jam **07.00 – 21.00**.
   - Jam akses wajib dibuat dinamis / dapat diatur melalui file konfigurasi (konfigurasi `.env`) agar mudah didemokan di luar jam tersebut.

### 4.4 Audit Log
Gateway wajib mencatat seluruh keputusan evaluasi akses dengan rincian data:
- **Timestamp** (waktu kejadian)
- **Subjek** (User ID / Username / Service Name)
- **Endpoint** (Path dan HTTP Method)
- **Device ID**
- **Hasil** (`ALLOW` atau `DENY`)
- **Alasan** (contoh: *Device not registered*, *Outside business hours*, *Unauthorized role*, *Token expired*, dll.)

---

## 5. Data Awal (Seed Data Minimal)
Sistem wajib memiliki data dummy awal minimal sebagai berikut:
- **1 Akun Admin**
- **2 Akun Dosen**
- **3 Akun Mahasiswa**
- **2 Kelas Mata Kuliah** yang diampu oleh dosen berbeda
- **1 Device Terdaftar** untuk masing-masing user

---

## 6. Luaran yang Harus Dikumpulkan
1. **Repository Kode & README:**
   - Panduan cara menjalankan sistem (gateway, services, database).
   - Daftar akun uji coba (username, password, role) beserta nilai `X-Device-ID` terdaftarnya.
2. **Video Demo (Durasi 6 – 9 Menit):**
   - Menjelaskan dan mendemokan implementasi poin 4.1 s.d. 4.4.
   - Memperlihatkan potongan kode sumber yang menangani masing-masing mekanisme Zero Trust.
