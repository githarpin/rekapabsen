import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { AppData, Koleksi } from "./types";

const STORAGE_KEY = "rekap-mengajar-data-v1";

// Tanpa data dummy: aplikasi selalu mulai kosong.
const DATA_AWAL: AppData = {
  dosen: [],
  mataKuliah: [],
  kelas: [],
  pertemuan: [],
};

interface DataKonteks {
  data: AppData;
  siap: boolean;
  tambah<K extends Koleksi>(koleksi: K, item: AppData[K][number]): void;
  ubah<K extends Koleksi>(
    koleksi: K,
    id: string,
    perubahan: Partial<AppData[K][number]>,
  ): void;
  hapus(koleksi: Koleksi, id: string): void;
}

const DataKonteks = createContext<DataKonteks | null>(null);

// Catatan: data saat ini hanya tersimpan di browser (localStorage).
// Belum ada backend/database yang terhubung.
export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(DATA_AWAL);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    try {
      const tersimpan = window.localStorage.getItem(STORAGE_KEY);
      if (tersimpan) {
        const terbaca = JSON.parse(tersimpan) as Partial<AppData>;
        setData({ ...DATA_AWAL, ...terbaca });
      }
    } catch {
      // Data rusak/tidak valid: mulai dari kosong.
    }
    setSiap(true);
  }, []);

  useEffect(() => {
    if (!siap) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Penyimpanan browser tidak tersedia; data tetap di memori sesi ini.
    }
  }, [data, siap]);

  const tambah = <K extends Koleksi>(koleksi: K, item: AppData[K][number]) => {
    setData(
      (sebelumnya) =>
        ({
          ...sebelumnya,
          [koleksi]: [...sebelumnya[koleksi], item],
        }) as AppData,
    );
  };

  const ubah = <K extends Koleksi>(
    koleksi: K,
    id: string,
    perubahan: Partial<AppData[K][number]>,
  ) => {
    setData(
      (sebelumnya) =>
        ({
          ...sebelumnya,
          [koleksi]: sebelumnya[koleksi].map((item) =>
            "id" in item && item.id === id ? { ...item, ...perubahan } : item,
          ),
        }) as AppData,
    );
  };

  const hapus = (koleksi: Koleksi, id: string) => {
    setData((sebelumnya) => {
      const berikutnya: AppData = {
        ...sebelumnya,
        [koleksi]: sebelumnya[koleksi].filter((item) => item.id !== id),
      };
      // Pertemuan yang merujuk data induk yang dihapus ikut dibersihkan
      // agar rekap tetap konsisten.
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
