/**
 * CD'E PEARLS - STOREFRONT MAIN SCRIPT (v3.0)
 * Mengatur katalog produk 5 kategori (Kalung, Gelang, Anting, Cincin, Mutiara Lepas),
 * filter varietas mutiara & grade, live search, sorting, modal detail produk interaktif,
 * sinkronisasi wishlist & keranjang belanja, serta konsultasi/order WhatsApp dinamis.
 */

let activeCategoryFilter = 'all'; // 'all', 'kalung', 'gelang', 'anting', 'cincin', 'mutiara-lepas'
let activeSort = 'popularity';     // 'popularity', 'price', 'price-desc', 'name'
let activeTypeFilter = 'all';     // 'all', 'south-sea', 'golden', 'tahitian'
let activeGradeFilter = 'all';    // 'all', 'Grade AAA', 'Grade AA+'
let activeSearchQuery = '';

let currentModalProduct = null;
let currentModalQty = 1;

document.addEventListener('DOMContentLoaded', () => {
  setupCategoryNav();
  setupSortHandlers();
  renderCatalogWithCategories();
  updateCartBadge();
  updateWishlistBadge();

  // Cek parameter URL untuk membuka modal detail produk secara langsung
  checkUrlProductParam();

  // Sinkronisasi otomatis saat produk atau cart bertambah dari Admin/halaman lain
  window.addEventListener('cde_store_updated', () => {
    updateCartBadge();
    updateWishlistBadge();
    renderCatalogWithCategories();
  });
});

/* ================== BADGES & COUNTERS ================== */
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

/* ================== SETUP HANDLERS ================== */
function setupCategoryNav() {
  const categoryBtns = document.querySelectorAll('.category-tab-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategoryFilter = btn.getAttribute('data-category') || 'all';
      renderCatalogWithCategories();
    });
  });
}

function setupSortHandlers() {
  const sortItems = document.querySelectorAll('.sort-item');
  sortItems.forEach(item => {
    item.addEventListener('click', () => {
      sortItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      activeSort = item.getAttribute('data-sort') || 'popularity';
      renderCatalogWithCategories();
    });
  });
}

function handleTypeFilterChange(value) {
  activeTypeFilter = value;
  renderCatalogWithCategories();
}

function handleGradeFilterChange(value) {
  activeGradeFilter = value;
  renderCatalogWithCategories();
}

/* ================== FILTER & SORT ENGINE ================== */
function filterProducts(products) {
  return products.filter(p => {
    // 1. Filter Varietas Mutiara
    if (activeTypeFilter !== 'all') {
      const typeStr = ((p.pearlType || '') + ' ' + (p.name || '')).toLowerCase();
      if (activeTypeFilter === 'south-sea' && !typeStr.includes('south sea')) return false;
      if (activeTypeFilter === 'golden' && !typeStr.includes('gold')) return false;
      if (activeTypeFilter === 'tahitian' && !typeStr.includes('tahitian') && !typeStr.includes('black')) return false;
    }

    // 2. Filter Grade Mutiara
    if (activeGradeFilter !== 'all') {
      if (p.pearlGrade !== activeGradeFilter) return false;
    }

    // 3. Search Query
    if (activeSearchQuery) {
      const q = activeSearchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      const matchType = (p.pearlType || '').toLowerCase().includes(q);
      const matchMetal = (p.metal || '').toLowerCase().includes(q);
      const matchOrigin = (p.origin || '').toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchType && !matchMetal && !matchOrigin) {
        return false;
      }
    }

    return true;
  });
}

function sortProductsList(list) {
  const cloned = [...list];
  if (activeSort === 'price') {
    return cloned.sort((a, b) => a.price - b.price);
  } else if (activeSort === 'price-desc') {
    return cloned.sort((a, b) => b.price - a.price);
  } else if (activeSort === 'name') {
    return cloned.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else {
    // Default: Popularity & Rating
    return cloned.sort((a, b) => ((b.rating || 5) * (b.reviewsCount || 1)) - ((a.rating || 5) * (a.reviewsCount || 1)));
  }
}

/* ================== RENDER KATALOG DENGAN 5 KATEGORI TERPISAH ================== */
function renderCatalogWithCategories() {
  const allProducts = CDEStore.getProducts();
  const filtered = filterProducts(allProducts);

  const necklaces = sortProductsList(filtered.filter(p => p.category.toLowerCase() === 'kalung'));
  const bracelets = sortProductsList(filtered.filter(p => p.category.toLowerCase() === 'gelang'));
  const earrings = sortProductsList(filtered.filter(p => p.category.toLowerCase() === 'anting'));
  const rings = sortProductsList(filtered.filter(p => p.category.toLowerCase() === 'cincin'));
  const loose = sortProductsList(filtered.filter(p => p.category.toLowerCase() === 'mutiara-lepas' || p.categoryId === 'mutiara-lepas'));

  const necklacesBlock = document.getElementById('groupNecklaces');
  const braceletsBlock = document.getElementById('groupBracelets');
  const earringsBlock = document.getElementById('groupEarrings');
  const ringsBlock = document.getElementById('groupRings');
  const looseBlock = document.getElementById('groupLoose');

  // 1. Kalung Mutiara
  if (necklacesBlock) {
    const show = (activeCategoryFilter === 'all' || activeCategoryFilter === 'kalung');
    necklacesBlock.style.display = show && (necklaces.length > 0 || activeCategoryFilter === 'kalung') ? 'block' : 'none';
    if (show) renderCategoryItems('necklacesGrid', necklaces, 'Kalung Mutiara');
  }

  // 2. Gelang Mutiara
  if (braceletsBlock) {
    const show = (activeCategoryFilter === 'all' || activeCategoryFilter === 'gelang');
    braceletsBlock.style.display = show && (bracelets.length > 0 || activeCategoryFilter === 'gelang') ? 'block' : 'none';
    if (show) renderCategoryItems('braceletsGrid', bracelets, 'Gelang Mutiara');
  }

  // 3. Anting Mutiara
  if (earringsBlock) {
    const show = (activeCategoryFilter === 'all' || activeCategoryFilter === 'anting');
    earringsBlock.style.display = show && (earrings.length > 0 || activeCategoryFilter === 'anting') ? 'block' : 'none';
    if (show) renderCategoryItems('earringsGrid', earrings, 'Anting Mutiara');
  }

  // 4. Cincin Mutiara
  if (ringsBlock) {
    const show = (activeCategoryFilter === 'all' || activeCategoryFilter === 'cincin');
    ringsBlock.style.display = show && (rings.length > 0 || activeCategoryFilter === 'cincin') ? 'block' : 'none';
    if (show) renderCategoryItems('ringsGrid', rings, 'Cincin Mutiara');
  }

  // 5. Mutiara Lepas
  if (looseBlock) {
    const show = (activeCategoryFilter === 'all' || activeCategoryFilter === 'mutiara-lepas');
    looseBlock.style.display = show && (loose.length > 0 || activeCategoryFilter === 'mutiara-lepas') ? 'block' : 'none';
    if (show) renderCategoryItems('looseGrid', loose, 'Mutiara Lepas Bersertifikat');
  }

  if (window.LucideHelper) {
    window.LucideHelper.renderAll();
  }
}

/* ================== RENDER KARTU PRODUK (Clean Square Tile) ================== */
function renderCategoryItems(gridId, items, categoryTitle) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: #FFFFFF; border: 1px dashed var(--c-light-gray); border-radius: 16px;">
        <span data-lucide="package" data-size="36" style="color: var(--c-champagne-gold); margin-bottom: 12px; display: inline-block;"></span>
        <h4 style="font-family: var(--font-serif-title); color: var(--c-deep-navy); font-size: 1.15rem; margin-bottom: 6px;">Koleksi ${categoryTitle} Belum Tersedia</h4>
        <p style="font-size: 0.85rem; color: var(--c-text-muted);">Coba ubah opsi filter atau hubungi concierge kami untuk pemesanan kustom mutiara khusus.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(p => {
    const isWishlisted = CDEStore.isInWishlist(p.id);

    return `
      <div class="product-item-wrap">
        <div class="product-card-clean" onclick="openProductDetailModal('${p.id}')" title="Klik untuk melihat rincian & spesifikasi">
          
          <!-- Tombol Wishlist (Heart Icon Rose Terracotta) -->
          <button class="heart-wishlist-btn ${isWishlisted ? 'active' : ''}" 
                  id="wishlist-btn-${p.id}"
                  title="${isWishlisted ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}" 
                  onclick="event.stopPropagation(); toggleWishlist(event, '${p.id}')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </button>

          <!-- Gambar Produk Persegi 1:1 -->
          <div class="card-img-box">
            <img src="${p.image}" alt="${p.name}" loading="lazy">
          </div>

          <!-- Judul Produk -->
          <h3 class="card-title-text" title="${p.name}">
            ${p.name}
          </h3>

          <!-- Baris Harga & Tag Diskon -->
          <div class="card-pricing-row">
            <div class="price-text-col">
              <span class="price-current">${CDEStore.formatRupiah(p.price)}</span>
              ${p.originalPrice ? `<span class="price-original">${CDEStore.formatRupiah(p.originalPrice)}</span>` : ''}
            </div>
            ${p.discountPercent ? `<span class="discount-pill-tag">-${p.discountPercent}% OFF</span>` : ''}
          </div>

        </div>

        <!-- Tombol Aksi Bawah: Full-Width ADD TO CART Gold Pill -->
        <div class="card-actions-row">
          <button class="btn-card-add-cart" onclick="event.stopPropagation(); handleAddToCart('${p.id}')">
            ADD TO CART
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* ================== WISHLIST TOGGLE ================== */
function toggleWishlist(e, productId) {
  if (e) e.stopPropagation();
  const p = CDEStore.getProductById(productId);
  if (!p) return;

  const result = CDEStore.toggleWishlist(productId);
  updateWishlistBadge();

  // Update UI tombol
  const btn = document.getElementById(`wishlist-btn-${productId}`);
  if (btn) {
    const svg = btn.querySelector('svg');
    if (result.added) {
      btn.classList.add('active');
      if (svg) svg.setAttribute('fill', 'currentColor');
    } else {
      btn.classList.remove('active');
      if (svg) svg.setAttribute('fill', 'none');
    }
  }

  showToast(result.added ? 
    `"${p.name}" ditambahkan ke Favorit.` : 
    `"${p.name}" dihapus dari Favorit.`
  );
}

/* ================== KERANJANG BELANJA (ADD TO CART) ================== */
function handleAddToCart(productId, quantity = 1) {
  const product = CDEStore.getProductById(productId);
  if (!product) return;

  CDEStore.addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    pearlType: product.pearlType,
    pearlGrade: product.pearlGrade,
    metal: product.metal,
    certificate: product.certificate,
    qty: quantity
  });

  updateCartBadge();
  showToast(`"${product.name}" (${quantity} unit) ditambahkan ke keranjang belanja.`);
}

/* ================== DIRECT WHATSAPP ORDER ================== */
function buyViaWhatsApp(productId) {
  const p = CDEStore.getProductById(productId);
  if (!p) return;

  if (window.whatsappService) {
    const orderItems = [{
      name: p.name,
      qty: 1,
      price: p.price,
      spec: `${p.pearlType || 'Mutiara Laut'}, ${p.pearlGrade || 'Grade AAA'}, ${p.metal || 'Emas 18K'}`
    }];
    const orderData = {
      orderId: 'DIR-' + Math.floor(100000 + Math.random() * 900000),
      customerName: 'Tamu Atelier CD\'E',
      phone: '',
      shippingAddress: 'Pemesanan Langsung Konsultasi WhatsApp',
      courier: 'JNE YES Berasuransi Penuh',
      items: orderItems,
      subtotal: p.price,
      shippingCost: 0,
      total: p.price
    };
    const message = window.whatsappService.generateOrderMessage(orderData);
    window.whatsappService.openWhatsApp(message);
  } else {
    const settings = CDEStore.getSettings();
    const phone = settings.whatsappNumber || '6281239887766';
    const message = `Halo CD'E Pearls, saya ingin memesan langsung: *${p.name}* (${CDEStore.formatRupiah(p.price)}). Mohon konfirmasi ketersediaan di atelier Lombok. Terima kasih!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }
}

/* ================== KONSULTASI WHATSAPP SPESIFIKASI ================== */
function consultViaWhatsApp(productId) {
  const p = CDEStore.getProductById(productId);
  if (!p) return;

  if (window.whatsappService) {
    const message = window.whatsappService.generateProductConsultationMessage(p);
    window.whatsappService.openWhatsApp(message);
  } else {
    const settings = CDEStore.getSettings();
    const phone = settings.whatsappNumber || '6281239887766';
    const message = `Halo Concierge CD'E Pearls, saya ingin berkonsultasi mengenai spesifikasi produk: *${p.name}*.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }
}

/* ================== MODAL DETAIL PRODUK INTERAKTIF ================== */
function openProductDetailModal(productId) {
  const p = CDEStore.getProductById(productId);
  if (!p) return;

  currentModalProduct = p;
  currentModalQty = 1;

  const card = document.getElementById('productModalCard');
  const modal = document.getElementById('productDetailModal');
  if (!card || !modal) return;

  card.innerHTML = `
    <button class="modal-close-btn-round" title="Tutup Modal" onclick="closeProductDetailModal()">
      <span data-lucide="x" data-size="18"></span>
    </button>
    
    <div class="modal-product-grid">
      <!-- Kolom Kiri: Visual & Kepercayaan Atelier -->
      <div class="modal-img-col">
        <div class="modal-main-img-box">
          <img src="${p.image}" alt="${p.name}">
        </div>

        <div class="modal-trust-tags">
          <div class="modal-trust-pill">
            <span data-lucide="shieldCheck" data-size="16"></span>
            <span>100% Asli Laut Lombok</span>
          </div>
          <div class="modal-trust-pill">
            <span data-lucide="award" data-size="16"></span>
            <span>Sertifikat Gemologi Lab</span>
          </div>
          <div class="modal-trust-pill" style="grid-column: 1 / -1;">
            <span data-lucide="truck" data-size="16"></span>
            <span>Pengiriman Valuables Berasuransi Penuh</span>
          </div>
        </div>
      </div>

      <!-- Kolom Kanan: Rincian Lengkap & Aksi Pembelian -->
      <div class="modal-info-col">
        <span class="modal-category-eyebrow">${(p.category || 'Perhiasan').toUpperCase()} • ${p.pearlGrade || 'GRADE AAA'}</span>
        <h2 class="modal-product-title">${p.name}</h2>

        <!-- Rating & Review Count -->
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 12px; font-size: 0.82rem; color: var(--c-champagne-gold);">
          <span data-lucide="star" data-size="15" data-fill="currentColor"></span>
          <strong style="color: var(--c-deep-navy);">${p.rating || 5.0} / 5.0</strong>
          <span style="color: var(--c-text-muted);">• ${p.reviewsCount || 12} Ulasan Pelanggan Terverifikasi</span>
        </div>

        <div class="modal-pricing-box">
          <span class="modal-price-current" id="modalPriceCurrent">${CDEStore.formatRupiah(p.price)}</span>
          ${p.originalPrice ? `<span class="modal-price-original">${CDEStore.formatRupiah(p.originalPrice)}</span>` : ''}
          ${p.discountPercent ? `<span class="modal-discount-tag">Hemat ${p.discountPercent}%</span>` : ''}
        </div>

        <p class="modal-desc-text">
          ${p.description || 'Koleksi perhiasan mutiara air laut Lombok terpilih dengan kilau cermin alami (mirror luster) dan ketebalan nacre superior yang dirangkai manual oleh maestro perhiasan berpengalaman.'}
        </p>

        <!-- Tabel Spesifikasi Detail Lengkap -->
        <div class="modal-specs-table">
          <div class="spec-item-row">
            <span class="spec-item-label">Varietas Mutiara</span>
            <span class="spec-item-val">${p.pearlType || 'South Sea Pearl'}</span>
          </div>
          <div class="spec-item-row">
            <span class="spec-item-label">Ukuran Diameter</span>
            <span class="spec-item-val">${p.pearlSize || '11 - 12 mm'}</span>
          </div>
          <div class="spec-item-row">
            <span class="spec-item-label">Warna Alami Mutiara</span>
            <span class="spec-item-val">${p.pearlColor || 'Mirror Silver White'}</span>
          </div>
          <div class="spec-item-row">
            <span class="spec-item-label">Kualitas & Luster</span>
            <span class="spec-item-val">${p.pearlGrade || 'Grade AAA'} (Mirror Luster)</span>
          </div>
          <div class="spec-item-row">
            <span class="spec-item-label">Material Rangka</span>
            <span class="spec-item-val">${p.metal || 'Emas 18K Solid (750)'}</span>
          </div>
          <div class="spec-item-row">
            <span class="spec-item-label">Asal Kultivasi</span>
            <span class="spec-item-val">${p.origin || 'Perairan Lombok, NTB'}</span>
          </div>
          <div class="spec-item-row">
            <span class="spec-item-label">Nomor Sertifikat</span>
            <span class="spec-item-val">${p.certificate || 'CDE-CERT-8901'}</span>
          </div>
          <div class="spec-item-row">
            <span class="spec-item-label">Ketersediaan Butir</span>
            <span class="spec-item-val" style="color: #15803D;">Tersedia (${p.stock || 5} unit)</span>
          </div>
        </div>

        <!-- Pemilih Kuantitas -->
        <div class="modal-qty-row">
          <span class="modal-qty-label">Kuantitas:</span>
          <div class="qty-control-box">
            <button class="qty-btn" type="button" onclick="changeModalQty(-1)">−</button>
            <span class="qty-val-display" id="modalQtyDisplay">1</span>
            <button class="qty-btn" type="button" onclick="changeModalQty(1)">+</button>
          </div>
          <span style="font-size: 0.8rem; color: var(--c-text-muted);">Maksimal pembelian ${p.stock || 5} butir per pesanan</span>
        </div>

        <!-- 3 Tombol Aksi: Keranjang, Direct WhatsApp & Konsultasi -->
        <div class="modal-actions-box">
          <button class="btn-modal-cart" type="button" onclick="modalAddToCart()">
            <span data-lucide="shoppingBag" data-size="18"></span>
            Tambah Keranjang
          </button>
          <button class="btn-modal-wa" type="button" onclick="modalBuyWhatsApp()">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.879.808 2.8.808 3.182 0 5.768-2.587 5.768-5.766.001-3.181-2.584-5.766-5.772-5.766zm8.905 5.767c0 4.936-4.015 8.95-8.905 8.95-1.579 0-3.047-.417-4.329-1.139l-4.702 1.233 1.258-4.597c-.822-1.344-1.294-2.923-1.294-4.447 0-4.936 4.016-8.95 8.905-8.95 4.937 0 8.906 4.014 8.906 8.95z"/>
            </svg>
            Beli via WhatsApp
          </button>
          <button class="btn-modal-consult" type="button" onclick="modalConsultWhatsApp()">
            <span data-lucide="messageCircle" data-size="18"></span>
            Konsultasi Produk via WhatsApp
          </button>
        </div>

      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  if (window.LucideHelper) {
    window.LucideHelper.renderAll();
  }
}

function closeProductDetailModal() {
  const modal = document.getElementById('productDetailModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function handleModalBackdropClick(e) {
  if (e.target.id === 'productDetailModal') {
    closeProductDetailModal();
  }
}

function changeModalQty(delta) {
  if (!currentModalProduct) return;
  const newQty = currentModalQty + delta;
  const maxStock = currentModalProduct.stock || 10;
  if (newQty >= 1 && newQty <= maxStock) {
    currentModalQty = newQty;
    const disp = document.getElementById('modalQtyDisplay');
    if (disp) disp.textContent = currentModalQty;
    const priceCurrent = document.getElementById('modalPriceCurrent');
    if (priceCurrent) {
      priceCurrent.textContent = CDEStore.formatRupiah(currentModalProduct.price * currentModalQty);
    }
  }
}

function modalAddToCart() {
  if (!currentModalProduct) return;
  handleAddToCart(currentModalProduct.id, currentModalQty);
  closeProductDetailModal();
}

function modalBuyWhatsApp() {
  if (!currentModalProduct) return;
  const p = currentModalProduct;
  const qty = currentModalQty || 1;

  if (window.whatsappService) {
    const orderItems = [{
      name: p.name,
      qty: qty,
      price: p.price,
      spec: `${p.pearlType || 'Mutiara Laut'}, ${p.pearlGrade || 'Grade AAA'}, ${p.metal || 'Emas 18K'}`
    }];
    const orderData = {
      orderId: 'DIR-' + Math.floor(100000 + Math.random() * 900000),
      customerName: 'Tamu Atelier CD\'E',
      phone: '',
      shippingAddress: 'Pemesanan Langsung Konsultasi WhatsApp',
      courier: 'JNE YES Berasuransi Penuh',
      items: orderItems,
      subtotal: p.price * qty,
      shippingCost: 0,
      total: p.price * qty
    };
    const message = window.whatsappService.generateOrderMessage(orderData);
    window.whatsappService.openWhatsApp(message);
  } else {
    const settings = CDEStore.getSettings();
    const phone = settings.whatsappNumber || '6281239887766';
    const message = `Halo Concierge CD'E Pearls, saya ingin membeli langsung: *${p.name}* sebanyak ${qty} unit (${CDEStore.formatRupiah(p.price * qty)}). Mohon info nomor rekening resmi.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }
}

function modalConsultWhatsApp() {
  if (!currentModalProduct) return;
  consultViaWhatsApp(currentModalProduct.id);
}

/* ================== LIVE SEARCH ================== */
function handleLiveSearch(query) {
  activeSearchQuery = (query || '').trim();
  renderCatalogWithCategories();
}

function handleHeaderSearch() {
  const input = document.getElementById('headerSearchInput');
  if (input) {
    handleLiveSearch(input.value);
    const catalogSection = document.getElementById('catalog');
    if (catalogSection) catalogSection.scrollIntoView({ behavior: 'smooth' });
  }
}

/* ================== CEK PARAMETER URL PRODUK ================== */
function checkUrlProductParam() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const prodId = urlParams.get('product');
    if (prodId) {
      setTimeout(() => openProductDetailModal(prodId), 200);
      return;
    }
    const hash = window.location.hash;
    if (hash && hash.startsWith('#product-')) {
      const idFromHash = hash.replace('#product-', '');
      setTimeout(() => openProductDetailModal(idFromHash), 200);
    }
  } catch (e) {
    // Abaikan jika tidak di lingkungan browser
  }
}

/* ================== SHOWCASE CATEGORY SELECTOR ================== */
function selectShowcaseCategory(categoryKey, cardEl) {
  const allCards = document.querySelectorAll('.category-card-luxury');
  allCards.forEach(c => c.classList.remove('active'));

  if (cardEl) {
    cardEl.classList.add('active');
  }

  activeCategoryFilter = categoryKey;

  const categoryBtns = document.querySelectorAll('.category-tab-btn');
  categoryBtns.forEach(b => {
    if (b.getAttribute('data-category') === categoryKey) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  renderCatalogWithCategories();
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

// Tutup modal jika tombol Escape ditekan
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProductDetailModal();
  }
});

// Ekspor ke global window
if (typeof window !== 'undefined') {
  window.handleAddToCart = handleAddToCart;
  window.buyViaWhatsApp = buyViaWhatsApp;
  window.consultViaWhatsApp = consultViaWhatsApp;
  window.toggleWishlist = toggleWishlist;
  window.updateWishlistBadge = updateWishlistBadge;
  window.updateCartBadge = updateCartBadge;
  window.showToast = showToast;
  window.openProductDetailModal = openProductDetailModal;
  window.closeProductDetailModal = closeProductDetailModal;
  window.handleModalBackdropClick = handleModalBackdropClick;
  window.changeModalQty = changeModalQty;
  window.modalAddToCart = modalAddToCart;
  window.modalBuyWhatsApp = modalBuyWhatsApp;
  window.modalConsultWhatsApp = modalConsultWhatsApp;
  window.handleLiveSearch = handleLiveSearch;
  window.handleHeaderSearch = handleHeaderSearch;
  window.handleTypeFilterChange = handleTypeFilterChange;
  window.handleGradeFilterChange = handleGradeFilterChange;
  window.selectShowcaseCategory = selectShowcaseCategory;
}
