import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import type {
  AppData,
  Dosen,
  Kelas,
  Koleksi,
  MataKuliah,
  Metode,
  Pertemuan,
  Prodi,
} from "./types";

const DATA_AWAL: AppData = {
  dosen: [],
  mataKuliah: [],
  kelas: [],
  pertemuan: [],
};

// Kunci data versi lama (sebelum backend tersambung), untuk impor sekali.
const KUNCI_LOKAL_LAMA = "rekap-mengajar-data-v1";

const TABEL = {
  dosen: "dosen",
  mataKuliah: "mata_kuliah",
  kelas: "kelas",
  pertemuan: "pertemuan",
} as const;

type BarisDosen = Database["public"]["Tables"]["dosen"]["Row"];
type BarisMataKuliah = Database["public"]["Tables"]["mata_kuliah"]["Row"];
type BarisKelas = Database["public"]["Tables"]["kelas"]["Row"];
type BarisPertemuan = Database["public"]["Tables"]["pertemuan"]["Row"];

// Pemetaan baris database (snake_case) <-> tipe aplikasi (camelCase).
function keDosen(b: BarisDosen): Dosen {
  return { id: b.id, nama: b.nama, nidn: b.nidn, prodi: b.prodi as Prodi };
}
function keMataKuliah(b: BarisMataKuliah): MataKuliah {
  return {
    id: b.id,
    kode: b.kode,
    nama: b.nama,
    sks: b.sks,
    prodi: b.prodi as Prodi,
  };
}
function keKelas(b: BarisKelas): Kelas {
  return { id: b.id, nama: b.nama, prodi: b.prodi as Prodi };
}
function kePertemuan(b: BarisPertemuan): Pertemuan {
  return {
    id: b.id,
    dosenId: b.dosen_id,
    prodi: b.prodi as Prodi,
    kelasId: b.kelas_id,
    mataKuliahId: b.mata_kuliah_id,
    tanggal: b.tanggal,
    metode: b.metode as Metode,
    sks: b.sks,
    fotoUrl: b.foto_url ?? null,
  };
}

function barisKeItem(koleksi: Koleksi, baris: unknown) {
  const b = baris as Record<string, unknown>;
  switch (koleksi) {
    case "dosen":
      return keDosen(b as unknown as BarisDosen);
    case "mataKuliah":
      return keMataKuliah(b as unknown as BarisMataKuliah);
    case "kelas":
      return keKelas(b as unknown as BarisKelas);
    case "pertemuan":
      return kePertemuan(b as unknown as BarisPertemuan);
  }
}

// Ubah kunci camelCase aplikasi menjadi nama kolom database.
function keBaris(koleksi: Koleksi, nilai: Record<string, unknown>): Record<string, unknown> {
  if (koleksi !== "pertemuan") return nilai;
  const pasangan: Record<string, string> = {
    dosenId: "dosen_id",
    kelasId: "kelas_id",
    mataKuliahId: "mata_kuliah_id",
    fotoUrl: "foto_url",
  };
  const hasil: Record<string, unknown> = {};
  for (const [kunci, isi] of Object.entries(nilai)) {
    hasil[pasangan[kunci] ?? kunci] = isi;
  }
  return hasil;
}

// Klien dengan tipe longgar agar CRUD generik antar empat tabel tetap rapi.
interface KlienLonggar {
  insert(nilai: unknown): { select(): { single(): Promise<{ data: unknown; error: unknown }> } };
  update(nilai: unknown): {
    eq(kolom: string, nilai: unknown): {
      select(): { single(): Promise<{ data: unknown; error: unknown }> };
    };
  };
  delete(): { eq(kolom: string, nilai: unknown): Promise<{ error: unknown }> };
}

function klien(tabel: string): KlienLonggar {
  return supabase.from(tabel as never) as unknown as KlienLonggar;
}

async function muatSemua(): Promise<AppData | null> {
  const [dosen, mataKuliah, kelas, pertemuan] = await Promise.all([
    supabase.from("dosen").select("*").order("created_at"),
    supabase.from("mata_kuliah").select("*").order("created_at"),
    supabase.from("kelas").select("*").order("created_at"),
    supabase.from("pertemuan").select("*").order("created_at"),
  ]);
  if (dosen.error || mataKuliah.error || kelas.error || pertemuan.error) {
    console.error("Gagal memuat data dari server:", {
      dosen: dosen.error,
      mataKuliah: mataKuliah.error,
      kelas: kelas.error,
      pertemuan: pertemuan.error,
    });
    return null;
  }
  return {
    dosen: (dosen.data ?? []).map(keDosen),
    mataKuliah: (mataKuliah.data ?? []).map(keMataKuliah),
    kelas: (kelas.data ?? []).map(keKelas),
    pertemuan: (pertemuan.data ?? []).map(kePertemuan),
  };
}

// Satu kali saja: pindahkan data lama dari browser ke server bila server kosong.
async function imporDataLokal(): Promise<AppData | null> {
  let lama: Partial<AppData> | null = null;
  try {
    const tersimpan = window.localStorage.getItem(KUNCI_LOKAL_LAMA);
    if (tersimpan) lama = JSON.parse(tersimpan) as Partial<AppData>;
  } catch {
    return null;
  }
  if (!lama) return null;

  const adaIsinya =
    (lama.dosen?.length ?? 0) +
      (lama.mataKuliah?.length ?? 0) +
      (lama.kelas?.length ?? 0) +
      (lama.pertemuan?.length ?? 0) >
    0;
  if (!adaIsinya) {
    window.localStorage.removeItem(KUNCI_LOKAL_LAMA);
    return null;
  }

  try {
    const petaDosen = new Map<string, string>();
    const petaKelas = new Map<string, string>();
    const petaMataKuliah = new Map<string, string>();

    for (const { id, ...nilai } of lama.dosen ?? []) {
      const hasil = await supabase.from("dosen").insert(nilai).select("id").single();
      if (hasil.data) petaDosen.set(id, hasil.data.id);
    }
    for (const { id, ...nilai } of lama.kelas ?? []) {
      const hasil = await supabase.from("kelas").insert(nilai).select("id").single();
      if (hasil.data) petaKelas.set(id, hasil.data.id);
    }
    for (const { id, ...nilai } of lama.mataKuliah ?? []) {
      const hasil = await supabase.from("mata_kuliah").insert(nilai).select("id").single();
      if (hasil.data) petaMataKuliah.set(id, hasil.data.id);
    }
    for (const p of lama.pertemuan ?? []) {
      const dosenId = petaDosen.get(p.dosenId);
      const kelasId = petaKelas.get(p.kelasId);
      const mataKuliahId = petaMataKuliah.get(p.mataKuliahId);
      if (!dosenId || !kelasId || !mataKuliahId) continue;
      await supabase.from("pertemuan").insert({
        dosen_id: dosenId,
        prodi: p.prodi,
        kelas_id: kelasId,
        mata_kuliah_id: mataKuliahId,
        tanggal: p.tanggal,
        metode: p.metode,
        sks: p.sks,
      });
    }
    window.localStorage.removeItem(KUNCI_LOKAL_LAMA);
    return await muatSemua();
  } catch (kesalahan) {
    console.error("Gagal mengimpor data lama:", kesalahan);
    return null;
  }
}

interface DataKonteks {
  data: AppData;
  siap: boolean;
  tambah<K extends Koleksi>(koleksi: K, item: AppData[K][number]): Promise<void>;
  ubah<K extends Koleksi>(
    koleksi: K,
    id: string,
    perubahan: Partial<AppData[K][number]>,
  ): Promise<void>;
  hapus(koleksi: Koleksi, id: string): Promise<void>;
}

const DataKonteks = createContext<DataKonteks | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(DATA_AWAL);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    let batal = false;
    (async () => {
      const awal = await muatSemua();
      if (batal) return;
      if (!awal) {
        setSiap(true);
        return;
      }
      const kosongSemua =
        awal.dosen.length + awal.mataKuliah.length + awal.kelas.length + awal.pertemuan.length ===
        0;
      const hasil = kosongSemua ? (await imporDataLokal()) ?? awal : awal;
      if (batal) return;
      setData(hasil);
      setSiap(true);
    })();
    return () => {
      batal = true;
    };
  }, []);

  const tambah = async <K extends Koleksi>(koleksi: K, item: AppData[K][number]) => {
    // ID dibuat oleh database; buang id yang dikirim komponen.
    const { id: _id, ...nilai } = item as unknown as { id: string } & Record<string, unknown>;
    const hasil = await klien(TABEL[koleksi])
      .insert(keBaris(koleksi, nilai))
      .select()
      .single();
    if (hasil.error || !hasil.data) {
      console.error("Gagal menyimpan data:", hasil.error);
      return;
    }
    setData(
      (sebelumnya) =>
        ({
          ...sebelumnya,
          [koleksi]: [...sebelumnya[koleksi], barisKeItem(koleksi, hasil.data)],
        }) as AppData,
    );
  };

  const ubah = async <K extends Koleksi>(
    koleksi: K,
    id: string,
    perubahan: Partial<AppData[K][number]>,
  ) => {
    const hasil = await klien(TABEL[koleksi])
      .update(keBaris(koleksi, perubahan as unknown as Record<string, unknown>))
      .eq("id", id)
      .select()
      .single();
    if (hasil.error || !hasil.data) {
      console.error("Gagal mengubah data:", hasil.error);
      return;
    }
    setData(
      (sebelumnya) =>
        ({
          ...sebelumnya,
          [koleksi]: sebelumnya[koleksi].map((item) =>
            "id" in item && item.id === id ? barisKeItem(koleksi, hasil.data) : item,
          ),
        }) as AppData,
    );
  };

  const hapus = async (koleksi: Koleksi, id: string) => {
    const { error } = await klien(TABEL[koleksi]).delete().eq("id", id);
    if (error) {
      console.error("Gagal menghapus data:", error);
      return;
    }
    setData((sebelumnya) => {
      const berikutnya: AppData = {
        ...sebelumnya,
        [koleksi]: sebelumnya[koleksi].filter((item) => item.id !== id),
      };
      // Pertemuan yang merujuk data induk yang dihapus ikut dibersihkan
      // (di database juga sudah cascade).
      if (koleksi === "dosen") {
        berikutnya.pertemuan = berikutnya.pertemuan.filter((p) => p.dosenId !== id);
      }
      if (koleksi === "kelas") {
        berikutnya.pertemuan = berikutnya.pertemuan.filter((p) => p.kelasId !== id);
      }
      if (koleksi === "mataKuliah") {
        berikutnya.pertemuan = berikutnya.pertemuan.filter(
          (p) => p.mataKuliahId !== id,
        );
      }
      return berikutnya;
    });
  };

  return (
    <DataKonteks.Provider value={{ data, siap, tambah, ubah, hapus }}>
      {children}
    </DataKonteks.Provider>
  );
}

export function useAppData(): DataKonteks {
  const konteks = useContext(DataKonteks);
  if (!konteks) {
    throw new Error("useAppData harus dipakai di dalam DataProvider");
  }
  return konteks;
}
