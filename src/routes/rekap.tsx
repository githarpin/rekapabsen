import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTanggal } from "@/lib/format";
import { hitungTotalSks, labelPeriode, susunRekap, type FilterRekap } from "@/lib/rekap";
import { useAppData } from "@/lib/store";
import { BULAN_LIST, PRODI_LIST, type Prodi } from "@/lib/types";

export const Route = createFileRoute("/rekap")({
  head: () => ({
    meta: [
      { title: "Rekap Mengajar — Sistem Rekap Mengajar" },
      {
        name: "description",
        content: "Rekap absensi dosen beserta total SKS dan cetak laporan.",
      },
      { property: "og:title", content: "Rekap Mengajar — Sistem Rekap Mengajar" },
      {
        property: "og:description",
        content: "Rekap absensi dosen Fakultas Vokasi Institut Az Zuhra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RekapPage,
});

const SEL_TABEL = "border border-foreground/80 px-2 py-1.5";

function RekapPage() {
  const { data } = useAppData();

  const sekarang = new Date();
  const [bulan, setBulan] = useState(String(sekarang.getMonth() + 1));
  const [tahun, setTahun] = useState(String(sekarang.getFullYear()));
  const [prodi, setProdi] = useState("semua");
  const [dosenId, setDosenId] = useState("semua");

  const daftarTahun = useMemo(() => {
    const tahunTersedia = new Set<number>([sekarang.getFullYear()]);
    data.pertemuan.forEach((p) => {
      const tahunPertemuan = Number(p.tanggal.slice(0, 4));
      if (!Number.isNaN(tahunPertemuan)) tahunTersedia.add(tahunPertemuan);
    });
    return [...tahunTersedia].sort((a, b) => b - a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.pertemuan]);

  const filter: FilterRekap = {
    bulan: bulan === "semua" ? "semua" : Number(bulan),
    tahun: tahun === "semua" ? "semua" : Number(tahun),
    prodi: prodi === "semua" ? "semua" : (prodi as Prodi),
    dosenId: dosenId === "semua" ? "semua" : dosenId,
  };

  const baris = susunRekap(data, filter);
  const totalSks = hitungTotalSks(baris);

  const daftarDosen =
    filter.prodi === "semua"
      ? data.dosen
      : data.dosen.filter((d) => d.prodi === filter.prodi);

  const namaDosenTerpilih =
    filter.dosenId === "semua"
      ? "Semua Dosen"
      : (data.dosen.find((d) => d.id === filter.dosenId)?.nama ?? "-");
  const labelProdi = filter.prodi === "semua" ? "Semua Program Studi" : filter.prodi;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="no-print mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Rekap Mengajar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saring pertemuan mengajar lalu cetak rekap absensi dosen.
          </p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Cetak Rekap
        </Button>
      </div>

      <Card className="no-print mb-6">
        <CardHeader>
          <CardTitle className="text-base">Filter Rekap</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Bulan</Label>
            <Select value={bulan} onValueChange={setBulan}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Bulan</SelectItem>
                {BULAN_LIST.map((nama, indeks) => (
                  <SelectItem key={nama} value={String(indeks + 1)}>
                    {nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tahun</Label>
            <Select value={tahun} onValueChange={setTahun}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Tahun</SelectItem>
                {daftarTahun.map((t) => (
                  <SelectItem key={t} value={String(t)}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Program Studi</Label>
            <Select
              value={prodi}
              onValueChange={(nilai) => {
                setProdi(nilai);
                setDosenId("semua");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Program Studi</SelectItem>
                {PRODI_LIST.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Dosen</Label>
            <Select value={dosenId} onValueChange={setDosenId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Dosen</SelectItem>
                {daftarDosen.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dokumen rekap: inilah yang tercetak. */}
      <div className="print-area rounded-lg border bg-card p-4 sm:p-6">
        <div className="text-center">
          <h2 className="text-lg font-bold uppercase tracking-wide">Rekap Absensi Dosen</h2>
          <p className="text-sm">Fakultas Vokasi — Institut Az Zuhra</p>
        </div>

        <div className="mt-4 space-y-1 text-sm">
          <p>
            <span className="font-semibold">Periode:</span> {labelPeriode(filter)}
          </p>
          <p>
            <span className="font-semibold">Program Studi:</span> {labelProdi}
          </p>
          <p>
            <span className="font-semibold">Dosen:</span> {namaDosenTerpilih}
          </p>
        </div>

        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className={`${SEL_TABEL} w-10 text-center`}>No.</th>
              <th className={SEL_TABEL}>Kelas</th>
              <th className={SEL_TABEL}>Mata Kuliah</th>
              <th className={SEL_TABEL}>Tanggal</th>
              <th className={SEL_TABEL}>Metode</th>
              <th className={`${SEL_TABEL} w-16 text-center`}>SKS</th>
            </tr>
          </thead>
          <tbody>
            {baris.length === 0 ? (
              <tr>
                <td colSpan={6} className={`${SEL_TABEL} text-center text-muted-foreground`}>
                  Belum ada data pertemuan pada filter ini.
                </td>
              </tr>
            ) : (
              baris.map((b, indeks) => (
                <tr key={b.pertemuan.id}>
                  <td className={`${SEL_TABEL} text-center`}>{indeks + 1}</td>
                  <td className={SEL_TABEL}>{b.kelas}</td>
                  <td className={SEL_TABEL}>{b.mataKuliah}</td>
                  <td className={SEL_TABEL}>{formatTanggal(b.pertemuan.tanggal)}</td>
                  <td className={SEL_TABEL}>{b.pertemuan.metode}</td>
                  <td className={`${SEL_TABEL} text-center`}>{b.pertemuan.sks}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className={`${SEL_TABEL} text-right font-bold`}>
                Total SKS
              </td>
              <td className={`${SEL_TABEL} text-center font-bold`}>{totalSks}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
