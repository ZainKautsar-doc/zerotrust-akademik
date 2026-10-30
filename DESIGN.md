# SIAKAD ZERO TRUST — UI Design System & Implementation Reference
> Frosted glass cathedral at midnight (AuthKit Style Adaptation)

**Theme:** dark (`#05060f` Midnight Canvas)  
**Target Application:** Sistem Informasi Akademik Berbasis Zero Trust Architecture (NIST SP 800-207)  
**Refactoring Note:** Mengganti popup/modal "Tentang Sistem" menjadi halaman navigasi mandiri (`AboutPage`), mengadopsi palet near-black midnight, frosted-glass translucent surface, hairline blue-white borders, dan aksen tunggal Void Violet (`#663af3`).

---

## 1. Design Tokens — Colors

| Name | Hex / Value | Token | Role di SIAKAD Zero Trust |
|------|-------------|-------|---------------------------|
| Midnight Canvas | `#05060f` | `--color-midnight-canvas` | Background utama seluruh halaman, base container canvas |
| Deep Glass | `#05060ff7` | `--color-deep-glass` | Surface form login, card status perangkat, audit log panel |
| Frosted Glass | `rgba(186, 214, 247, 0.03)` | `--color-frosted-glass` | Kartu daftar kelas, transkrip nilai, tabel data mahasiswa |
| Steel Plate | `#2f343e` | `--color-steel-plate` | Ghost button background, pill badge secondary, container icon |
| Glass Edge | `rgba(186, 215, 247, 0.12)` | `--color-glass-edge` | Hairline border inset pada semua kartu, tabel, dan input |
| Void Violet | `#663af3` | `--color-void-violet` | CTA Utama: Tombol Login, tombol Finalisasi Nilai, dan aksi kritis PEP |
| Ice Highlight | `#d8ecf8` | `--color-ice-highlight` | Display header, wordmark "SIAKAD ZERO TRUST", judul section |
| Frost Glow | `#d1e4fa` | `--color-frost-glow` | Teks body utama, label status Policy Engine, icon glyphs |
| Moon Mist | `#c7d3ea` | `--color-moon-mist` | Helper text, breadcrumb, subtitle arsitektur, parameter token |
| Fog Veil | `#9da7ba` | `--color-fog-veil` | Timestamps audit log, footnote NIST SP 800-207, placeholder input |
| Emerald Glow | `#10b981` | `--color-emerald-glow` | Status PEP "ALLOW", Device Verified, Active Session |
| Crimson Alert | `#ef4444` | `--color-crimson-alert` | Status PEP "DENY", Device Untrusted, Security Alert |
| Amber Warning | `#f59e0b` | `--color-amber-warning` | Status Finalized / Locked, jam operasional di luar batas |

---

## 2. Typography & Hierarchy

### Font Families
- **Display Headings (`--font-display`):** `aeonikPro`, `Space Grotesk`, ui-sans-serif, sans-serif
- **Interface & Body (`--font-sans`):** `Untitled Sans`, `Inter`, ui-sans-serif, system-ui, sans-serif
- **Eyebrows & Security Badges (`--font-mono`):** `dotDigital`, `JetBrains Mono`, monospace (letter-spacing `0.10em`, uppercase)

### Scale
- **Display (Hero / Wordmark):** 44-48px (Weight 500, Skywash Gradient: `linear-gradient(0deg, #d8ecf8 0%, #98c0ef 100%)`)
- **Section Heading:** 24-28px (Weight 500, `#d8ecf8`)
- **Card Title / Subheading:** 18px (Weight 500, `#d1e4fa`)
- **Body:** 14-16px (Weight 400, `#c7d3ea`)
- **Eyebrow / Code:** 12-14px (Mono uppercase, tracked `0.1em`, `#c7d3ea`)
- **Footnote / Meta:** 12px (Weight 400, `#9da7ba`)

---

## 3. Geometry & Spacing Rules

- **Base Spacing Unit:** 4px (padding konsisten: 8px, 12px, 16px, 24px, 32px, 48px).
- **Cards & Panels:** Border radius `16px`, padding `24px`, background `rgba(186, 214, 247, 0.03)`, inset hairline `1px solid rgba(186, 215, 247, 0.12)`.
- **Buttons:** Border radius `999px` (Pill format).
- **Inputs & Badges:** Border radius `6px`.
- **Icon Containers:** Border radius `9999px` (lingkaran sempurna) dengan line-art glyph 1.5px mono stroke.
- **Elevation Shadow Inset:**
  ```css
  box-shadow: inset 0 1px 1px rgba(216, 236, 248, 0.2),
              inset 0 24px 48px rgba(168, 216, 245, 0.06),
              0 16px 32px rgba(0, 0, 0, 0.4);
  ```

---

## 4. Penyesuaian Komponen SIAKAD Zero Trust

### A. Navigation & Header
- **Wordmark:** `SIAKAD ZERO TRUST` dengan gradient Skywash dan tag versi NIST SP 800-207.
- **Link Navigasi Halaman Tentang Sistem:** Tombol pill ghost (`rounded-full`, hairline border) yang mengalihkan rute view ke halaman penuh `/about` (bukan membuka modal/dialog).
- **Session Identity Capsule:** Pil status identitas pengguna (`FullName`, Role Pill, dan active `Device-ID`) dengan tombol Logout bernuansa ghost crimson.

### B. Halaman Baru: "Tentang Sistem" (`AboutPage`)
- **Tampilan:** Full-page view (`max-w-6xl mx-auto py-12 px-6`).
- **Header:** Eyebrow label bergaris flanking (`NIST SP 800-207 REFERENCE ARCHITECTURE`), judul display besar bergradasi, tombol navigasi "← Kembali ke Dashboard / Login".
- **Grid Arsitektur Tiga Pilar:**
  1. *Never Trust, Always Verify:* Penjelasan inspeksi kontekstual (JWT + `X-Device-ID` + Jam Kerja Operasional).
  2. *Least Privilege (RBAC):* Penjelasan pembatasan peran Dosen (hanya mata kuliah binaan), Mahasiswa (hanya transkrip pribadi), dan Admin (manajemen device & audit).
  3. *Assume Breach & Micro-segmentation:* Pemisahan Express Gateway (PEP) dengan Service Nilai & Service Transkrip internal via token service gateway.
- **Alur Data & Diagram Interaktif:** Ilustrasi alur request mahasiswa/dosen melewati Policy Engine & Audit Logger.
- **Spesifikasi Teknis:** Ringkasan endpoint, port service (3000 Gateway, 3001 Nilai, 3002 Transkrip), dan skema autentikasi Supabase.

### C. Halaman Login (`LoginPage`)
- **Visual Center:** Card kaca bertingkat (elevation level 3) melayang di tengah midnight canvas dengan blueprint grid lines (interval 80px) dan conic glow halo di atasnya.
- **CTA Submit:** Tombol `#663af3` (Void Violet) tunggal dengan label "Autentikasi & Verifikasi Perangkat".
- **Selector Perangkat Aktif (`X-Device-ID`):** Pill radio list yang menampilkan status perangkat terdaftar (Trusted / Untrusted) untuk demo skenario akses Zero Trust.
- **Quick Test Accounts:** Chip pill selector untuk berpindah peran cepat (`dosen_budi`, `mhs_andi`, `admin_siti`).
- **Link ke Halaman Tentang Sistem:** Tautan pill sekunder di bawah banner pengantar.

### D. Zero Trust Status Bar
- Tampil di puncak layar sebagai ambient status HUD:
  - Indikator Policy Decision Point (PDP) / Policy Enforcement Point (PEP).
  - Jam Operasional Sistem (07:00 - 21:00 WIB) dengan indikator status aktif/nonaktif real-time.
  - Perangkat aktif terpasang (`X-Device-ID`).

### E. Dashboard Dosen, Mahasiswa, dan Admin
- **Dosen Dashboard:** Kartu kelas berbasis frosted glass plate, badge status finalisasi kelas, form input nilai dengan validasi kontekstual, dan tombol CTA submit beraksen violet.
- **Mahasiswa Dashboard:** Kartu transkrip akademik bersih dengan IPK display, perolehan SKS, serta daftar nilai matakuliah terverifikasi tanda tangan digital gateway.
- **Admin Dashboard:** Manajemen pendaftaran Device ID (Whitelist/Revoke) dan Audit Log Inspector dengan filter keputusan PEP (`ALLOW` / `DENY`).

---

## 5. Tailwind CSS Configuration & Tokens Snippet

Tambahkan konfigurasi berikut pada file styling project (`src/index.css` / `tailwind.config.js`):

```css
:root {
  /* AuthKit Midnight Palette */
  --color-midnight-canvas: #05060f;
  --color-steel-plate: #2f343e;
  --color-fog-veil: #9da7ba;
  --color-moon-mist: #c7d3ea;
  --color-frost-glow: #d1e4fa;
  --color-ice-highlight: #d8ecf8;
  --color-pure-white: #ffffff;
  --color-void-violet: #663af3;
  --color-glass-edge: rgba(186, 215, 247, 0.12);
  --color-frosted-glass: rgba(186, 214, 247, 0.03);
  --color-deep-glass: rgba(5, 6, 15, 0.97);

  /* Fonts */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-display: 'Space Grotesk', 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

/* Blueprint Grid Layer */
.bg-blueprint-grid {
  background-color: #05060f;
  background-image: 
    linear-gradient(rgba(186, 215, 247, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(186, 215, 247, 0.04) 1px, transparent 1px);
  background-size: 80px 80px;
}

/* Frosted Glass Shadow Stack */
.glass-panel {
  background: rgba(186, 214, 247, 0.03);
  border: 1px solid rgba(186, 215, 247, 0.12);
  border-radius: 16px;
  box-shadow: 
    inset 0 1px 1px rgba(216, 236, 248, 0.15),
    inset 0 24px 48px rgba(168, 216, 245, 0.04),
    0 16px 32px rgba(0, 0, 0, 0.35);
}

/* Hero Spotlight Conic Halo */
.hero-spotlight {
  background: conic-gradient(
    from 180deg at 50% -10%,
    transparent 45%,
    rgba(124, 145, 182, 0.25) 49%,
    rgba(124, 145, 182, 0.45) 50%,
    rgba(124, 145, 182, 0.25) 51%,
    transparent 55%
  );
}

/* Violet Primary CTA */
.btn-primary-violet {
  background-color: #663af3;
  color: #ffffff;
  border-radius: 999px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 0 20px rgba(102, 58, 243, 0.35);
}
.btn-primary-violet:hover {
  background-color: #5527e0;
  box-shadow: 0 0 28px rgba(102, 58, 243, 0.55);
}

/* Ghost Pill Action */
.btn-ghost-pill {
  background: rgba(186, 214, 247, 0.06);
  border: 1px solid rgba(186, 215, 247, 0.12);
  color: #d1e4fa;
  border-radius: 999px;
  transition: all 0.2s ease;
}
.btn-ghost-pill:hover {
  background: rgba(186, 214, 247, 0.12);
  color: #ffffff;
}
```

---

## 6. Prompt Siap Pakai untuk Refactoring Frontend

Gunakan prompt di bawah ini untuk menginstruksikan pembuatan atau refactoring kode frontend:

```markdown
Refactor frontend SIAKAD ZERO TRUST agar sesuai dengan AuthKit Style Reference (Theme: Dark Midnight Canvas):

1. **Halaman Tentang Sistem:**
   - Hapus komponen dialog modal (`AboutModal.jsx`).
   - Buat file halaman mandiri `src/pages/AboutPage.jsx`.
   - Di `App.jsx`, atur state routing (`currentPage: 'app' | 'about'`). Ketika tombol "Tentang Sistem" ditekan dari header atau halaman login, render `AboutPage` satu layar penuh dengan tombol "← Kembali".
   - Muat seluruh konten arsitektur Zero Trust NIST SP 800-207, pembagian hak akses role, isolasi microservices, dan jam operasional ke dalam layout kartu kaca (`glass-panel`).

2. **Styling & Palet Warna AuthKit:**
   - Gunakan warna latar `#05060f` dengan motif blueprint grid (`bg-blueprint-grid`).
   - Ganti semua border abu-abu menjadi hairline frosted border `rgba(186, 215, 247, 0.12)`.
   - Gunakan tombol pill `rounded-full` untuk semua tombol navigasi, filter, dan chip aksi.
   - Gunakan Void Violet `#663af3` secara eksklusif untuk tombol Submit/Login dan tombol aksi finalisasi data nilai.
   - Judul dan headline besar menggunakan gradien vertikal Skywash (`#d8ecf8` ke `#98c0ef`).
   - Terapkan section eyebrow berhuruf kapital monospaced dengan flanking lines memudar di awal setiap section.
```
