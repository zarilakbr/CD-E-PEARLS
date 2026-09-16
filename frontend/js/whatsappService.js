/**
 * WHATSAPP SERVICE - CDE PEARLS
 * Mengelola komunikasi dinamis, konsultasi produk, dan pemesanan WhatsApp
 * Nomor WhatsApp diambil langsung dari pengaturan (tidak di-hardcode).
 */

const whatsappService = {
  getAdminNumber() {
    if (typeof window !== 'undefined' && window.CDEStore && typeof window.CDEStore.getSettings === 'function') {
      const settings = window.CDEStore.getSettings();
      if (settings && settings.whatsappNumber) {
        return settings.whatsappNumber.replace(/\D/g, '');
      }
    }
    // Default fallback yang tersentralisasi
    return '6281239887766';
  },

  /**
   * Menghasilkan pesan konsultasi produk sesuai spesifikasi:
   * "Halo Admin, saya tertarik dengan produk [PRODUCT_NAME]. Apakah produk ini masih tersedia?"
   */
  generateProductConsultationMessage(product) {
    if (!product) return '';
    const productName = typeof product === 'string' ? product : (product.name || 'Perhiasan Mutiara CD\'E Pearls');
    const store = typeof window !== 'undefined' ? window.CDEStore : null;
    const priceText = product.price ? `\n(Ref Harga: ${store && typeof store.formatRupiah === 'function' ? store.formatRupiah(product.price) : 'Rp ' + Number(product.price).toLocaleString('id-ID')})` : '';
    const codeText = product.id ? ` [Kode: ${product.id}]` : '';

    return `Halo Admin, saya tertarik dengan produk *${productName}*${codeText}.${priceText}\nApakah produk ini masih tersedia?`;
  },

  /**
   * Menghasilkan pesan WhatsApp Checkout lengkap terstruktur:
   * - Order ID
   * - Nama customer
   * - Produk
   * - Quantity
   * - Harga
   * - Subtotal
   * - Alamat
   * - Catatan
   * - Total
   */
  generateOrderMessage(order) {
    if (!order) return '';

    const formatIdr = (val) => {
      const store = typeof window !== 'undefined' ? window.CDEStore : null;
      if (store && typeof store.formatRupiah === 'function') {
        return store.formatRupiah(val);
      }
      return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
    };

    let itemsDetail = '';
    if (Array.isArray(order.items)) {
      order.items.forEach((item, idx) => {
        const itemSpec = item.spec || item.pearlType || 'Mutiara Laut Asli Lombok';
        itemsDetail += `\n${idx + 1}. *${item.name}* (x${item.qty})\n   • Spesifikasi: ${itemSpec}\n   • Harga: ${formatIdr(item.price * item.qty)}`;
      });
    }

    const subtotalVal = order.subtotal || (order.total - (order.insurance || 0));
    const insuranceVal = order.insurance || 0;
    const discountVal = order.discount || 0;

    const message = 
`*PESANAN RESMI PERHIASAN MUTIARA CD'E PEARLS LOMBOK*
━━━━━━━━━━━━━━━━━━━━━
*Order ID:* ${order.id}
*Tanggal:* ${order.date || new Date().toLocaleString('id-ID')}

*DATA CUSTOMER:*
• Nama Lengkap: *${order.customerName}*
• No. WhatsApp: ${order.phone}
• Alamat Pengiriman: ${order.address}
• Ekspedisi: ${order.courier || 'JNE YES Berasuransi Nilai Penuh'}
${order.notes ? `• Catatan Khusus: _${order.notes}_\n` : ''}
*RINCIAN PRODUK:*${itemsDetail}

━━━━━━━━━━━━━━━━━━━━━
• Subtotal: ${formatIdr(subtotalVal)}
${discountVal > 0 ? `• Diskon Kupon: -${formatIdr(discountVal)}\n` : ''}• Asuransi Laut & Pengiriman: ${formatIdr(insuranceVal)}
• Sertifikat Keaslian Gemologi: *GRATIS (Sertifikat Lab Resmi)*
• *TOTAL INVESTASI:* *${formatIdr(order.total)}*
━━━━━━━━━━━━━━━━━━━━━
Status Pembayaran: *WAITING_PAYMENT*
Status Pesanan: *PENDING*

Halo Concierge CD'E Pearls, mohon konfirmasi pesanan saya dan informasi rekening resmi boutique untuk pembayaran. Terima kasih!`;

    return message;
  },

  /**
   * Membuka deep link WhatsApp dengan pesan terenkripsi
   */
  openWhatsApp(messageText, customNumber = null) {
    const phone = customNumber || this.getAdminNumber();
    const encoded = encodeURIComponent(messageText || '');
    const url = `https://wa.me/${phone}?text=${encoded}`;
    
    // Log lead ke store jika CDEStore tersedia
    if (typeof window !== 'undefined' && window.CDEStore && typeof window.CDEStore.logWhatsAppLead === 'function') {
      window.CDEStore.logWhatsAppLead({
        phone,
        messageSnippet: messageText ? messageText.substring(0, 100) : '',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return url;
  }
};

if (typeof window !== 'undefined') {
  window.whatsappService = whatsappService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = whatsappService;
}
