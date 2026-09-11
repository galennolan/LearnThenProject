# OutputLab — Personal Learning-to-Output System

Aplikasi web (React + TypeScript + Vite + Tailwind + Supabase, deploy Cloudflare Pages).
Bahasa antarmuka: Indonesia. Timezone tampilan: Asia/Jakarta. MVP tanpa AI.

## 1. Struktur folder

```
.
├── index.html
├── .env.example            # contoh env (salin jadi .env)
├── public/
│   └── _redirects          # SPA fallback untuk Cloudflare Pages (/* /index.html 200)
├── supabase/
│   └── migrations/
│       └── 0001_outputlab.sql   # tabel + trigger + index + RLS
└── src/
    ├── main.tsx            # entry
    ├── App.tsx             # routing + protected routes
    ├── index.css           # tailwind
    ├── lib/
    │   ├── supabaseClient.ts
    │   └── time.ts         # format Asia/Jakarta, validasi URL
    ├── types/index.ts
    ├── context/AuthContext.tsx
    ├── hooks/useToast.tsx
    ├── components/
    │   ├── Layout.tsx
    │   ├── ProtectedRoute.tsx
    │   └── ui.tsx          # Button, Input, Card, Badge, Empty/Error/Loading, ConfirmDialog
    ├── services/
    │   ├── learning.ts     # CRUD learning_items + notes
    │   ├── projects.ts     # CRUD projects, tasks, outputs, review
    │   └── dashboard.ts    # agregasi dasbor
    └── pages/
        ├── Auth.tsx        # Login + Register
        ├── Dashboard.tsx
        ├── Learning.tsx    # list + form + detail/refleksi
        ├── Projects.tsx    # list + form + detail (task/output/review)
        └── Portfolio.tsx
```

## 2. SQL migration Supabase

File: `supabase/migrations/0001_outputlab.sql`

Cara pakai:
1. Buat project di https://supabase.com → dapatkan Project URL + anon key.
2. Buka **SQL Editor → New query**, paste seluruh isi file migration, **Run**.
3. Verifikasi di **Table Editor**: `learning_items`, `learning_notes`, `projects`,
   `project_tasks`, `outputs`, `project_reviews` muncul.
4. (Opsional) **Authentication → Providers → Email**: pastikan Email provider aktif.
   Matikan "Confirm email" selama pengujian lokal bila ingin login langsung.

RLS: aktif di semua tabel user-owned, policy `auth.uid() = user_id`.
Task/output/review juga dicek terhadap `projects` induk milik user yang sama,
sehingga relasi `project_id` tidak bisa dipakai mengintip data orang lain.
Satu primary output per project ditegakkan via unique index parsial
`outputs_one_primary_per_project WHERE is_primary = true`
+ logika frontend menonaktifkan primary lama.

## 3. Environment variables

```bash
cp .env.example .env
```

Isi `.env`:

```
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Aturan:
- Hanya `anon` key di frontend. **Jangan pernah** pakai `service_role` di kode ini.
- Di Cloudflare Pages, set variabel yang sama via **Pages → Settings → Environment variables**
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) untuk Production + Preview.

## 4–6. Halaman, CRUD, RLS

- Auth: `/masuk`, `/daftar`, logout di header, route lain terproteksi.
- Dasbor `/`: 4 kartu statistik, task tertunda, project aktif terbaru, materi tanpa refleksi.
- Materi `/materi`: CRUD + status; detail `/materi/:id` berisi info + form refleksi
  (pemahaman min. 100 karakter), tombol simpan refleksi / tandai dipelajari / buat project.
- Project `/project`: CRUD manual + filter status, bisa taut ke materi.
  Detail `/project/:id`: info + materi sumber + progress (done/total) + CRUD task
  (klik badge Todo→Doing→Done) + CRUD output (validasi URL, 1 primary, buka tab baru)
  + review (what_worked/failed/insight/next) + tandai selesai / project lanjutan / kembali ke materi.
- Portofolio `/portofolio`: project `is_featured=true` + sumber belajar + insight + jumlah output.
- Semua mutasi menampilkan toast; hapus selalu konfirmasi; ada loading/empty/error state;
  mobile-first; tidak ada tombol dekoratif.

## 7. Menjalankan secara lokal

Butuh Node 20+ (disarankan 20.19+ / 22 LTS).

```bash
npm install
cp .env.example .env   # lalu isi
npm run dev            # buka http://localhost:5173
npm run build          # cek build lolos (tsc + vite)
npm run preview        # pratinjau hasil build
```

Catatan: jika `npm run build` gagal karena versi Node lama, upgrade Node lalu ulangi.

## 8. Deploy ke Cloudflare Pages

Opsi A — via Dashboard (disarankan):
1. Push repo ini ke GitHub/GitLab.
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (atau subfolder bila monorepo)
4. Environment variables: tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
   (Production + Preview), lalu **Save → Deploy**.
5. File `public/_redirects` (`/* /index.html 200`) membuat refresh route SPA tidak 404.

Opsi B — via Wrangler CLI:

```bash
npx wrangler pages deploy dist --project-name outputlab
```

Tidak ada API server-side pada MVP ini (langsung Supabase client dari browser),
jadi tidak perlu Workers/Functions.

## 9. Checklist pengujian manual

Auth & keamanan:
- [ ] Daftar akun baru → bisa masuk → bisa keluar.
- [ ] Buka `/` tanpa login → dialihkan ke `/masuk`.
- [ ] User A tidak bisa melihat/mengubah data User B (uji 2 akun + 2 browser).

Dasbor:
- [ ] Angka materi / project aktif / selesai / output benar.
- [ ] Task tertunda muncul; klik menuju project yang benar.
- [ ] Materi tanpa refleksi muncul; hilang setelah refleksi disimpan.

Materi:
- [ ] Tambah (judul wajib; URL salah ditolak), ubah, hapus (ada konfirmasi + toast).
- [ ] Detail menampilkan judul/URL/jenis/deskripsi/tujuan.
- [ ] Refleksi < 100 karakter ditolak dengan pesan jumlah karakter.
- [ ] “Tandai sudah dipelajari” mengubah status; “Buat project dari materi” membuat project tertaut.

Project:
- [ ] Buat manual + dari materi; ubah; hapus (konfirmasi).
- [ ] Tambah task → progress % berubah; klik badge Todo→Doing→Done; hapus task.
- [ ] Tambah output: URL invalid ditolak; link terbuka di tab baru;
      set output utama kedua → yang lama otomatis non-utama.
- [ ] Simpan review → tandai selesai → buat project lanjutan (parent terisi)
      → kembali ke materi.

Portofolio:
- [ ] Centang featured di ubah project → muncul di `/portofolio` lengkap
      (judul, deskripsi, sumber, insight, jumlah output, tombol buka output).

Umum:
- [ ] Mobile (360px): tidak ada overflow horizontal; form mudah dipakai.
- [ ] Setiap simpan ada toast; setiap hapus ada konfirmasi; ada empty/error/loading state.
- [ ] `npm run build` lolos; preview Cloudflare Pages normal; tidak ada `service_role` di bundle.

## 10. Batasan MVP

AI, reminder, dan integrasi platform (verifikasi konten otomatis dsb.) **tidak** dikerjakan
sebelum checklist di atas lolos. Aplikasi hanya menyimpan URL apa adanya.
