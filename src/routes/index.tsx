import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ClipboardList, PenLine, Printer, School, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/lib/store";
import { namaBulan } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Sistem Rekap Mengajar" },
      {
        name: "description",
        content:
          "Ringkasan data dosen, mata kuliah, kelas, dan pertemuan mengajar Fakultas Vokasi Institut Az Zuhra.",
      },
      { property: "og:title", content: "Dashboard — Sistem Rekap Mengajar" },
      {
        property: "og:description",
        content: "Ringkasan data mengajar dosen Fakultas Vokasi Institut Az Zuhra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function StatCard({ label, nilai, icon: Icon, to }: { label: string; nilai: number; icon: LucideIcon; to: string }) {
  return (
    <Link to={to} className="block">
      <Card className="h-full transition-colors hover:bg-accent/60">
        <CardContent className="flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-foreground">{nilai}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardPage() {
  const { data } = useAppData();

  const sekarang = new Date();
  const kunciBulanIni = `${sekarang.getFullYear()}-${String(sekarang.getMonth() + 1).padStart(2, "0")}`;
  const totalSksBulanIni = data.pertemuan
    .filter((p) => p.tanggal.startsWith(kunciBulanIni))
    .reduce((total, p) => total + p.sks, 0);

  const statistik = [
    { label: "Dosen", nilai: data.dosen.length, icon: Users, to: "/dosen" },
    { label: "Mata Kuliah", nilai: data.mataKuliah.length, icon: BookOpen, to: "/mata-kuliah" },
    { label: "Kelas", nilai: data.kelas.length, icon: School, to: "/kelas" },
    { label: "Pertemuan", nilai: data.pertemuan.length, icon: ClipboardList, to: "/input-mengajar" },
  ];

  return (
    <PageShell
      title="Dashboard"
      description="Sistem Rekap Mengajar Dosen Fakultas Vokasi Institut Az Zuhra"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statistik.map((item) => (
          <StatCard key={item.to} {...item} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Total SKS bulan {namaBulan(sekarang.getMonth() + 1)} {sekarang.getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{totalSksBulanIni}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              SKS pertemuan yang tercatat bulan ini.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Menu Cepat</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/input-mengajar">
                <PenLine className="h-4 w-4" /> Input Mengajar
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/rekap">
                <Printer className="h-4 w-4" /> Rekap Mengajar
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="p-5 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Penyimpanan:</span> data tersimpan
          permanen di Lovable Cloud, sehingga bisa diakses dari perangkat mana pun yang membuka
          aplikasi ini. Pertukaran data antar pengguna terjadi saat halaman dimuat ulang.
        </CardContent>
      </Card>
    </PageShell>
  );
}
