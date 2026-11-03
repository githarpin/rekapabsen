import { describe, expect, it } from "vitest";

import { hitungTotalSks, susunRekap, type FilterRekap } from "@/lib/rekap";
import type { AppData } from "@/lib/types";

const data: AppData = {
  dosen: [
    { id: "d1", nama: "Budi Santoso", nidn: "001", prodi: "D3 Manajemen Informatika" },
    { id: "d2", nama: "Sari Dewi", nidn: "002", prodi: "D3 Teknik Komputer" },
  ],
  mataKuliah: [
    { id: "m1", kode: "MI01", nama: "Pemrograman Web", sks: 3, prodi: "D3 Manajemen Informatika" },
    { id: "m2", kode: "TK01", nama: "Jaringan Komputer", sks: 2, prodi: "D3 Teknik Komputer" },
  ],
  kelas: [
    { id: "k1", nama: "MI-1A", prodi: "D3 Manajemen Informatika" },
    { id: "k2", nama: "TK-2A", prodi: "D3 Teknik Komputer" },
  ],
  pertemuan: [
    { id: "p1", dosenId: "d1", prodi: "D3 Manajemen Informatika", kelasId: "k1", mataKuliahId: "m1", tanggal: "2026-10-05", metode: "Teori", sks: 3, fotoUrl: null },
    { id: "p2", dosenId: "d1", prodi: "D3 Manajemen Informatika", kelasId: "k1", mataKuliahId: "m1", tanggal: "2026-10-12", metode: "Praktik", sks: 2, fotoUrl: null },
    { id: "p3", dosenId: "d2", prodi: "D3 Teknik Komputer", kelasId: "k2", mataKuliahId: "m2", tanggal: "2026-09-20", metode: "Teori", sks: 2, fotoUrl: null },
    { id: "p4", dosenId: "d2", prodi: "D3 Teknik Komputer", kelasId: "k2", mataKuliahId: "m2", tanggal: "2026-11-01", metode: "Praktik", sks: 3, fotoUrl: null },
  ],
};

const filterSemua: FilterRekap = {
  bulan: "semua",
  tahun: "semua",
  prodi: "semua",
  dosenId: "semua",
};

describe("susunRekap", () => {
  it("menyaring rekap berdasarkan bulan dan dosen", () => {
    const hasil = susunRekap(data, { ...filterSemua, bulan: 10, dosenId: "d1" });
    expect(hasil.map((b) => b.pertemuan.id)).toEqual(["p1", "p2"]);
    expect(hasil[0]?.kelas).toBe("MI-1A");
    expect(hasil[0]?.mataKuliah).toBe("Pemrograman Web");
  });

  it("menyaring rekap berdasarkan program studi", () => {
    const hasil = susunRekap(data, { ...filterSemua, prodi: "D3 Teknik Komputer" });
    expect(hasil.map((b) => b.pertemuan.id)).toEqual(["p3", "p4"]);
  });

  it("mengurutkan baris berdasarkan tanggal", () => {
    const hasil = susunRekap(data, filterSemua);
    expect(hasil.map((b) => b.pertemuan.id)).toEqual(["p3", "p1", "p2", "p4"]);
  });

  it("menghitung total SKS hanya dari baris yang tampil", () => {
    const hasil = susunRekap(data, { ...filterSemua, tahun: 2026, bulan: 10 });
    expect(hitungTotalSks(hasil)).toBe(5);
    expect(hitungTotalSks(susunRekap(data, filterSemua))).toBe(10);
  });
});
