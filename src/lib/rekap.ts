import { namaBulan, type AppData, type Pertemuan, type Prodi } from "./types";

export interface FilterRekap {
  bulan: number | "semua";
  tahun: number | "semua";
  prodi: Prodi | "semua";
  dosenId: string | "semua";
}

export interface BarisRekap {
  pertemuan: Pertemuan;
  dosen: string;
  kelas: string;
  mataKuliah: string;
}

export function labelPeriode(filter: FilterRekap): string {
  if (filter.bulan === "semua" && filter.tahun === "semua") return "Semua periode";
  if (filter.bulan === "semua") return `Tahun ${filter.tahun}`;
  return `${namaBulan(filter.bulan)} ${filter.tahun}`;
}

export function susunRekap(data: AppData, filter: FilterRekap): BarisRekap[] {
  const namaDosen = new Map(data.dosen.map((d) => [d.id, d.nama]));
  const namaKelas = new Map(data.kelas.map((k) => [k.id, k.nama]));
  const namaMataKuliah = new Map(data.mataKuliah.map((m) => [m.id, m.nama]));

  return data.pertemuan
    .filter((p) => {
      const [tahunTeks, bulanTeks] = p.tanggal.split("-");
      const tahunPertemuan = Number(tahunTeks);
      const bulanPertemuan = Number(bulanTeks);
      if (filter.bulan !== "semua" && bulanPertemuan !== filter.bulan) return false;
      if (filter.tahun !== "semua" && tahunPertemuan !== filter.tahun) return false;
      if (filter.prodi !== "semua" && p.prodi !== filter.prodi) return false;
      if (filter.dosenId !== "semua" && p.dosenId !== filter.dosenId) return false;
      // Lewati pertemuan yang datanya induknya sudah tidak ada.
      return (
        namaDosen.has(p.dosenId) &&
        namaKelas.has(p.kelasId) &&
        namaMataKuliah.has(p.mataKuliahId)
      );
    })
    .map((p) => ({
      pertemuan: p,
      dosen: namaDosen.get(p.dosenId) ?? "-",
      kelas: namaKelas.get(p.kelasId) ?? "-",
      mataKuliah: namaMataKuliah.get(p.mataKuliahId) ?? "-",
    }))
    .sort((a, b) => a.pertemuan.tanggal.localeCompare(b.pertemuan.tanggal));
}

export function hitungTotalSks(baris: BarisRekap[]): number {
  return baris.reduce((total, b) => total + (Number(b.pertemuan.sks) || 0), 0);
}
