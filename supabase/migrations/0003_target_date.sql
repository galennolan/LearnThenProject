-- OutputLab 0003 — target tanggal selesai per materi (pendorong progres).
-- Jalankan di Supabase Dashboard > SQL Editor SETELAH 0002.
-- Aman dijalankan ulang.

ALTER TABLE public.learning_items
  ADD COLUMN IF NOT EXISTS target_date date;
