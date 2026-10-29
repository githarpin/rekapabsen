import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  PenLine,
  Printer,
  School,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dosen", label: "Data Dosen", icon: Users },
  { to: "/mata-kuliah", label: "Data Mata Kuliah", icon: BookOpen },
  { to: "/kelas", label: "Data Kelas", icon: School },
  { to: "/input-mengajar", label: "Input Mengajar", icon: PenLine },
  { to: "/rekap", label: "Rekap Mengajar", icon: ClipboardList },
];
