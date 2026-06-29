type FormatDateOptions = { locale?: string; withSeconds?: boolean };

export const formatDate = (
  dateOrString: string | number | Date,
  { locale = "fr-FR" }: FormatDateOptions = {}
) => {
  const date = new Date(dateOrString);

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
};

export const formatDateTime = (
  dateOrString: string | number | Date,
  { locale = "fr-FR", withSeconds = true }: FormatDateOptions = {}
) => {
  const date = new Date(dateOrString);

  return date.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined
  });
};

export const formatTime = (
  dateOrString: string | number | Date,
  { locale = "fr-FR", withSeconds = true }: FormatDateOptions = {}
) => {
  const date = new Date(dateOrString);

  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined
  });
};

export const formatDuration = (since: number): string => {
  const s = Math.round(Date.now() / 1000 - since);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${s % 60} s`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
};

export const formatUptime = (s: number): string => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

export const formatCost = (usd: number | null, digits = 4): string =>
  usd === null ? "—" : `$${usd.toFixed(digits)}`;

export const formatPercent = (ratio: number, digits = 0): string =>
  `${(ratio * 100).toFixed(digits)} %`;
