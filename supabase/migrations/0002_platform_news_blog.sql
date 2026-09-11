-- OutputLab 0002 — tambah platform konten Berita & Blog
-- Jalankan di Supabase Dashboard > SQL Editor SETELAH 0001.
-- Aman dijalankan ulang (mendrop constraint lama secara dinamis bila ada).

DO $$
DECLARE
  cname text;
BEGIN
  SELECT c.conname INTO cname
  FROM pg_constraint c
  WHERE c.conrelid = 'public.outputs'::regclass
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%platform%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.outputs DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.outputs
  DROP CONSTRAINT IF EXISTS outputs_platform_check;

ALTER TABLE public.outputs
  ADD CONSTRAINT outputs_platform_check CHECK (
    platform IN (
      'github','gitlab','google_colab','google_docs','notion',
      'youtube','tiktok','instagram','linkedin','journal','website',
      'news','blog','other'
    )
  );
