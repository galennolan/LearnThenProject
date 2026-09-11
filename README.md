# OutputLab

> **Ubah materi belajar menjadi output nyata.** Personal *learning-to-output system* — dari catatan pemahaman, refleksi, project, sampai portofolio.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06b6d4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-f6821f?logo=cloudflare&logoColor=white)

---

## Daftar Isi

- [Alur Produk](#alur-produk)
- [Arsitektur & Struktur Folder](#arsitektur--struktur-folder)
- [Database & Keamanan](#database--keamanan)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Fitur](#fitur)
- [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
- [Deploy ke Cloudflare](#deploy-ke-cloudflare)
- [Checklist Pengujian Manual](#checklist-pengujian-manual)
- [Batasan MVP](#batasan-mvp)

---

## Alur Produk

```
Lagi belajar apa? ──▶ Progress ──▶ Catatan ──▶ Komplet? ──▶ Produksi konten
  (dasbor            (materi →      (pemahaman,    (tandai         (berita, Instagram,
   fokus)             catatan →      kritis,        dipelajari)     YouTube, Blog, dll)
                      komplet →      ide)
                      konten)
```

Belajar yang komplet langsung jadi konten yang bisa ditunjukkan. Tanpa AI, tanpa tombol pajangan — semua workflow CRUD biasa yang benar-benar berfungsi.

---

## Arsitektur & Struktur Folder

| Lapisan | Teknologi |
|---|---|
| Frontend | React 18 + TypeScript + Vite 6 |
| Styling | Tailwind CSS 3 (mobile-first) |
| Auth & Database | Supabase (Postgres + Auth + RLS) |
| Hosting | Cloudflare Workers — Static Assets + SPA fallback |
| Timezone tampilan | Asia/Jakarta (`id-ID`) |

```
.
├── index.html                  # entry HTML (lang="id")
├── .env.example                # contoh env → salin menjadi .env
├── wrangler.jsonc              # config deploy: assets ./dist + SPA fallback
├── .nvmrc                      # kunci Node 20 untuk mesin build
├── supabase/migrations/
│   └── 0001_outputlab.sql      # tabel + trigger + index + RLS
└── src/
    ├── main.tsx / App.tsx      # entry + routing + protected routes
    ├── index.css               # Tailwind
    ├── lib/                    # supabaseClient, time (Asia/Jakarta, validasi URL)
    ├── types/                  # model + label berbahasa Indonesia
    ├── context/AuthContext.tsx # sesi Supabase Auth
    ├── hooks/useToast.tsx      # notifikasi toast global
    ├── components/             # Layout, ProtectedRoute, ui (reusable)
    ├── services/               # learning (materi, catatan, progres, konten), projects (mesin konten)
    └── pages/                  # Auth, Belajar (beranda), Learning (form+detail), Hasil
```

> Konvensi kode: komponen UI kecil dan reusable, logika query terisolasi di `services/`, tidak ada satu file yang menggembung, tidak ada tombol yang belum berfungsi.

---

## Database & Keamanan

Enam tabel, semua dengan `user_id`, UUID, dan `created_at`/`updated_at`:

| Tabel | Peran |
|---|---|
| `learning_items` | materi belajar + status (`new`/`learning`/`learned`) |
| `learning_notes` | refleksi (pemahaman ≥ 100 karakter, enforced di DB via `CHECK`) |
| `projects` | project manual / dari materi / lanjutan (`is_featured` untuk portofolio) |
| `project_tasks` | checklist (`todo`/`doing`/`done` + `position`) |
| `outputs` | link hasil karya (maks. **satu** primary per project via unique index parsial) |
| `project_reviews` | review (satu per project via `UNIQUE(project_id)`) |

**Row Level Security aktif di semua tabel.** Setiap policy mengikat `auth.uid() = user_id`, dan untuk `project_tasks`, `outputs`, `project_reviews` ditambah pengecekan bahwa `project` induk juga milik user yang sama — sehingga relasi `project_id` tidak bisa dipakai mengintip data orang lain.

Cara menerapkan: **Supabase Dashboard → SQL Editor → New query** → paste seluruh isi `supabase/migrations/0001_outputlab.sql` → **Run**. Pastikan juga provider **Email** aktif di **Authentication**.

---

## Konfigurasi Environment

```bash
cp .env.example .env
```

| Variabel | Contoh | Keterangan |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xyzcompany.supabase.co` | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | **anon public key** — bukan `service_role` |

> `service_role` key tidak pernah dipakai di project ini. Nilai `VITE_*` ikut terkirim ke browser, jadi perlakukan anon key sebagaimana mestinya.

---

## Fitur

- **Auth** — daftar, masuk, keluar; semua halaman terproteksi.
- **Belajar** (`/`) — daftar "lagi belajar apa": tiap kartu menampilkan progres + langkah berikutnya. Satu tombol **+ Baru**.
- **Detail belajar** (`/materi/:id`) — info materi, progres 4 langkah, **satu kolom catatan** (min. 100 karakter), tombol **Tandai belajar selesai**, dan daftar **Hasil** + form tambah (platform, judul, link).
- **Hasil** (`/hasil`) — semua konten yang pernah dibuat, lengkap dengan platform, materi sumber, dan link.
- **UX** — toast setiap simpan, konfirmasi setiap hapus, state loading/empty/error, mobile-first, berbahasa Indonesia.

---

## Menjalankan Secara Lokal

Butuh Node 20+ (disarankan 20.19+ atau 22 LTS).

```bash
npm install
cp .env.example .env   # lalu isi nilainya
npm run dev            # http://localhost:5173
```

```bash
npm run build          # verifikasi: tsc + vite build
npm run preview        # pratinjau hasil build
```

> Proses `npm run dev` harus dijalankan dari terminal sendiri dan dibiarkan menyala — ia mati jika terminal ditutup.

---

## Deploy ke Cloudflare

Project ter-deploy sebagai **Worker dengan Static Assets** (SPA fallback via `not_found_handling: single-page-application` di `wrangler.jsonc` — pengganti `_redirects` yang ditolak validator Workers).

**Via dashboard (disarankan):**

1. Push repo ke GitHub.
2. Cloudflare Dashboard → **Workers & Pages → Create** → hubungkan repo `LearnThenProject`.
3. Isi kolom dengan **perintahnya**, bukan nama kolomnya:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Root directory: kosongkan.
4. Tambahkan environment variables `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` untuk **Production dan Preview** → Save → Deploy.
5. Setiap push ke `main` memicu build baru otomatis.

**Via CLI:**

```bash
npm run build
npx wrangler deploy
```

---

## Checklist Pengujian Manual

<details>
<summary><strong>Auth & keamanan</strong></summary>

- [ ] Daftar → masuk → keluar berhasil.
- [ ] Akses `/` tanpa login dialihkan ke `/masuk`.
- [ ] Dua akun berbeda tidak bisa saling melihat/mengubah data.

</details>

<details>
<summary><strong>Dasbor</strong></summary>

- [ ] Angka materi / project aktif / selesai / output benar.
- [ ] Task tertunda tampil dan mengarah ke project yang benar.
- [ ] Materi tanpa refleksi tampil, lalu hilang setelah refleksi disimpan.

</details>

<details>
<summary><strong>Materi</strong></summary>

- [ ] Tambah (judul wajib, URL salah ditolak), ubah, hapus (konfirmasi + toast).
- [ ] Detail menampilkan judul, URL, jenis, deskripsi, tujuan belajar.
- [ ] Refleksi di bawah 100 karakter ditolak dengan pesan jumlah karakter.
- [ ] *Tandai sudah dipelajari* mengubah status; *buat project dari materi* membuat project tertaut.

</details>

<details>
<summary><strong>Project</strong></summary>

- [ ] Buat manual + dari materi; ubah; hapus (konfirmasi).
- [ ] Task: tambah → progress % berubah; badge Todo → Doing → Done; hapus.
- [ ] Output: URL invalid ditolak; link terbuka di tab baru; output utama kedua otomatis menggantikan yang lama.
- [ ] Review tersimpan → tandai selesai → project lanjutan terisi parent → kembali ke materi.

</details>

<details>
<summary><strong>Portofolio & umum</strong></summary>

- [ ] Project featured muncul di `/portofolio` lengkap (judul, deskripsi, sumber, insight, output).
- [ ] Tampilan 360px tanpa overflow horizontal; tiap simpan ada toast; tiap hapus ada konfirmasi.
- [ ] `npm run build` lolos; tidak ada `service_role` di bundle.

</details>

---

## Batasan MVP

AI, reminder, dan integrasi platform (termasuk verifikasi konten otomatis) **tidak dikerjakan** sebelum checklist di atas lolos. Aplikasi menyimpan URL apa adanya — tanpa klaim verifikasi atau publikasi.
