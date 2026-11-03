export type Prodi = "D3 Manajemen Informatika" | "D3 Teknik Komputer";

export const PRODI_LIST: Prodi[] = ["D3 Manajemen Informatika", "D3 Teknik Komputer"];

export type Metode = "Teori" | "Praktik";

export const METODE_LIST: Metode[] = ["Teori", "Praktik"];

export const BULAN_LIST = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export function namaBulan(bulan: number): string {
  return BULAN_LIST[bulan - 1] ?? "";
}

export interface Dosen {
  id: string;
  nama: string;
  nidn: string;
  prodi: Prodi;
}

export interface MataKuliah {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  prodi: Prodi;
}

export interface Kelas {
  id: string;
  nama: string;
  prodi: Prodi;
}

export interface Pertemuan {
  id: string;
  dosenId: string;
  prodi: Prodi;
  kelasId: string;
  mataKuliahId: string;
  tanggal: string; // format YYYY-MM-DD
  metode: Metode;
  sks: number;
  fotoUrl: string | null; // path objek di bucket foto-absensi
}

export interface AppData {
  dosen: Dosen[];
  mataKuliah: MataKuliah[];
  kelas: Kelas[];
  pertemuan: Pertemuan[];
}

export type Koleksi = keyof AppData;
