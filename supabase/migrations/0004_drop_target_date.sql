-- OutputLab 0004 — hapus kolom target_date (fitur dibatalkan).
-- Aman dijalankan kapan pun: tidak error bila kolom tidak ada.
-- Jalankan di Supabase Dashboard > SQL Editor HANYA bila migrasi 0003
-- pernah dijalankan di database tersebut. Bila 0003 tidak pernah
-- dijalankan, migrasi ini tidak perlu dijalankan (tetap aman bila dijalankan).

ALTER TABLE public.learning_items DROP COLUMN IF EXISTS target_date;
