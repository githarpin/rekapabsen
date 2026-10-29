import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAppData } from "@/lib/store";
import { PRODI_LIST, type MataKuliah, type Prodi } from "@/lib/types";

export const Route = createFileRoute("/mata-kuliah")({
  head: () => ({
    meta: [
      { title: "Data Mata Kuliah — Sistem Rekap Mengajar" },
      {
        name: "description",
        content: "Kelola mata kuliah D3 Manajemen Informatika dan D3 Teknik Komputer.",
      },
      { property: "og:title", content: "Data Mata Kuliah — Sistem Rekap Mengajar" },
      {
        property: "og:description",
        content: "Kelola mata kuliah Fakultas Vokasi Institut Az Zuhra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DataMataKuliahPage,
});

function DataMataKuliahPage() {
  const { data, tambah, ubah, hapus } = useAppData();
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [sks, setSks] = useState("");
  const [prodi, setProdi] = useState<Prodi | "">("");
  const [idEdit, setIdEdit] = useState<string | null>(null);
  const [pesanError, setPesanError] = useState("");

  const kosongkanForm = () => {
    setKode("");
    setNama("");
    setSks("");
    setProdi("");
    setIdEdit(null);
    setPesanError("");
  };

  const mulaiEdit = (mk: MataKuliah) => {
    setKode(mk.kode);
    setNama(mk.nama);
    setSks(String(mk.sks));
    setProdi(mk.prodi);
    setIdEdit(mk.id);
    setPesanError("");
  };

  const simpan = (event: FormEvent) => {
    event.preventDefault();
    const sksAngka = Number(sks);
    if (!nama.trim()) {
      setPesanError("Nama mata kuliah wajib diisi.");
      return;
    }
    if (!sks || Number.isNaN(sksAngka) || sksAngka <= 0) {
      setPesanError("SKS harus berupa angka lebih dari 0.");
      return;
    }
    if (!prodi) {
      setPesanError("Program studi wajib dipilih.");
      return;
    }
    if (idEdit) {
      ubah("mataKuliah", idEdit, {
        kode: kode.trim(),
        nama: nama.trim(),
        sks: sksAngka,
        prodi,
      });
    } else {
      tambah("mataKuliah", {
        id: crypto.randomUUID(),
        kode: kode.trim(),
        nama: nama.trim(),
        sks: sksAngka,
        prodi,
      });
    }
    kosongkanForm();
  };

  return (
    <PageShell
      title="Data Mata Kuliah"
      description="Kelola daftar mata kuliah beserta bobot SKS-nya."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {idEdit ? "Ubah Mata Kuliah" : "Tambah Mata Kuliah"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={simpan} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="mk-kode">Kode Mata Kuliah</Label>
                <Input
                  id="mk-kode"
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
                  placeholder="cth. MI-201"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mk-nama">Nama Mata Kuliah</Label>
                <Input
                  id="mk-nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="cth. Pemrograman Web"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mk-sks">SKS</Label>
                  <Input
                    id="mk-sks"
                    type="number"
                    min={1}
                    value={sks}
                    onChange={(e) => setSks(e.target.value)}
                    placeholder="cth. 3"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Program Studi</Label>
                  <Select
                    value={prodi || undefined}
                    onValueChange={(nilai) => setProdi(nilai as Prodi)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih" />
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
              </div>
              {pesanError ? <p className="text-sm text-destructive">{pesanError}</p> : null}
              <div className="flex gap-2">
                <Button type="submit">
                  <Plus className="h-4 w-4" /> {idEdit ? "Simpan Perubahan" : "Tambah"}
                </Button>
                {idEdit ? (
                  <Button type="button" variant="outline" onClick={kosongkanForm}>
                    <X className="h-4 w-4" /> Batal
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Mata Kuliah</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Mata Kuliah</TableHead>
                  <TableHead>SKS</TableHead>
                  <TableHead>Program Studi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.mataKuliah.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Belum ada data mata kuliah.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.mataKuliah.map((mk, indeks) => (
                    <TableRow key={mk.id}>
                      <TableCell>{indeks + 1}</TableCell>
                      <TableCell>{mk.kode || "-"}</TableCell>
                      <TableCell className="font-medium">{mk.nama}</TableCell>
                      <TableCell>{mk.sks}</TableCell>
                      <TableCell>{mk.prodi}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Ubah ${mk.nama}`}
                            onClick={() => mulaiEdit(mk)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Hapus ${mk.nama}`}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Hapus mata kuliah ${mk.nama}? Pertemuan mengajar yang terkait juga akan terhapus.`,
                                )
                              ) {
                                hapus("mataKuliah", mk.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
