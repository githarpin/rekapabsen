import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTanggal } from "@/lib/format";
import { useAppData } from "@/lib/store";
import { METODE_LIST, PRODI_LIST, type Metode, type Prodi } from "@/lib/types";

export const Route = createFileRoute("/input-mengajar")({
  head: () => ({
    meta: [
      { title: "Input Mengajar — Sistem Rekap Mengajar" },
      {
        name: "description",
        content: "Catat pertemuan mengajar dosen beserta metode dan SKS-nya.",
      },
      { property: "og:title", content: "Input Mengajar — Sistem Rekap Mengajar" },
      {
        property: "og:description",
        content: "Catat pertemuan mengajar dosen Fakultas Vokasi Institut Az Zuhra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InputMengajarPage,
});

function InputMengajarPage() {
  const { data, tambah, hapus } = useAppData();

  const [dosenId, setDosenId] = useState("");
  const [prodi, setProdi] = useState<Prodi | "">("");
  const [kelasId, setKelasId] = useState("");
  const [mataKuliahId, setMataKuliahId] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [metode, setMetode] = useState<Metode>("Teori");
  const [sks, setSks] = useState("");
  const [pesanError, setPesanError] = useState("");
  const [pesanSukses, setPesanSukses] = useState("");

  const daftarKelas = prodi ? data.kelas.filter((k) => k.prodi === prodi) : [];
  const daftarMataKuliah = prodi ? data.mataKuliah.filter((m) => m.prodi === prodi) : [];

  const namaDosen = new Map(data.dosen.map((d) => [d.id, d.nama]));
  const namaKelas = new Map(data.kelas.map((k) => [k.id, k.nama]));
  const namaMataKuliah = new Map(data.mataKuliah.map((m) => [m.id, m.nama]));

  const gagal = (pesan: string) => {
    setPesanError(pesan);
    setPesanSukses("");
  };

  const pilihMataKuliah = (id: string) => {
    setMataKuliahId(id);
    const mk = data.mataKuliah.find((m) => m.id === id);
    if (mk) setSks(String(mk.sks));
  };

  const simpan = (event: FormEvent) => {
    event.preventDefault();
    if (!dosenId) return gagal("Dosen wajib dipilih.");
    if (!prodi) return gagal("Program studi wajib dipilih.");
    if (!kelasId) return gagal("Kelas wajib dipilih.");
    if (!mataKuliahId) return gagal("Mata kuliah wajib dipilih.");
    if (!tanggal) return gagal("Tanggal wajib diisi.");
    const sksAngka = Number(sks);
    if (!sks || Number.isNaN(sksAngka) || sksAngka <= 0) {
      return gagal("SKS pertemuan harus berupa angka lebih dari 0.");
    }

    tambah("pertemuan", {
      id: crypto.randomUUID(),
      dosenId,
      prodi,
      kelasId,
      mataKuliahId,
      tanggal,
      metode,
      sks: sksAngka,
    });
    setPesanError("");
    setPesanSukses("Pertemuan berhasil dicatat.");
    // Dosen dan program studi dipertahankan agar input berturut-turut lebih cepat.
    setKelasId("");
    setMataKuliahId("");
    setTanggal("");
    setSks("");
  };

  const daftarTerurut = [...data.pertemuan].sort((a, b) =>
    b.tanggal.localeCompare(a.tanggal),
  );

  return (
    <PageShell
      title="Input Mengajar"
      description="Catat setiap pertemuan mengajar dosen."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Form Pertemuan Mengajar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={simpan} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Dosen</Label>
              {data.dosen.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada dosen.{" "}
                  <Link to="/dosen" className="text-primary underline">
                    Tambah dosen
                  </Link>{" "}
                  terlebih dahulu.
                </p>
              ) : (
                <Select value={dosenId || undefined} onValueChange={setDosenId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih dosen" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.dosen.map((dosen) => (
                      <SelectItem key={dosen.id} value={dosen.id}>
                        {dosen.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Program Studi</Label>
              <Select
                value={prodi || undefined}
                onValueChange={(nilai) => {
                  setProdi(nilai as Prodi);
                  setKelasId("");
                  setMataKuliahId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih program studi" />
                </SelectTrigger>
                <SelectContent>
                  {PRODI_LIST.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Kelas</Label>
              {!prodi ? (
                <p className="text-sm text-muted-foreground">Pilih program studi terlebih dahulu.</p>
              ) : daftarKelas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada kelas untuk prodi ini.{" "}
                  <Link to="/kelas" className="text-primary underline">
                    Tambah kelas
                  </Link>
                  .
                </p>
              ) : (
                <Select value={kelasId || undefined} onValueChange={setKelasId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {daftarKelas.map((kelas) => (
                      <SelectItem key={kelas.id} value={kelas.id}>
                        {kelas.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Mata Kuliah</Label>
              {!prodi ? (
                <p className="text-sm text-muted-foreground">Pilih program studi terlebih dahulu.</p>
              ) : daftarMataKuliah.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada mata kuliah untuk prodi ini.{" "}
                  <Link to="/mata-kuliah" className="text-primary underline">
                    Tambah mata kuliah
                  </Link>
                  .
                </p>
              ) : (
                <Select
                  value={mataKuliahId || undefined}
                  onValueChange={pilihMataKuliah}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih mata kuliah" />
                  </SelectTrigger>
                  <SelectContent>
                    {daftarMataKuliah.map((mk) => (
                      <SelectItem key={mk.id} value={mk.id}>
                        {mk.kode ? `${mk.kode} — ${mk.nama}` : mk.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pertemuan-tanggal">Tanggal</Label>
              <Input
                id="pertemuan-tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Metode</Label>
              <RadioGroup
                value={metode}
                onValueChange={(nilai) => setMetode(nilai as Metode)}
                className="flex gap-4 pt-1"
              >
                {METODE_LIST.map((m) => (
                  <div key={m} className="flex items-center gap-2">
                    <RadioGroupItem value={m} id={`metode-${m.toLowerCase()}`} />
                    <Label htmlFor={`metode-${m.toLowerCase()}`} className="font-normal">
                      {m}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pertemuan-sks">SKS Pertemuan</Label>
              <Input
                id="pertemuan-sks"
                type="number"
                min={1}
                value={sks}
                onChange={(e) => setSks(e.target.value)}
                placeholder="Otomatis mengikuti mata kuliah"
              />
            </div>

            <div className="flex items-end">
              {pesanError ? (
                <p className="text-sm text-destructive">{pesanError}</p>
              ) : pesanSukses ? (
                <p className="text-sm text-primary">{pesanSukses}</p>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <Button type="submit">
                Simpan Pertemuan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Daftar Pertemuan Tercatat</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No.</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Dosen</TableHead>
                <TableHead>Program Studi</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>SKS</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daftarTerurut.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    Belum ada pertemuan yang tercatat.
                  </TableCell>
                </TableRow>
              ) : (
                daftarTerurut.map((pertemuan, indeks) => (
                  <TableRow key={pertemuan.id}>
                    <TableCell>{indeks + 1}</TableCell>
                    <TableCell>{formatTanggal(pertemuan.tanggal)}</TableCell>
                    <TableCell className="font-medium">
                      {namaDosen.get(pertemuan.dosenId) ?? "-"}
                    </TableCell>
                    <TableCell>{pertemuan.prodi}</TableCell>
                    <TableCell>{namaKelas.get(pertemuan.kelasId) ?? "-"}</TableCell>
                    <TableCell>{namaMataKuliah.get(pertemuan.mataKuliahId) ?? "-"}</TableCell>
                    <TableCell>{pertemuan.metode}</TableCell>
                    <TableCell>{pertemuan.sks}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Hapus pertemuan"
                        onClick={() => {
                          if (window.confirm("Hapus pertemuan ini?")) {
                            hapus("pertemuan", pertemuan.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  );
}
