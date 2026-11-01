import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";

import type { AppData, Koleksi } from "./types";

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
    dosen: (dosen.data ?? []) as AppData["dosen"],
    mataKuliah: (mataKuliah.data ?? []) as AppData["mataKuliah"],
    kelas: (kelas.data ?? []) as AppData["kelas"],
    pertemuan: (pertemuan.data ?? []) as AppData["pertemuan"],
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
      if (hasil.data) petaDosen.set(id, hasil.data.id as string);
    }
    for (const { id, ...nilai } of lama.kelas ?? []) {
      const hasil = await supabase.from("kelas").insert(nilai).select("id").single();
      if (hasil.data) petaKelas.set(id, hasil.data.id as string);
    }
    for (const { id, ...nilai } of lama.mataKuliah ?? []) {
      const hasil = await supabase.from("mata_kuliah").insert(nilai).select("id").single();
      if (hasil.data) petaMataKuliah.set(id, hasil.data.id as string);
    }
    for (const { id: _id, ...nilai } of lama.pertemuan ?? []) {
      const dosenId = petaDosen.get(nilai.dosenId);
      const kelasId = petaKelas.get(nilai.kelasId);
      const mataKuliahId = petaMataKuliah.get(nilai.mataKuliahId);
      if (!dosenId || !kelasId || !mataKuliahId) continue;
      await supabase
        .from("pertemuan")
        .insert({ ...nilai, dosenId, kelasId, mataKuliahId } as never);
    }
    window.localStorage.removeItem(KUNCI_LOKAL_LAMA);
    return await muatSemua();
  } catch (kesalahan) {
    console.error("Gagal mengimpor data lama:", kesalahan);
    return null;
  }
}

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
    const { id: _id, ...nilai } = item as { id: string } & Record<string, unknown>;
    const { data: baris, error } = await supabase
      .from(TABEL[koleksi])
      .insert(nilai as never)
      .select()
      .single();
    if (error || !baris) {
      console.error("Gagal menyimpan data:", error);
      return;
    }
    setData(
      (sebelumnya) =>
        ({
          ...sebelumnya,
          [koleksi]: [...sebelumnya[koleksi], baris],
        }) as AppData,
    );
  };

  const ubah = async <K extends Koleksi>(
    koleksi: K,
    id: string,
    perubahan: Partial<AppData[K][number]>,
  ) => {
    const { data: baris, error } = await supabase
      .from(TABEL[koleksi])
      .update(perubahan as never)
      .eq("id", id)
      .select()
      .single();
    if (error || !baris) {
      console.error("Gagal mengubah data:", error);
      return;
    }
    setData(
      (sebelumnya) =>
        ({
          ...sebelumnya,
          [koleksi]: sebelumnya[koleksi].map((item) =>
            "id" in item && item.id === id ? baris : item,
          ),
        }) as AppData,
    );
  };

  const hapus = async (koleksi: Koleksi, id: string) => {
    const { error } = await supabase.from(TABEL[koleksi]).delete().eq("id", id);
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
