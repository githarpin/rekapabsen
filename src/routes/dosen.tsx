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
import { PRODI_LIST, type Prodi } from "@/lib/types";

export const Route = createFileRoute("/dosen")({
  head: () => ({
    meta: [
      { title: "Data Dosen — Sistem Rekap Mengajar" },
      {
        name: "description",
        content: "Kelola data dosen D3 Manajemen Informatika dan D3 Teknik Komputer.",
      },
      { property: "og:title", content: "Data Dosen — Sistem Rekap Mengajar" },
      {
        property: "og:description",
        content: "Kelola data dosen Fakultas Vokasi Institut Az Zuhra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DataDosenPage,
});

function DataDosenPage() {
  const { data, tambah, ubah, hapus } = useAppData();
  const [nama, setNama] = useState("");
  const [nidn, setNidn] = useState("");
  const [prodi, setProdi] = useState<Prodi | "">("");
  const [idEdit, setIdEdit] = useState<string | null>(null);
  const [pesanError, setPesanError] = useState("");

  const kosongkanForm = () => {
    setNama("");
    setNidn("");
    setProdi("");
    setIdEdit(null);
    setPesanError("");
  };

  const mulaiEdit = (id: string, namaDosen: string, nidnDosen: string, prodiDosen: Prodi) => {
    setNama(namaDosen);
    setNidn(nidnDosen);
    setProdi(prodiDosen);
    setIdEdit(id);
    setPesanError("");
  };

  const simpan = (event: FormEvent) => {
    event.preventDefault();
    if (!nama.trim()) {
      setPesanError("Nama dosen wajib diisi.");
      return;
    }
    if (!prodi) {
      setPesanError("Program studi wajib dipilih.");
      return;
    }
    if (idEdit) {
      ubah("dosen", idEdit, { nama: nama.trim(), nidn: nidn.trim(), prodi });
    } else {
      tambah("dosen", {
        id: crypto.randomUUID(),
        nama: nama.trim(),
        nidn: nidn.trim(),
        prodi,
      });
    }
    kosongkanForm();
  };

  return (
    <PageShell
      title="Data Dosen"
      description="Kelola daftar dosen untuk kedua program studi."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {idEdit ? "Ubah Dosen" : "Tambah Dosen"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={simpan} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="dosen-nama">Nama Dosen</Label>
                <Input
                  id="dosen-nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="cth. Budi Santoso"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dosen-nidn">NIDN</Label>
                <Input
                  id="dosen-nidn"
                  value={nidn}
                  onChange={(e) => setNidn(e.target.value)}
                  placeholder="cth. 0012345678"
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
            <CardTitle className="text-base">Daftar Dosen</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>NIDN</TableHead>
                  <TableHead>Nama Dosen</TableHead>
                  <TableHead>Program Studi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.dosen.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Belum ada data dosen.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.dosen.map((dosen, indeks) => (
                    <TableRow key={dosen.id}>
                      <TableCell>{indeks + 1}</TableCell>
                      <TableCell>{dosen.nidn || "-"}</TableCell>
                      <TableCell className="font-medium">{dosen.nama}</TableCell>
                      <TableCell>{dosen.prodi}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Ubah ${dosen.nama}`}
                            onClick={() => mulaiEdit(dosen.id, dosen.nama, dosen.nidn, dosen.prodi)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Hapus ${dosen.nama}`}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Hapus dosen ${dosen.nama}? Pertemuan mengajar yang terkait juga akan terhapus.`,
                                )
                              ) {
                                hapus("dosen", dosen.id);
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
