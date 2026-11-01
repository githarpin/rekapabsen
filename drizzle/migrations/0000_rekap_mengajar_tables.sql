create table public.dosen (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  nidn text not null default '',
  prodi text not null,
  created_at timestamptz not null default now()
);

create table public.mata_kuliah (
  id uuid primary key default gen_random_uuid(),
  kode text not null default '',
  nama text not null,
  sks integer not null default 2,
  prodi text not null,
  created_at timestamptz not null default now()
);

create table public.kelas (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  prodi text not null,
  created_at timestamptz not null default now()
);

create table public.pertemuan (
  id uuid primary key default gen_random_uuid(),
  dosen_id uuid not null references public.dosen(id) on delete cascade,
  prodi text not null,
  kelas_id uuid not null references public.kelas(id) on delete cascade,
  mata_kuliah_id uuid not null references public.mata_kuliah(id) on delete cascade,
  tanggal date not null,
  metode text not null default 'Teori',
  sks integer not null default 2,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.dosen to anon, authenticated;
grant all on public.dosen to service_role;
grant select, insert, update, delete on public.mata_kuliah to anon, authenticated;
grant all on public.mata_kuliah to service_role;
grant select, insert, update, delete on public.kelas to anon, authenticated;
grant all on public.kelas to service_role;
grant select, insert, update, delete on public.pertemuan to anon, authenticated;
grant all on public.pertemuan to service_role;

alter table public.dosen enable row level security;
alter table public.mata_kuliah enable row level security;
alter table public.kelas enable row level security;
alter table public.pertemuan enable row level security;

create policy "akses_publik_dosen" on public.dosen for all to anon, authenticated using (true) with check (true);
create policy "akses_publik_mata_kuliah" on public.mata_kuliah for all to anon, authenticated using (true) with check (true);
create policy "akses_publik_kelas" on public.kelas for all to anon, authenticated using (true) with check (true);
create policy "akses_publik_pertemuan" on public.pertemuan for all to anon, authenticated using (true) with check (true);
