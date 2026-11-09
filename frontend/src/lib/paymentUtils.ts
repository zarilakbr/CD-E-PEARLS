export interface PaymentItem {
  id?: number | string;
  order_id?: number | string;
  status?: string;
  proof_path?: string;
  notes?: string;
  amount?: number | string;
  payment_method?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  [key: string]: any;
}

/**
 * Memilih objek pembayaran terbaru dari daftar payments pesanan.
 * Kriteria pemilihan:
 * 1. Timestamp created_at terbaru jika valid dan berbeda.
 * 2. Nilai ID terbesar jika created_at sama atau tidak tersedia.
 * 3. Mengembalikan null bila daftar kosong, null, atau bukan array.
 */
export function getLatestPayment<T extends PaymentItem = PaymentItem>(
  payments?: T[] | null
): T | null {
  if (!Array.isArray(payments) || payments.length === 0) {
    return null;
  }

  if (payments.length === 1) {
    return payments[0];
  }

  return payments.reduce<T>((latest, current) => {
    if (!latest) return current;
    if (!current) return latest;

    // 1. Evaluasi perbandingan timestamp created_at
    const timeCurrent = current.created_at ? new Date(current.created_at).getTime() : NaN;
    const timeLatest = latest.created_at ? new Date(latest.created_at).getTime() : NaN;

    if (!isNaN(timeCurrent) && !isNaN(timeLatest) && timeCurrent !== timeLatest) {
      return timeCurrent > timeLatest ? current : latest;
    }

    // 2. Evaluasi perbandingan ID numerik
    const idCurrent = Number(current.id);
    const idLatest = Number(latest.id);

    if (!isNaN(idCurrent) && !isNaN(idLatest)) {
      return idCurrent > idLatest ? current : latest;
    }

    return latest;
  }, payments[0]);
}

export default getLatestPayment;

