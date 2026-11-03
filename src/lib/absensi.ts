// Logika pendukung fitur foto absensi yang dapat diuji tanpa server.
import type { Dosen, Kelas, MataKuliah, Prodi } from "./types";

export interface HasilBacaFoto {
  namaDosen: string | null;
  namaKelas: string | null;
  namaMataKuliah: string | null;
  tanggal: string | null;
  metode: "Teori" | "Praktik" | null;
  sks: number | null;
}

// Normalisasi teks untuk pencocokan nama: huruf kecil, tanpa tanda baca, spasi tunggal.
export function normalisasiNama(nilai: string): string {
  return nilai
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Cocokkan nama hasil bacaan foto dengan daftar nama yang sudah ada.
// Urutan: sama persis, lalu nama daftar yang memuat nama hasil bacaan, lalu sebaliknya.
export function cocokkanNama(hasilBaca: string | null, daftar: string[]): string | null {
  if (!hasilBaca) return null;
  const target = normalisasiNama(hasilBaca);
  if (!target) return null;

  for (const nama of daftar) {
    if (normalisasiNama(nama) === target) return nama;
  }
  for (const nama of daftar) {
    const kandidat = normalisasiNama(nama);
    if (kandidat.includes(target) || target.includes(kandidat)) return nama;
  }
  return null;
}

// Samakan bentuk tanggal dari foto ke format YYYY-MM-DD yang diterima input date.
// Mendukung: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY.
export function normalisasiTanggal(nilai: string | null): string | null {
  if (!nilai) return null;
  const teks = nilai.trim();
  const iso = teks.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, tahun, bulan, hari] = iso;
    return `${tahun}-${bulan!.padStart(2, "0")}-${hari!.padStart(2, "0")}`;
  }
  const idn = teks.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (idn) {
    const [, hari, bulan, tahun] = idn;
    return `${tahun}-${bulan!.padStart(2, "0")}-${hari!.padStart(2, "0")}`;
  }
  return null;
}

function cocokkanItem<T>(hasilBaca: string | null, daftar: T[], ambilNama: (item: T) => string): T | null {
  const nama = cocokkanNama(hasilBaca, daftar.map(ambilNama));
  if (!nama) return null;
  return daftar.find((item) => ambilNama(item) === nama) ?? null;
}

export interface HasilCocokPertemuan {
  dosenId: string | null;
  kelasId: string | null;
  mataKuliahId: string | null;
  prodi: Prodi | null;
  tanggal: string | null;
  metode: "Teori" | "Praktik" | null;
  sks: number | null;
}

// Cocokkan hasil bacaan foto dengan data yang sudah ada di aplikasi.
// Prodi diambil dari kelas, lalu dosen, lalu mata kuliah.
// SKS diprioritaskan dari mata kuliah agar konsisten dengan data master.
export function cocokkanPertemuan(
  hasil: HasilBacaFoto,
  daftar: { dosen: Dosen[]; kelas: Kelas[]; mataKuliah: MataKuliah[] },
): HasilCocokPertemuan {
  const dosen = cocokkanItem(hasil.namaDosen, daftar.dosen, (d) => d.nama);
  const kelas = cocokkanItem(hasil.namaKelas, daftar.kelas, (k) => k.nama);
  const mataKuliah = cocokkanItem(hasil.namaMataKuliah, daftar.mataKuliah, (m) => m.nama);

  return {
    dosenId: dosen?.id ?? null,
    kelasId: kelas?.id ?? null,
    mataKuliahId: mataKuliah?.id ?? null,
    prodi: kelas?.prodi ?? dosen?.prodi ?? mataKuliah?.prodi ?? null,
    tanggal: normalisasiTanggal(hasil.tanggal),
    metode: hasil.metode,
    sks: mataKuliah?.sks ?? hasil.sks ?? null,
  };
}
