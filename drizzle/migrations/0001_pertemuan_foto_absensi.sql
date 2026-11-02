ALTER TABLE public.pertemuan ADD COLUMN foto_url text;

COMMENT ON COLUMN public.pertemuan.foto_url IS 'URL foto lembar absensi pertemuan (bucket foto-absensi)';

-- Kebijakan akses foto absensi untuk bucket foto-absensi (anon karena aplikasi tanpa login)
CREATE POLICY "foto_absensi_insert_publik"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'foto-absensi');

CREATE POLICY "foto_absensi_select_publik"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'foto-absensi');

CREATE POLICY "foto_absensi_delete_publik"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'foto-absensi');
