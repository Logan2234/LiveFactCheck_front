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
