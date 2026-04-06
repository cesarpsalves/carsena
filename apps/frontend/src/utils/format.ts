/**
 * Utility for standardizing monetary and numerical formatting in PT-BR.
 */

/**
 * Formats a number as BRL currency (R$ 0.000,00)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formats a number with thousands separators (0.000,00)
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Formats bytes to human-readable size (KB, MB, GB, etc.)
 */
export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formats a date string to PT-BR standard (DD/MM/YYYY)
 */
export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return '--/--/----';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('pt-BR').format(date);
};
