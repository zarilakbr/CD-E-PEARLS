/**
 * CD'E PEARLS - SHOPPING CART & WHATSAPP CHECKOUT SCRIPT (v3.0)
 * Mengatur pengelolaan isi keranjang, kupon promo (LOMBOK10, CDEVIP),
 * validasi form pengiriman, pelacakan pesanan instan, modal sertifikat gemologi,
 * dan checkout WhatsApp terstruktur dengan pencatatan status ganda & audit leads.
 */

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  setupCartEvents();
  updateCartBadge();
  updateWishlistBadge();

  window.addEventListener('cde_store_updated', () => {
    renderCart();
    updateCartBadge();
    updateWishlistBadge();
  });
});

function updateCartBadge() {
  const badge = document.getElementById('headerCartBadge');
  if (!badge) return;
  const cart = CDEStore.getCart();
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = totalCount;
  badge.style.display = totalCount > 0 ? 'flex' : 'none';
}

function updateWishlistBadge() {
  const badge = document.getElementById('headerWishlistBadge');
  if (!badge) return;
  const list = CDEStore.getWishlist();
  badge.textContent = list.length;
  badge.style.display = list.length > 0 ? 'flex' : 'none';
}

/* ================== RENDER ISI KERANJANG BELANJA ================== */
function renderCart() {
  const container = document.getElementById('cartItemsList');
  const emptyState = document.getElementById('cartEmptyState');
  const cartContentLayout = document.getElementById('cartContentLayout');
  const cartItemCountLabel = document.getElementById('cartItemCountLabel');

  if (!container) return;

  const cart = CDEStore.getCart();
  const totalSummary = CDEStore.getCartTotal();

  if (cart.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (cartContentLayout) cartContentLayout.style.display = 'none';
    if (cartItemCountLabel) cartItemCountLabel.textContent = '0 Koleksi';
    if (window.LucideHelper) window.LucideHelper.renderAll();
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (cartContentLayout) cartContentLayout.style.display = 'grid';
  if (cartItemCountLabel) cartItemCountLabel.textContent = `${totalSummary.itemCount} Koleksi Terpilih`;

  // Render Daftar Item Belanja
  container.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.cartItemId}">
      <div class="item-thumb">
        <img src="${item.image}" alt="${item.name}" loading="lazy">
      </div>
      <div class="item-info">
        <h4 class="item-name">${item.name}</h4>
        <div class="item-spec-text">
          ${item.customSpec || `${item.pearlType || 'South Sea'} • ${item.pearlGrade || 'Grade AAA'} • ${item.metal || 'Emas 18K'}`}
        </div>
        <div class="item-cert-badge" onclick="viewCertificate('${item.certificate || 'CDE-CERT-8901'}', '${item.name.replace(/'/g, "\\'")}', '${item.pearlType || 'South Sea Pearl'}', '${item.pearlGrade || 'Grade AAA'}', 'Lombok Cultivation')">
          <span data-lucide="award" data-size="14" style="color: #15803D;"></span>
          Sertifikat Gemologi: <strong>${item.certificate || 'CDE Verified'}</strong>
        </div>
      </div>
      <div class="item-price-qty">
        <div class="item-price">${CDEStore.formatRupiah(item.price * item.qty)}</div>
        <div class="qty-control">
          <button class="qty-btn" type="button" onclick="changeQty('${item.cartItemId}', ${item.qty - 1})">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" type="button" onclick="changeQty('${item.cartItemId}', ${item.qty + 1})">+</button>
        </div>
        <button class="btn-remove-item" type="button" onclick="removeItem('${item.cartItemId}')">
          <span data-lucide="x" data-size="12"></span>
          Hapus
        </button>
      </div>
    </div>
  `).join('');

  renderSummary(totalSummary);
  renderAppliedCoupon();

  if (window.LucideHelper) {
    window.LucideHelper.renderAll();
  }
}

/* ================== RENDER RINGKASAN BIAYA ================== */
function renderSummary(totalSummary) {
  const subtotalEl = document.getElementById('summarySubtotal');
  const discountRow = document.getElementById('summaryDiscountRow');
  const discountEl = document.getElementById('summaryDiscount');
  const insuranceEl = document.getElementById('summaryInsurance');
  const grandTotalEl = document.getElementById('summaryGrandTotal');

  if (subtotalEl) subtotalEl.textContent = CDEStore.formatRupiah(totalSummary.subtotal);

  if (discountRow && discountEl) {
    if (totalSummary.discount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `- ${CDEStore.formatRupiah(totalSummary.discount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (insuranceEl) insuranceEl.textContent = CDEStore.formatRupiah(totalSummary.insurance);
  if (grandTotalEl) grandTotalEl.textContent = CDEStore.formatRupiah(totalSummary.grandTotal);
}

function changeQty(cartItemId, newQty) {
  CDEStore.updateCartQty(cartItemId, newQty);
}

function removeItem(cartItemId) {
  CDEStore.removeFromCart(cartItemId);
  showToast('Item perhiasan telah dihapus dari keranjang.');
}

/* ================== SETUP EVENT FORM & KUPON ================== */
function setupCartEvents() {
  const couponForm = document.getElementById('couponForm');
  if (couponForm) {
    couponForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('couponCodeInput');
      if (!input || !input.value.trim()) return;

      const res = CDEStore.applyCoupon(input.value.trim());
      if (res.success) {
        showToast(`Kupon "${res.coupon.code}" (${res.coupon.label}) berhasil diterapkan!`);
        input.value = '';
      } else {
        alert(res.message);
      }
    });
  }

  const btnWA = document.getElementById('btnWhatsAppCheckout');
  if (btnWA) {
    btnWA.addEventListener('click', handleWhatsAppCheckout);
  }

  const btnBank = document.getElementById('btnBankCheckout');
  if (btnBank) {
    btnBank.addEventListener('click', handleBankCheckout);
  }
}

function renderAppliedCoupon() {
  const couponContainer = document.getElementById('appliedCouponContainer');
  if (!couponContainer) return;

  const coupon = CDEStore.getActiveCoupon();
  if (coupon) {
    couponContainer.innerHTML = `
      <div class="applied-coupon-tag">
        <span>Kupon: <strong>${coupon.code}</strong> (${coupon.label})</span>
        <button class="remove-coupon-btn" type="button" onclick="removeCoupon()" title="Hapus Kupon">✕</button>
      </div>
    `;
  } else {
    couponContainer.innerHTML = '';
  }
}

function removeCoupon() {
  CDEStore.removeCoupon();
  showToast('Kupon diskon telah dihapus.');
}

/* ================== VALIDASI FORM PEMESAN ================== */
function validateCustomerForm() {
  const nameInput = document.getElementById('customerName');
  const phoneInput = document.getElementById('customerPhone');
  const addressInput = document.getElementById('customerAddress');
  const courierSelect = document.getElementById('courierSelect');
  const notesInput = document.getElementById('customerNotes');

  if (!nameInput || !nameInput.value.trim()) {
    alert('Silakan masukkan Nama Lengkap Anda.');
    if (nameInput) nameInput.focus();
    return null;
  }

  if (!phoneInput || !phoneInput.value.trim()) {
    alert('Silakan masukkan Nomor WhatsApp aktif untuk konfirmasi concierge atelier.');
    if (phoneInput) phoneInput.focus();
    return null;
  }

  if (!addressInput || !addressInput.value.trim()) {
    alert('Silakan masukkan Alamat Lengkap pengiriman.');
    if (addressInput) addressInput.focus();
    return null;
  }

  return {
    customerName: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    address: addressInput.value.trim(),
    courier: courierSelect ? courierSelect.value : 'JNE YES (Berasuransi Nilai Penuh)',
    notes: notesInput ? notesInput.value.trim() : ''
  };
}

/* ================== DIRECT WHATSAPP CHECKOUT ================== */
function handleWhatsAppCheckout() {
  const cart = CDEStore.getCart();
  if (cart.length === 0) {
    alert('Keranjang belanja Anda masih kosong.');
    return;
  }

  const customerData = validateCustomerForm();
  if (!customerData) return;

  const totalSummary = CDEStore.getCartTotal();

  // 1. Buat Pesanan di Store (status: WAITING_PAYMENT & PENDING)
  const newOrder = CDEStore.createOrder({
    customerName: customerData.customerName,
    phone: customerData.phone,
    address: customerData.address,
    courier: customerData.courier,
    notes: customerData.notes,
    items: cart,
    subtotal: totalSummary.subtotal,
    discount: totalSummary.discount,
    insurance: totalSummary.insurance,
    total: totalSummary.grandTotal,
    paymentMethod: 'Direct WhatsApp Concierge'
  });

  // 2. Catat Lead WhatsApp untuk Admin
  if (typeof CDEStore.addLead === 'function') {
    CDEStore.addLead({
      orderId: newOrder.id,
      customerName: newOrder.customerName,
      phone: newOrder.phone,
      total: newOrder.total,
      itemsCount: cart.reduce((c, i) => c + i.qty, 0),
      source: 'CHECKOUT_WHATSAPP'
    });
  }

  // 3. Generate Pesanan WhatsApp Terstruktur
  const message = window.whatsappService ? 
    window.whatsappService.generateOrderMessage(newOrder) :
    `Halo CD'E Pearls, pesanan ${newOrder.id} senilai ${CDEStore.formatRupiah(newOrder.total)} telah dibuat. Mohon konfirmasi.`;

  // 4. Bersihkan Keranjang
  CDEStore.clearCart();

  // 5. Buka WhatsApp
  if (window.whatsappService) {
    window.whatsappService.openWhatsApp(message);
  } else {
    const phone = (CDEStore.getSettings() && CDEStore.getSettings().whatsappNumber) || '6281239887766';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }

  // 6. Tampilkan Modal Sukses
  showOrderSuccessModal(newOrder, message);
}

/* ================== CHECKOUT TRANSFER BANK / VA ================== */
function handleBankCheckout() {
  const cart = CDEStore.getCart();
  if (cart.length === 0) {
    alert('Keranjang belanja Anda masih kosong.');
    return;
  }

  const customerData = validateCustomerForm();
  if (!customerData) return;

  const totalSummary = CDEStore.getCartTotal();

  const newOrder = CDEStore.createOrder({
    customerName: customerData.customerName,
    phone: customerData.phone,
    address: customerData.address,
    courier: customerData.courier,
    notes: customerData.notes,
    items: cart,
    subtotal: totalSummary.subtotal,
    discount: totalSummary.discount,
    insurance: totalSummary.insurance,
    total: totalSummary.grandTotal,
    paymentMethod: 'Transfer Bank BCA (Virtual Account)'
  });

  if (typeof CDEStore.addLead === 'function') {
    CDEStore.addLead({
      orderId: newOrder.id,
      customerName: newOrder.customerName,
      phone: newOrder.phone,
      total: newOrder.total,
      itemsCount: cart.reduce((c, i) => c + i.qty, 0),
      source: 'CHECKOUT_BANK_TRANSFER'
    });
  }

  CDEStore.clearCart();
  showOrderSuccessModal(newOrder, null);
}

/* ================== MODAL PESANAN SUKSES ================== */
function showOrderSuccessModal(order, waMessage) {
  const modal = document.getElementById('orderSuccessModal');
  const modalContent = document.getElementById('orderSuccessContent');
  if (!modal || !modalContent) return;

  const phone = (CDEStore.getSettings() && CDEStore.getSettings().whatsappNumber) || '6281239887766';
  const waUrl = waMessage ? `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}` : null;

  modalContent.innerHTML = `
    <div style="text-align: center; padding: 40px 32px; background: #FFFFFF; border-radius: 24px;">
      <div style="width: 68px; height: 68px; border-radius: 50%; background: #F0FDF4; border: 2px solid #86EFAC; color: #15803D; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
        <span data-lucide="checkCircle" data-size="36"></span>
      </div>
      
      <span style="font-size: 0.76rem; letter-spacing: 0.16em; color: var(--c-champagne-gold); text-transform: uppercase; font-weight: 700;">
        Pesanan Berhasil Dibuat
      </span>
      <h3 style="font-family: var(--font-serif-title); font-size: 1.8rem; color: var(--c-deep-navy); margin: 6px 0 16px 0;">
        Terima Kasih Atas Kepercayaan Anda
      </h3>

      <div style="background: var(--c-pearl-white); border: 1px solid var(--c-light-gray); padding: 16px; border-radius: 14px; margin-bottom: 20px; text-align: left; font-size: 0.88rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: var(--c-text-muted);">No. Pesanan:</span>
          <strong style="color: var(--c-deep-navy); font-family: monospace; font-size: 0.95rem;">${order.id}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: var(--c-text-muted);">Nama Pemesan:</span>
          <strong style="color: var(--c-dark-text);">${order.customerName}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: var(--c-text-muted);">Status Pembayaran:</span>
          <span style="background: rgba(201,169,110,0.15); border: 1px solid var(--c-champagne-gold); color: #8A6D3B; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">WAITING PAYMENT</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--c-light-gray); font-size: 1rem;">
          <span style="color: var(--c-deep-navy); font-weight: 700;">Total Investasi:</span>
          <strong style="color: var(--c-deep-navy); font-size: 1.15rem;">${CDEStore.formatRupiah(order.total)}</strong>
        </div>
      </div>

      <p style="font-size: 0.86rem; color: var(--c-text-muted); line-height: 1.6; margin-bottom: 24px;">
        Pesanan Anda telah diteruskan ke Concierge Atelier CD'E Pearls Lombok. Kami akan memverifikasi sertifikat keaslian dan menyiapkan perhiasan mutiara Anda.
      </p>
      
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${waUrl ? `
          <a href="${waUrl}" target="_blank" class="btn btn-hero-wa" style="width: 100%; text-decoration: none; justify-content: center; padding: 14px;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.879.808 2.8.808 3.182 0 5.768-2.587 5.768-5.766.001-3.181-2.584-5.766-5.772-5.766zm8.905 5.767c0 4.936-4.015 8.95-8.905 8.95-1.579 0-3.047-.417-4.329-1.139l-4.702 1.233 1.258-4.597c-.822-1.344-1.294-2.923-1.294-4.447 0-4.936 4.016-8.95 8.905-8.95 4.937 0 8.906 4.014 8.906 8.95z"/>
            </svg>
            Buka WhatsApp & Kirim Pesanan
          </a>
        ` : `
          <div style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 12px; border-radius: 10px; font-size: 0.82rem; color: #92400E; margin-bottom: 6px;">
            Silakan transfer ke <strong>BCA 889-102-9901 a/n CD'E Pearls Lombok</strong> dan konfirmasi via WhatsApp.
          </div>
        `}

        <button type="button" class="btn btn-hero-primary" onclick="closeModal('orderSuccessModal')" style="width: 100%; justify-content: center; padding: 12px;">
          Tutup & Kembali
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  if (window.LucideHelper) {
    window.LucideHelper.renderAll();
  }
}

/* ================== MODAL SERTIFIKAT GEMOLOGI ================== */
function viewCertificate(certNumber, productName, pearlType, pearlGrade, origin) {
  const modal = document.getElementById('certificateModal');
  const modalContent = document.getElementById('certificateModalContent');
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div class="cert-modal-body">
      <div class="cert-header-tag">CERTIFICATE OF GEMOLOGICAL AUTHENTICITY</div>
      <h2 class="cert-main-title">CD'E Pearls Lombok</h2>
      <div class="cert-serial">NO. SERTIFIKAT: ${certNumber}</div>

      <p style="font-size: 0.85rem; color: var(--c-text-muted); line-height: 1.6; margin-bottom: 20px;">
        Dengan ini dinyatakan bahwa perhiasan berikut telah melalui uji gemologi independen di atelier Lombok dan terverifikasi sebagai mutiara air laut alami <em>(Pinctada maxima)</em> dengan kilau cermin murni tanpa pewarna buatan.
      </p>

      <table class="cert-specs-table">
        <tr>
          <td>Perhiasan:</td>
          <td>${productName}</td>
        </tr>
        <tr>
          <td>Varietas Mutiara:</td>
          <td>${pearlType}</td>
        </tr>
        <tr>
          <td>Kualitas / Grade:</td>
          <td>${pearlGrade} (Mirror Luster)</td>
        </tr>
        <tr>
          <td>Ketebalan Nacre:</td>
          <td>&gt; 2.0 mm (Sangat Tebal & Tahan Lama)</td>
        </tr>
        <tr>
          <td>Asal Kultivasi:</td>
          <td>${origin || 'Perairan Laut Lombok Barat, NTB'}</td>
        </tr>
        <tr>
          <td>Status Gemologi:</td>
          <td><strong style="color: #15803D;">100% Genuine South Sea Pearl</strong></td>
        </tr>
      </table>

      <div class="cert-seal-box">
        <div class="seal-stamp">
          CD'E PEARLS<br>OFFICIAL<br>SEAL
        </div>
        <div class="seal-signature">
          Dr. H. Sudirman, G.G.<br>
          <span>Chief Gemologist & Cultivator</span>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

/* ================== PELACAKAN PESANAN CEPAT ================== */
function focusOrderTracking(e) {
  if (e) e.preventDefault();
  const box = document.getElementById('orderTrackingBox');
  const input = document.getElementById('trackingInput');
  if (box) box.scrollIntoView({ behavior: 'smooth' });
  if (input) {
    setTimeout(() => input.focus(), 400);
  }
}

function handleQuickTrackOrder() {
  const input = document.getElementById('trackingInput');
  const resultBox = document.getElementById('trackingResultBox');
  if (!input || !resultBox) return;

  const orderId = input.value.trim().toUpperCase();
  if (!orderId) {
    alert('Silakan masukkan Order ID yang ingin dilacak.');
    return;
  }

  const order = CDEStore.getOrderById(orderId);
  resultBox.style.display = 'block';

  if (!order) {
    resultBox.innerHTML = `
      <div style="padding: 14px; background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 10px; font-size: 0.82rem; color: #991B1B;">
        <strong>Pesanan tidak ditemukan.</strong> Pastikan Order ID yang Anda masukkan sudah benar (contoh: <code>CDE-2026-0041</code>).
      </div>
    `;
    return;
  }

  const statusColors = {
    'PENDING': '#D97706',
    'PROCESSING': '#2563EB',
    'SHIPPED': '#7C3AED',
    'DELIVERED': '#15803D',
    'COMPLETED': '#15803D',
    'CANCELLED': '#DC2626'
  };

  const paymentColors = {
    'WAITING_PAYMENT': '#D97706',
    'PAYMENT_REVIEW': '#2563EB',
    'PAID': '#15803D',
    'FAILED': '#DC2626'
  };

  resultBox.innerHTML = `
    <div style="padding: 16px; background: #FFFFFF; border: 1px solid var(--c-light-gray); border-radius: 12px; font-size: 0.85rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--c-light-gray);">
        <div>
          <strong style="color: var(--c-deep-navy);">${order.id}</strong>
          <div style="font-size: 0.75rem; color: var(--c-text-muted);">${order.date}</div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.72rem; font-weight: 700; color: #FFFFFF; background: ${statusColors[order.orderStatus] || '#6B7280'}; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
            ${order.orderStatus}
          </span>
          <div style="font-size: 0.7rem; font-weight: 600; color: ${paymentColors[order.paymentStatus] || '#6B7280'}; margin-top: 3px;">
            ${order.paymentStatus}
          </div>
        </div>
      </div>

      <div style="color: var(--c-dark-text); margin-bottom: 6px;">
        <strong>Pemesan:</strong> ${order.customerName} (${order.phone})
      </div>
      <div style="color: var(--c-text-muted); font-size: 0.8rem; margin-bottom: 8px;">
        <strong>Tujuan:</strong> ${order.address}
      </div>

      ${order.resi ? `
        <div style="padding: 8px 12px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; margin-bottom: 10px; font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
          <span>No. Resi (${order.courier || 'Kurir'}): <strong>${order.resi}</strong></span>
          <button type="button" style="background: none; border: none; color: #15803D; cursor: pointer; font-weight: 700;" onclick="navigator.clipboard.writeText('${order.resi}'); showToast('Nomor resi berhasil disalin!');">Salin</button>
        </div>
      ` : `
        <div style="font-size: 0.78rem; color: var(--c-text-muted); margin-bottom: 8px;">
          <em>Belum ada nomor resi. Paket sedang disiapkan di atelier Lombok.</em>
        </div>
      `}

      <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--c-light-gray); font-size: 0.95rem;">
        <span style="font-weight: 700; color: var(--c-deep-navy);">Total Biaya:</span>
        <strong style="color: var(--c-deep-navy);">${CDEStore.formatRupiah(order.total)}</strong>
      </div>
    </div>
  `;
}

/* ================== TOAST NOTIFIKASI ================== */
function showToast(message) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span data-lucide="checkCircle" data-size="18" style="color: var(--c-champagne-gold); flex-shrink: 0;"></span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  if (window.LucideHelper) {
    window.LucideHelper.renderAll();
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Tutup modal dengan Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal('orderSuccessModal');
    closeModal('certificateModal');
  }
});

// Ekspor ke window global
if (typeof window !== 'undefined') {
  window.changeQty = changeQty;
  window.removeItem = removeItem;
  window.removeCoupon = removeCoupon;
  window.viewCertificate = viewCertificate;
  window.closeModal = closeModal;
  window.focusOrderTracking = focusOrderTracking;
  window.handleQuickTrackOrder = handleQuickTrackOrder;
  window.showToast = showToast;
}
