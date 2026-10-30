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
import { PRODI_LIST, type Kelas, type Prodi } from "@/lib/types";

export const Route = createFileRoute("/kelas")({
  head: () => ({
    meta: [
      { title: "Data Kelas — Sistem Rekap Mengajar" },
      {
        name: "description",
        content: "Kelola kelas D3 Manajemen Informatika dan D3 Teknik Komputer.",
      },
      { property: "og:title", content: "Data Kelas — Sistem Rekap Mengajar" },
      { property: "og:description", content: "Kelola kelas Fakultas Vokasi Institut Az Zuhra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DataKelasPage,
});

function DataKelasPage() {
  const { data, tambah, ubah, hapus } = useAppData();
  const [nama, setNama] = useState("");
  const [prodi, setProdi] = useState<Prodi | "">("");
  const [idEdit, setIdEdit] = useState<string | null>(null);
  const [pesanError, setPesanError] = useState("");

  const kosongkanForm = () => {
    setNama("");
    setProdi("");
    setIdEdit(null);
    setPesanError("");
  };

  const mulaiEdit = (kelas: Kelas) => {
    setNama(kelas.nama);
    setProdi(kelas.prodi);
    setIdEdit(kelas.id);
    setPesanError("");
  };

  const simpan = (event: FormEvent) => {
    event.preventDefault();
    if (!nama.trim()) {
      setPesanError("Nama kelas wajib diisi.");
      return;
    }
    if (!prodi) {
      setPesanError("Program studi wajib dipilih.");
      return;
    }
    if (idEdit) {
      ubah("kelas", idEdit, { nama: nama.trim(), prodi });
    } else {
      tambah("kelas", { id: crypto.randomUUID(), nama: nama.trim(), prodi });
    }
    kosongkanForm();
  };

  return (
    <PageShell title="Data Kelas" description="Kelola daftar kelas per program studi.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{idEdit ? "Ubah Kelas" : "Tambah Kelas"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={simpan} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="kelas-nama">Nama Kelas</Label>
                <Input
                  id="kelas-nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="cth. MI-1A"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Program Studi</Label>
                <Select
                  value={prodi}
                  onValueChange={(nilai) => setProdi(nilai as Prodi)}
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
            <CardTitle className="text-base">Daftar Kelas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>Nama Kelas</TableHead>
                  <TableHead>Program Studi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.kelas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Belum ada data kelas.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.kelas.map((kelas, indeks) => (
                    <TableRow key={kelas.id}>
                      <TableCell>{indeks + 1}</TableCell>
                      <TableCell className="font-medium">{kelas.nama}</TableCell>
                      <TableCell>{kelas.prodi}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Ubah ${kelas.nama}`}
                            onClick={() => mulaiEdit(kelas)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Hapus ${kelas.nama}`}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Hapus kelas ${kelas.nama}? Pertemuan mengajar yang terkait juga akan terhapus.`,
                                )
                              ) {
                                hapus("kelas", kelas.id);
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
