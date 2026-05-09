const MONTHS_LONG = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export function formatDateId(date: string, style: "numeric" | "short" | "long" = "numeric") {
  const [year = "", month = "1", day = "1"] = date.split("T")[0].split("-");
  const monthIndex = Math.max(0, Math.min(11, Number(month) - 1));
  const dayNumber = Number(day);

  if (style === "long") return `${dayNumber} ${MONTHS_LONG[monthIndex]} ${year}`;
  if (style === "short") return `${dayNumber} ${MONTHS_SHORT[monthIndex]} ${year}`;

  return `${dayNumber}/${Number(month)}/${year}`;
}
