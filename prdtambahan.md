# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## RuangUang — Personal & Family Finance Tracker

**Versi:** 1.0  
**Platform:** Web Application / Responsive PWA  
**Database:** PostgreSQL (Supabase)  
**Arsitektur pengguna:** Single-user, tanpa login dan registrasi  
**Bahasa:** Indonesia  
**Mata uang utama:** Rupiah (IDR)

---

## 1. Latar Belakang

RuangUang merupakan aplikasi pencatatan dan pengelolaan keuangan pribadi serta keluarga.

Aplikasi dirancang untuk membantu pengguna memahami kondisi keuangan secara menyeluruh, mulai dari pendapatan, pengeluaran, saldo rekening, kewajiban utang, jadwal cicilan, hingga proyeksi keuangan masa depan.

Permasalahan utama yang ingin diselesaikan:

1. Pendapatan bulanan tidak selalu sebanding dengan kewajiban cicilan.
2. Pengeluaran keluarga sering tidak tercatat secara terstruktur.
3. Pengguna kesulitan mengetahui sisa uang yang benar-benar dapat digunakan.
4. Pembayaran utang dan cicilan sulit dipantau.
5. Tidak tersedia proyeksi saldo berdasarkan pendapatan dan kewajiban mendatang.
6. Pengguna membutuhkan evaluasi kondisi keuangan berdasarkan data historis.

## 2. Tujuan Produk

RuangUang memiliki tujuan:

- Mencatat seluruh pemasukan dan pengeluaran.
- Mengelola beberapa sumber pendapatan.
- Mencatat seluruh jenis utang dan kewajibannya.
- Membuat jadwal pembayaran cicilan otomatis.
- Mencatat pembayaran cicilan aktual.
- Memantau saldo seluruh rekening dan kas.
- Membuat laporan arus kas bulanan.
- Mengelola anggaran keluarga.
- Memproyeksikan kondisi keuangan 3, 6, dan 12 bulan.
- Menampilkan perkembangan sisa utang dan tabungan.

## 3. Target Pengguna

Aplikasi digunakan oleh satu orang sebagai pengelola keuangan rumah tangga.

Karakteristik:
- Tidak membutuhkan registrasi.
- Tidak membutuhkan login.
- Tidak memiliki sistem multi-user.
- Seluruh data disimpan dalam satu lingkungan database.
- Dapat diakses melalui laptop dan smartphone.

Catatan keamanan: karena tidak ada autentikasi, aplikasi ditujukan untuk penggunaan lokal atau lingkungan pribadi yang terlindungi. Jika dipublikasikan ke internet, akses harus dibatasi melalui lapisan keamanan infrastruktur.

## 4. Ruang Lingkup Fitur

### 4.1 Dashboard

Dashboard merupakan halaman utama yang menampilkan ringkasan keuangan.

Komponen:

**A. Ringkasan saldo**
- Total saldo seluruh rekening.
- Total pendapatan bulan berjalan.
- Total pengeluaran bulan berjalan.
- Total kewajiban cicilan bulan berjalan.
- Sisa uang setelah kewajiban.
- Total saldo tabungan.

**B. Ringkasan utang**
- Total sisa pokok utang.
- Total cicilan bulanan.
- Jumlah tagihan belum dibayar.
- Tagihan mendatang.
- Persentase utang yang sudah dilunasi.

**C. Grafik keuangan**
- Grafik pemasukan dan pengeluaran.
- Grafik perkembangan saldo.
- Grafik pengeluaran berdasarkan kategori.
- Grafik perkembangan utang.

**D. Informasi penting**
- Tagihan jatuh tempo terdekat.
- Anggaran yang hampir habis.
- Pengeluaran terbesar bulan ini.
- Proyeksi saldo akhir bulan.

### 4.2 Manajemen Rekening (Accounts)

Digunakan untuk mencatat sumber penyimpanan uang.

Jenis rekening:
- Tunai.
- Rekening bank.
- E-wallet.
- Tabungan.
- Rekening lainnya.

Field:
- Nama rekening.
- Jenis rekening.
- Saldo awal.
- Tanggal saldo awal.
- Status aktif.
- Keterangan.

Fungsi:
- Tambah rekening.
- Edit rekening.
- Hapus rekening jika tidak memiliki transaksi terkait.
- Melihat riwayat transaksi rekening.
- Melihat saldo terkini.

### 4.3 Manajemen Pendapatan (Income)

Digunakan untuk mencatat semua sumber uang masuk.

Kategori pendapatan:
- Gaji.
- Bisnis.
- Freelance.
- Honorarium.
- Bonus.
- Pendapatan lainnya.

Field:
- Tanggal transaksi.
- Sumber pendapatan.
- Kategori.
- Jumlah.
- Rekening penerima.
- Keterangan.

Fungsi:
- Input pendapatan manual.
- Input pendapatan rutin.
- Melihat riwayat pendapatan.
- Melihat laporan pendapatan bulanan.

Pendapatan rutin dapat dibuat sebagai jadwal, tetapi saldo rekening hanya bertambah setelah transaksi benar-benar diterima.

### 4.4 Manajemen Pengeluaran (Expenses)

Digunakan untuk mencatat seluruh pengeluaran.

Kategori default:

**Kebutuhan rumah tangga**
- Belanja bahan makanan.
- Listrik.
- Air.
- Gas.
- Internet.
- Perlengkapan rumah.

**Keluarga**
- Pendidikan anak.
- Kesehatan.
- Transportasi.
- Kebutuhan pribadi.
- Hiburan.

**Keuangan**
- Pembayaran cicilan.
- Biaya administrasi.
- Pajak.
- Biaya lainnya.

Field:
- Tanggal transaksi.
- Kategori.
- Nama pengeluaran.
- Nominal.
- Rekening sumber.
- Keterangan.
- Jenis transaksi.

Fungsi:
- Tambah pengeluaran.
- Edit pengeluaran.
- Hapus transaksi.
- Filter berdasarkan kategori dan tanggal.
- Melihat histori pengeluaran.
- Membandingkan pengeluaran aktual dengan anggaran.

### 4.5 Manajemen Utang (Debts)

Modul utama untuk mencatat kewajiban keuangan.

Jenis utang:
- Pinjaman bank.
- BPR.
- Kartu kredit.
- KTA.
- Pinjaman pribadi.
- Cicilan barang.
- Utang lainnya.

Field:
- Nama kreditur.
- Jenis utang.
- Tanggal pinjaman.
- Jumlah pinjaman awal.
- Sisa pokok.
- Suku bunga.
- Jenis bunga.
- Tenor awal.
- Sisa tenor.
- Nominal cicilan bulanan.
- Tanggal jatuh tempo.
- Biaya pelunasan dipercepat.
- Status utang.
- Keterangan.

Fungsi:
- Tambah utang.
- Edit informasi utang.
- Melihat total sisa utang.
- Melihat total cicilan bulanan.
- Melihat histori pembayaran.
- Melihat progres pelunasan.
- Mencatat pelunasan sebagian atau seluruhnya.

Catatan: sistem harus membedakan saldo pokok, bunga, biaya administrasi, dan total pembayaran. Jika saldo pokok aktual belum diketahui, aplikasi tidak boleh mengarang perhitungannya.

### 4.6 Jadwal Cicilan (Debt Installments)

Setiap utang dapat memiliki jadwal cicilan.

Field:
- Utang terkait.
- Nomor cicilan.
- Tanggal jatuh tempo.
- Nominal pokok.
- Nominal bunga.
- Biaya tambahan.
- Total tagihan.
- Status pembayaran.

Status:
- Upcoming.
- Due.
- Paid.
- Overdue.
- Partially Paid.

Fungsi:
- Membuat jadwal cicilan otomatis.
- Melihat seluruh cicilan mendatang.
- Mengingatkan tanggal jatuh tempo.
- Menampilkan cicilan yang terlambat.
- Mencatat pembayaran aktual.

Jadwal pembayaran tidak otomatis mengurangi saldo rekening. Saldo hanya berubah ketika pembayaran dikonfirmasi.

### 4.7 Pembayaran Utang (Debt Payments)

Digunakan untuk mencatat pembayaran cicilan yang benar-benar dilakukan.

Field:
- Utang terkait.
- Jadwal cicilan terkait.
- Tanggal pembayaran.
- Jumlah pembayaran.
- Pembayaran pokok.
- Pembayaran bunga.
- Biaya tambahan.
- Rekening sumber.
- Status pembayaran.
- Catatan.

Aturan:
- Pembayaran mengurangi saldo rekening.
- Pembayaran pokok mengurangi saldo pokok utang.
- Pembayaran bunga dicatat sebagai beban.
- Pembayaran sebagian mengubah status tagihan menjadi Partially Paid.
- Pembayaran penuh mengubah status menjadi Paid.
- Setiap pembayaran memiliki histori audit.

### 4.8 Anggaran (Budgets)

Digunakan untuk menentukan batas pengeluaran.

Field:
- Nama anggaran.
- Kategori.
- Periode.
- Nominal anggaran.
- Nominal terpakai.
- Sisa anggaran.

Fungsi:
- Menentukan anggaran bulanan.
- Menampilkan persentase penggunaan anggaran.
- Memberikan peringatan ketika anggaran mendekati batas.
- Membandingkan anggaran dengan realisasi.

### 4.9 Proyeksi Keuangan (Financial Projection)

Fitur penting yang menjadi pembeda RuangUang.

Pengguna dapat melihat kondisi keuangan berdasarkan transaksi historis dan jadwal keuangan mendatang.

Periode:
- 3 bulan.
- 6 bulan.
- 12 bulan.

Komponen proyeksi:
- Saldo awal.
- Pendapatan rutin.
- Estimasi pendapatan tambahan.
- Pengeluaran rutin.
- Cicilan utang.
- Anggaran keluarga.
- Saldo akhir estimasi.

Rumus:

Saldo akhir proyeksi = Saldo awal + Pendapatan proyeksi - Pengeluaran proyeksi - Pembayaran utang proyeksi.

Sistem harus menyediakan dua jenis tampilan:

1. Proyeksi berdasarkan jadwal: menggunakan pendapatan dan kewajiban yang telah dijadwalkan.
2. Proyeksi berdasarkan skenario: pengguna dapat mengubah pendapatan, biaya hidup, dan strategi pembayaran untuk melihat dampaknya.

Semua hasil harus diberi label estimasi, bukan saldo aktual.

## 5. Laporan Keuangan

### 5.1 Laporan Arus Kas

Menampilkan:
- Total pemasukan.
- Total pengeluaran operasional.
- Total pembayaran utang.
- Total bunga.
- Perubahan saldo bersih.

### 5.2 Laporan Pengeluaran

Menampilkan:
- Pengeluaran per kategori.
- Pengeluaran per bulan.
- Pengeluaran terbesar.
- Perbandingan antarbulan.

### 5.3 Laporan Utang

Menampilkan:
- Total utang awal.
- Total sisa pokok.
- Total pembayaran pokok.
- Total bunga yang dibayar.
- Progres pelunasan.
- Daftar kewajiban mendatang.

### 5.4 Laporan Saldo

Menampilkan:
- Saldo awal periode.
- Total uang masuk.
- Total uang keluar.
- Saldo akhir periode.

Semua laporan dapat difilter berdasarkan tanggal dan diekspor ke CSV.

## 6. Rancangan Database

Database menggunakan PostgreSQL.

Tidak ada tabel users dan tidak ada sistem autentikasi aplikasi.

### Tabel 1: accounts

| Field | Tipe |
|---|---|
| id | UUID, PK |
| name | VARCHAR(100) |
| account_type | VARCHAR(30) |
| opening_balance | NUMERIC(15,2) |
| opening_date | DATE |
| is_active | BOOLEAN |
| created_at | TIMESTAMPTZ |

### Tabel 2: categories

| Field | Tipe |
|---|---|
| id | UUID, PK |
| name | VARCHAR(100) |
| category_type | VARCHAR(20) |
| parent_id | UUID, FK nullable |
| is_active | BOOLEAN |

category_type: income, expense.

### Tabel 3: transactions

| Field | Tipe |
|---|---|
| id | UUID, PK |
| account_id | UUID, FK |
| category_id | UUID, FK |
| transaction_type | VARCHAR(20) |
| transaction_date | DATE |
| amount | NUMERIC(15,2) |
| description | TEXT |
| reference_type | VARCHAR(30) |
| reference_id | UUID nullable |
| created_at | TIMESTAMPTZ |

transaction_type: income, expense, transfer_in, transfer_out, debt_payment.

### Tabel 4: debts

| Field | Tipe |
|---|---|
| id | UUID, PK |
| creditor_name | VARCHAR(150) |
| debt_type | VARCHAR(50) |
| principal_amount | NUMERIC(15,2) |
| outstanding_principal | NUMERIC(15,2) |
| interest_rate | NUMERIC(8,4) |
| interest_type | VARCHAR(30) |
| start_date | DATE |
| original_tenor | INTEGER |
| remaining_tenor | INTEGER |
| monthly_installment | NUMERIC(15,2) |
| due_day | INTEGER |
| early_settlement_fee | NUMERIC(15,2) |
| status | VARCHAR(20) |
| notes | TEXT |

### Tabel 5: debt_installments

| Field | Tipe |
|---|---|
| id | UUID, PK |
| debt_id | UUID, FK |
| installment_number | INTEGER |
| due_date | DATE |
| principal_amount | NUMERIC(15,2) |
| interest_amount | NUMERIC(15,2) |
| additional_fee | NUMERIC(15,2) |
| total_amount | NUMERIC(15,2) |
| status | VARCHAR(20) |

### Tabel 6: debt_payments

| Field | Tipe |
|---|---|
| id | UUID, PK |
| debt_id | UUID, FK |
| installment_id | UUID, FK nullable |
| account_id | UUID, FK |
| payment_date | DATE |
| principal_paid | NUMERIC(15,2) |
| interest_paid | NUMERIC(15,2) |
| fee_paid | NUMERIC(15,2) |
| total_paid | NUMERIC(15,2) |
| notes | TEXT |

### Tabel 7: budgets

| Field | Tipe |
|---|---|
| id | UUID, PK |
| category_id | UUID, FK |
| period_month | INTEGER |
| period_year | INTEGER |
| budget_amount | NUMERIC(15,2) |
| created_at | TIMESTAMPTZ |

### Tabel 8: recurring_transactions

| Field | Tipe |
|---|---|
| id | UUID, PK |
| name | VARCHAR(150) |
| transaction_type | VARCHAR(20) |
| category_id | UUID, FK |
| account_id | UUID, FK |
| amount | NUMERIC(15,2) |
| frequency | VARCHAR(20) |
| start_date | DATE |
| end_date | DATE nullable |
| next_due_date | DATE |
| is_active | BOOLEAN |

Recurring transactions digunakan untuk membuat jadwal pendapatan atau pengeluaran, bukan langsung mengubah saldo aktual.

## 7. Aturan Bisnis Utama

1. Semua nilai uang menggunakan NUMERIC(15,2), bukan FLOAT.
2. Setiap transaksi aktual harus memiliki rekening sumber atau tujuan yang valid.
3. Transfer antar rekening tidak boleh dihitung sebagai pendapatan maupun pengeluaran.
4. Pembayaran utang tidak boleh tercatat dua kali sebagai pengeluaran.
5. Pembayaran pokok dan bunga harus dibedakan.
6. Pembayaran sebagian harus didukung.
7. Saldo rekening dihitung dari saldo awal ditambah seluruh mutasi yang sah.
8. Jadwal tagihan tidak boleh otomatis dianggap sebagai pembayaran aktual.
9. Penghapusan transaksi harus memperbarui perhitungan saldo dan histori terkait.
10. Semua operasi pembayaran harus bersifat atomik agar saldo tidak berubah sebagian ketika terjadi kegagalan.
11. Proyeksi harus menggunakan data jadwal, bukan mencampur data aktual dan estimasi.
12. Data historis tidak boleh berubah ketika pengguna mengedit jadwal masa depan.

## 8. Teknologi yang Direkomendasikan

| Komponen | Teknologi |
|---|---|
| Frontend | Next.js |
| UI | Tailwind CSS |
| Komponen | shadcn/ui |
| Backend | Next.js Server Actions / API |
| Database | Supabase PostgreSQL |
| Grafik | Recharts |
| Validasi | Zod |
| Form | React Hook Form |
| Deployment | Vercel |
| PWA | Next.js PWA |

Karena tidak ada login, Supabase harus dikonfigurasi dengan akses database yang aman. Jangan mengekspos service role key atau memberikan akses publik bebas ke tabel keuangan.

## 9. Non-Functional Requirements

- Responsive untuk smartphone dan desktop.
- Waktu loading dashboard ditargetkan kurang dari 3 detik pada kondisi normal.
- Format mata uang menggunakan Rupiah.
- Tanggal menggunakan format Indonesia.
- Validasi nominal harus mencegah nilai negatif yang tidak sah.
- Tersedia backup dan ekspor data.
- Perubahan transaksi harus menjaga konsistensi saldo.
- Antarmuka mudah digunakan oleh pengguna nonteknis.

## 10. Prioritas Pengembangan

### Phase 1 — MVP
- Dashboard.
- Rekening.
- Pendapatan.
- Pengeluaran.
- Kategori.
- Manajemen utang.
- Jadwal cicilan.
- Pembayaran cicilan.
- Saldo aktual.

### Phase 2 — Financial Intelligence
- Anggaran bulanan.
- Laporan arus kas.
- Laporan utang.
- Grafik pengeluaran.
- Proyeksi saldo 3, 6, dan 12 bulan.
- Pengingat jatuh tempo.

### Phase 3 — Advanced Features
- Simulasi strategi pelunasan utang.
- Skenario penambahan pendapatan.
- Simulasi penghematan biaya hidup.
- Perbandingan strategi snowball dan avalanche.
- Analisis kesehatan keuangan.
- Ekspor laporan PDF dan Excel.

## 11. Kriteria Keberhasilan Produk

RuangUang dianggap berhasil jika pengguna dapat:

1. Mengetahui saldo aktual seluruh rekening.
2. Mengetahui berapa pendapatan dan pengeluaran bulan berjalan.
3. Mengetahui jumlah cicilan yang harus dibayar.
4. Mengetahui utang yang sudah dan belum dibayar.
5. Mengetahui sisa uang setelah seluruh kewajiban.
6. Mengetahui proyeksi saldo pada akhir bulan.
7. Membandingkan kondisi keuangan antar