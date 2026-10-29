import { format, parseISO } from "date-fns";
import { id as localeIndonesia } from "date-fns/locale";

export function formatTanggal(iso: string): string {
  const tanggal = parseISO(iso);
  if (Number.isNaN(tanggal.getTime())) return iso;
  return format(tanggal, "d MMMM yyyy", { locale: localeIndonesia });
}
