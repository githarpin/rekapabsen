import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
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
import { cocokkanPertemuan, type HasilBacaFoto } from "@/lib/absensi";
import { bacaFotoAbsensi } from "@/lib/absensi.functions";
import { formatTanggal } from "@/lib/format";
import { siapkanFoto, type FotoSiap } from "@/lib/foto";
import { useAppData } from "@/lib/store";
import { METODE_LIST, PRODI_LIST, type Metode, type Prodi } from "@/lib/types";

export const Route = createFileRoute("/input-mengajar")({
  head: () => ({
    meta: [
      { title: "Input Mengajar — Sistem Rekap Mengajar" },
      {
        name: "description",
        content: "Catat pertemuan mengajar dosen, lengkap dengan foto absensi dan isian otomatis AI.",
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

// Pratinjau foto absensi tersimpan: ambil tautan sementara dari penyimpanan.
function FotoAbsensiThumb({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    supabase.storage
      .from("foto-absensi")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!batal && data) setUrl(data.signedUrl);
      });
    return () => {
      batal = true;
    };
  }, [path]);

  if (!url) {
    return <Camera className="h-4 w-4 text-muted-foreground" aria-label="Foto absensi tersimpan" />;
  }
  return (
    <img
      src={url}
      alt="Foto absensi pertemuan"
      className="h-12 w-12 rounded-md border object-cover"
    />
  );
}

function InputMengajarPage() {
  const { data, tambah } = useAppData();
  const bacaFotoFn = useServerFn(bacaFotoAbsensi);

  const [dosenId, setDosenId] = useState("");
  const [prodi, setProdi] = useState<Prodi | "">("");
  const [kelasId, setKelasId] = useState("");
  const [mataKuliahId, setMataKuliahId] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [metode, setMetode] = useState<Metode>("Teori");
  const [sks, setSks] = useState("");
  const [pesanError, setPesanError] = useState("");
  const [pesanSukses, setPesanSukses] = useState("");

  const [foto, setFoto] = useState<FotoSiap | null>(null);
  const [sedangBaca, setSedangBaca] = useState(false);
  const [infoFoto, setInfoFoto] = useState("");

  const daftarKelas = prodi ? data.kelas.filter((k) => k.prodi === prodi) : [];
  const daftarMataKuliah = prodi ? data.mataKuliah.filter((m) => m.prodi === prodi) : [];

  const namaDosen = new Map(data.dosen.map((d) => [d.id, d.nama]));
  const namaKelas = new Map(data.kelas.map((k) => [k.id, k.nama]));
  const namaMataKuliah = new Map(data.mataKuliah.map((m) => [m.id, m.nama]));

  const gagal = (pesan: string) => {
    setPesanError(pesan);
    setPesanSukses("");
  };

  const pilihFoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const berkas = event.target.files?.[0];
    event.target.value = "";
    if (!berkas) return;
    if (!berkas.type.startsWith("image/")) {
      return gagal("Berkas harus berupa foto (gambar).");
    }
    setPesanError("");
    setInfoFoto("");
    const siap = await siapkanFoto(berkas);
    setFoto(siap);
  };

  const buangFoto = () => {
    setFoto(null);
    setInfoFoto("");
  };

  const isiOtomatis = async () => {
    if (!foto) return;
    setSedangBaca(true);
    setPesanError("");
    setPesanSukses("");
    try {
      const jawaban = await bacaFotoFn({ data: { foto: foto.dataUrl } });
      if (!jawaban.ok) {
        setInfoFoto("");
        return gagal(`Gagal membaca foto: ${jawaban.pesan}`);
      }
      const hasil: HasilBacaFoto = jawaban.hasil;
      const cocok = cocokkanPertemuan(hasil, {
        dosen: data.dosen,
        kelas: data.kelas,
        mataKuliah: data.mataKuliah,
      });

      if (cocok.prodi) setProdi(cocok.prodi);
      if (cocok.dosenId) setDosenId(cocok.dosenId);
      if (cocok.kelasId) setKelasId(cocok.kelasId);
      if (cocok.mataKuliahId) setMataKuliahId(cocok.mataKuliahId);
      if (cocok.tanggal) setTanggal(cocok.tanggal);
      if (cocok.metode) setMetode(cocok.metode);
      if (cocok.sks) setSks(String(cocok.sks));

      const terisi: string[] = [];
      if (cocok.dosenId) terisi.push("dosen");
      if (cocok.kelasId) terisi.push("kelas");
      if (cocok.mataKuliahId) terisi.push("mata kuliah");
      if (cocok.tanggal) terisi.push("tanggal");
      if (cocok.metode) terisi.push("metode");
      if (cocok.sks) terisi.push("SKS");

      const tidakAda: string[] = [];
      if (hasil.namaDosen && !cocok.dosenId) tidakAda.push(`dosen "${hasil.namaDosen}"`);
      if (hasil.namaKelas && !cocok.kelasId) tidakAda.push(`kelas "${hasil.namaKelas}"`);
      if (hasil.namaMataKuliah && !cocok.mataKuliahId) tidakAda.push(`mata kuliah "${hasil.namaMataKuliah}"`);

      let pesan = terisi.length
        ? `Foto terbaca. Terisi otomatis: ${terisi.join(", ")}.`
        : "Foto terbaca, tetapi tidak ada data yang dikenali.";
      if (tidakAda.length) {
        pesan += ` Belum ada di data master: ${tidakAda.join(", ")} — lengkapi manual.`;
      }
      setInfoFoto(pesan);
    } finally {
      setSedangBaca(false);
    }
  };

  const simpan = async (event: FormEvent) => {
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

    // Unggah foto (bila ada) sebelum menyimpan pertemuan.
    let fotoUrl: string | null = null;
    let peringatanFoto = "";
    if (foto) {
      const path = `${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage
        .from("foto-absensi")
        .upload(path, foto.blob, { contentType: "image/jpeg" });
      if (error) {
        console.error("Gagal mengunggah foto absensi:", error);
        peringatanFoto = "Pertemuan tersimpan, tetapi foto gagal diunggah.";
      } else {
        fotoUrl = path;
      }
    }

    await tambah("pertemuan", {
      id: crypto.randomUUID(),
      dosenId,
      prodi,
      kelasId,
      mataKuliahId,
      tanggal,
      metode,
      sks: sksAngka,
      fotoUrl,
    });
    setPesanError("");
    setPesanSukses(peringatanFoto || "Pertemuan berhasil dicatat.");
    setFoto(null);
    setInfoFoto("");
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
      description="Catat setiap pertemuan mengajar dosen, bisa diisi otomatis dari foto absensi."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Foto Absensi (opsional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-start gap-4">
            {foto ? (
              <img
                src={foto.dataUrl}
                alt="Pratinjau foto absensi"
                className="h-32 w-auto max-w-[220px] rounded-md border object-cover"
              />
            ) : (
              <div className="flex h-32 w-48 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                <Camera className="h-6 w-6" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Label
                  htmlFor="foto-absensi"
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent"
                >
                  <Camera className="h-4 w-4" />
                  Pilih Foto
                </Label>
                <input
                  id="foto-absensi"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={pilihFoto}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={isiOtomatis}
                  disabled={!foto || sedangBaca}
                >
                  {sedangBaca ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Isi Otomatis dari Foto
                </Button>
                {foto ? (
                  <Button type="button" variant="ghost" size="icon" aria-label="Buang foto" onClick={buangFoto}>
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              <p className="max-w-md text-sm text-muted-foreground">
                Unggah foto lembar absensi, lalu tekan Isi Otomatis untuk membaca dosen, kelas,
                mata kuliah, tanggal, metode, dan SKS. Periksa kembali isian sebelum menyimpan.
              </p>
              {infoFoto ? <p className="max-w-md text-sm text-primary">{infoFoto}</p> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
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
                <Select value={dosenId} onValueChange={setDosenId}>
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
                value={prodi}
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
                <Select value={kelasId} onValueChange={setKelasId}>
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
                  value={mataKuliahId}
                  onValueChange={(id) => {
                    setMataKuliahId(id);
                    const mk = data.mataKuliah.find((m) => m.id === id);
                    if (mk) setSks(String(mk.sks));
                  }}
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
                <TableHead>Foto</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daftarTerurut.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
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
                    <TableCell>
                      {pertemuan.fotoUrl ? <FotoAbsensiThumb path={pertemuan.fotoUrl} /> : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Hapus pertemuan"
                        onClick={() => {
                          if (window.confirm("Hapus pertemuan ini?")) {
                            void supabase.storage.from("foto-absensi").remove([pertemuan.fotoUrl]);
                            tambahHapusPertemuan(pertemuan.id);
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

  function tambahHapusPertemuan(id: string) {
    // dipanggil setelah konfirmasi hapus
    void hapusPertemuan(id);
  }

  async function hapusPertemuan(id: string) {
    await hapus("pertemuan", id);
  }

  // hapus dari konteks
  function hapusRef() {
    return hapus;
  }

  function hapus(...args: Parameters<ReturnType<typeof useAppData>["hapus"]>) {
    return hapusKonteks(...args);
  }

  const hapusKonteks = hapusDariKonteks;
  function hapusDariKonteks(
    koleksi: Parameters<ReturnType<typeof useAppData>["hapus"]>[0],
    id: string,
  ) {
    return hapusFn(koleksi, id);
  }

  const hapusFn = useAppData().hapus;
}

// Kembalikan foto absensi bersama pertemuan; foto ikut terhapus bersama barisnya.
