/**
 * Konfigurasi Ambang Batas Otorisasi Satuan Pengawas Internal (SPI)
 * CD'E Pearls Lombok
 *
 * Setiap aksi administratif yang melampaui ambang batas berikut
 * wajib memerlukan persetujuan formal dari SPI sebelum dieksekusi.
 */

export const APPROVAL_RULES = {
  /** Batas persentase perubahan harga produk yang memerlukan persetujuan SPI (%) */
  PRICE_CHANGE_PERCENT_THRESHOLD: 10,

  /** Batas nominal absolut perubahan harga produk yang memerlukan persetujuan SPI (Rp) */
  PRICE_CHANGE_NOMINAL_THRESHOLD: 2000000,

  /** Batas diskon maksimum tanpa persetujuan SPI (%) */
  DISCOUNT_PERCENT_THRESHOLD: 15,
} as const;

/**
 * Mengecek apakah perubahan harga membutuhkan otorisasi SPI.
 * @param oldPrice Harga lama (angka nominal dalam IDR)
 * @param newPrice Harga baru yang diajukan (angka nominal dalam IDR)
 * @returns boolean
 */
export function requiresPriceApproval(oldPrice: number, newPrice: number): boolean {
  if (oldPrice <= 0) return false;
  const priceDiffAbsolute = Math.abs(newPrice - oldPrice);
  const priceDiffPercent = (priceDiffAbsolute / oldPrice) * 100;
  return (
    priceDiffPercent > APPROVAL_RULES.PRICE_CHANGE_PERCENT_THRESHOLD ||
    priceDiffAbsolute > APPROVAL_RULES.PRICE_CHANGE_NOMINAL_THRESHOLD
  );
}

/**
 * Mengecek apakah diskon yang diberikan membutuhkan otorisasi SPI.
 * @param discountPercent Persentase diskon yang diberikan (%)
 * @returns boolean
 */
export function requiresDiscountApproval(discountPercent: number): boolean {
  return discountPercent > APPROVAL_RULES.DISCOUNT_PERCENT_THRESHOLD;
}

