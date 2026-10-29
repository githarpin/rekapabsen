import { Link, useRouterState } from "@tanstack/react-router";

import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavLinks({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const aktif = isActive(pathname, item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
              aktif
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AppSidebar() {
  return (
    <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-bold text-sidebar-primary-foreground">
          AZ
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Sistem Rekap Mengajar</p>
          <p className="truncate text-xs text-sidebar-foreground/70">
            Fakultas Vokasi Institut Az Zuhra
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <NavLinks orientation="vertical" />
      </nav>
      <p className="px-5 pb-4 text-[11px] leading-snug text-sidebar-foreground/60">
        D3 Manajemen Informatika &amp; D3 Teknik Komputer
      </p>
    </aside>
  );
}

export function AppMobileBar() {
  return (
    <div className="no-print sticky top-0 z-30 bg-sidebar text-sidebar-foreground lg:hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          AZ
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Sistem Rekap Mengajar</p>
          <p className="truncate text-[11px] text-sidebar-foreground/70">
            Fakultas Vokasi Institut Az Zuhra
          </p>
        </div>
      </div>
      <nav className="flex gap-1.5 overflow-x-auto px-3 pb-3">
        <NavLinks orientation="horizontal" />
      </nav>
    </div>
  );
}
