// Logika pendukung fitur foto absensi yang dapat diuji tanpa server.

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
