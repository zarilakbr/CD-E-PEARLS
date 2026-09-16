/**
 * CD'E PEARLS - CUSTOMER DASHBOARD SCRIPT (v3.0)
 * Mengatur autentikasi pelanggan (Login/Register), manajemen profil,
 * riwayat pesanan (orders & status dual-track), koleksi wishlist, dan review produk.
 */

let activeTab = 'orders'; // 'profile', 'orders', 'wishlist', 'reviews'

document.addEventListener('DOMContentLoaded', () => {
  renderCustomerView();
  updateHeaderBadges();

  window.addEventListener('cde_store_updated', () => {
    updateHeaderBadges();
    if (CDEStore.getCurrentUser()) {
      renderTabContent();
    } else {
      renderCustomerView();
    }
  });
});

function updateHeaderBadges() {
  const cartBadge = document.getElementById('headerCartBadge');
  if (cartBadge) {
    const count = CDEStore.getCart().reduce((sum, i) => sum + i.qty, 0);
    cartBadge.textContent = count;
    cartBadge.style.display = count > 0 ? 'flex' : 'none';
  }

  const wishBadge = document.getElementById('headerWishlistBadge');
  if (wishBadge) {
    const count = CDEStore.getWishlist().length;
    wishBadge.textContent = count;
    wishBadge.style.display = count > 0 ? 'flex' : 'none';
  }
}

/* ================== RENDER CUSTOMER VIEW ================== */
function renderCustomerView() {
  const currentUser = CDEStore.getCurrentUser();
  const authContainer = document.getElementById('authContainer');
  const dashboardLayout = document.getElementById('dashboardLayout');

  if (!currentUser) {
    if (authContainer) authContainer.style.display = 'block';
    if (dashboardLayout) dashboardLayout.style.display = 'none';
    setupAuthForms();
  } else {
    if (authContainer) authContainer.style.display = 'none';
    if (dashboardLayout) dashboardLayout.style.display = 'grid';

    // Update Sidebar User Info
    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');

    if (avatarEl) avatarEl.textContent = (currentUser.name || currentUser.email).charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = currentUser.name || 'Pelanggan Terhormat';
    if (emailEl) emailEl.textContent = currentUser.email;

    // Update Counter Badges di Sidebar
    const orders = CDEStore.getUserOrders(currentUser.id);
    const wishlist = CDEStore.getWishlist();
    const ordersBadge = document.getElementById('sidebarOrdersBadge');
    const wishlistBadge = document.getElementById('sidebarWishlistBadge');

    if (ordersBadge) ordersBadge.textContent = orders.length;
    if (wishlistBadge) wishlistBadge.textContent = wishlist.length;

    renderTabContent();
  }

  if (window.LucideHelper) {
    window.LucideHelper.renderAll();
  }
}

/* ================== SETUP AUTH FORMS ================== */
function setupAuthForms() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      if (!email) return;

      CDEStore.login(email, 'CUSTOMER');
      showToast(`Selamat datang kembali, ${email}!`);
      renderCustomerView();
    };
  }

  if (registerForm) {
    registerForm.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const phone = document.getElementById('regPhone').value.trim();
      const address = document.getElementById('regAddress').value.trim();

      const result = CDEStore.register({ name, email, phone, address });
      if (result.success) {
        showToast('Akun pelanggan berhasil didaftarkan!');
        renderCustomerView();
      } else {
        alert(result.message);
      }
    };
  }
}

function switchAuthTab(type) {
  const loginTab = document.getElementById('tabLogin');
  const registerTab = document.getElementById('tabRegister');
  const loginSection = document.getElementById('loginSection');
  const registerSection = document.getElementById('registerSection');

  if (type === 'login') {
    if (loginTab) loginTab.classList.add('active');
    if (registerTab) registerTab.classList.remove('active');
    if (loginSection) loginSection.style.display = 'block';
    if (registerSection) registerSection.style.display = 'none';
  } else {
    if (loginTab) loginTab.classList.remove('active');
    if (registerTab) registerTab.classList.add('active');
    if (loginSection) loginSection.style.display = 'none';
    if (registerSection) registerSection.style.display = 'block';
  }

  if (window.LucideHelper) {
    window.LucideHelper.renderAll();
  }
}

function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    btnEl.innerHTML = '<span data-lucide="eyeOff" data-size="18"></span>';
  } else {
    input.type = 'password';
    btnEl.innerHTML = '<span data-lucide="eye" data-size="18"></span>';
  }

  if (window.LucideHelper) {
    window.LucideHelper.renderAll();
  }
}

function quickDemoLogin(email) {
  CDEStore.login(email, 'CUSTOMER');
  showToast(`Selamat datang, ${email}!`);
  renderCustomerView();
}

/* ================== TAB NAVIGATION ================== */
function switchDashboardTab(tabName) {
  activeTab = tabName;
  const navItems = document.querySelectorAll('.dashboard-nav-item');
  navItems.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderTabContent();
}

function renderTabContent() {
  const panel = document.getElementById('dashboardContentPanel');
  if (!panel) return;

  const currentUser = CDEStore.getCurrentUser();
  if (!currentUser) return;

  if (activeTab === 'orders') {
    renderOrdersTab(panel, currentUser);
  } else if (activeTab === 'wishlist') {
    renderWishlistTab(panel, currentUser);
  } else if (activeTab === 'profile') {
    renderProfileTab(panel, currentUser);
  } else if (activeTab === 'reviews') {
    renderReviewsTab(panel, currentUser);
  }

  if (window.LucideHelper) {
    window.LucideHelper.renderAll();
  }
}

/* ================== 1. TAB RIWAYAT PESANAN ================== */
function renderOrdersTab(panel, user) {
  // Ambil pesanan milik user atau seluruh pesanan jika demo
  let orders = CDEStore.getUserOrders(user.id);
  if (orders.length === 0) {
    // Fallback demo: jika user adalah demo ratna, tampilkan default orders
    orders = CDEStore.getOrders().slice(0, 3);
  }

  panel.innerHTML = `
    <div class="panel-header-row">
      <div>
        <h2 class="panel-title">Riwayat Pesanan Perhiasan</h2>
        <p style="font-size: 0.85rem; color: var(--c-text-muted);">Pantau status verifikasi sertifikat, pembayaran, dan ekspedisi kirim berasuransi.</p>
      </div>
      <span class="nav-badge-pill" style="font-size: 0.82rem; padding: 4px 12px;">${orders.length} Pesanan</span>
    </div>

    ${orders.length === 0 ? `
      <div style="text-align: center; padding: 50px 20px;">
        <span data-lucide="package" data-size="44" style="color: var(--c-champagne-gold); margin-bottom: 12px; display: inline-block;"></span>
        <h4 style="font-family: var(--font-serif-title); color: var(--c-deep-navy); font-size: 1.2rem; margin-bottom: 6px;">Belum Ada Riwayat Pesanan</h4>
        <p style="font-size: 0.86rem; color: var(--c-text-muted); margin-bottom: 18px;">Anda belum melakukan pemesanan perhiasan mutiara laut.</p>
        <a href="index.html#catalog" class="btn btn-hero-primary" style="padding: 10px 24px;">Lihat Katalog</a>
      </div>
    ` : orders.map(order => {
      const orderItems = order.items || [];
      const paymentBadgeClass = order.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-waiting';
      const orderBadgeClass = order.orderStatus === 'DELIVERED' ? 'badge-delivered' : (order.orderStatus === 'SHIPPED' ? 'badge-shipped' : 'badge-processing');

      return `
        <div class="order-card-luxury">
          <div class="order-card-header">
            <div>
              <span class="order-id-text">${order.id}</span>
              <div class="order-date-text">Tanggal: ${order.date}</div>
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge-status ${paymentBadgeClass}">${order.paymentStatus || 'WAITING_PAYMENT'}</span>
              <span class="badge-status ${orderBadgeClass}">${order.orderStatus || 'PENDING'}</span>
            </div>
          </div>

          <!-- Rincian Produk -->
          <div class="order-items-sublist">
            ${orderItems.map(it => `
              <div class="order-item-subrow">
                <div>
                  <strong style="color: var(--c-dark-text);">${it.name}</strong> 
                  <span style="color: var(--c-text-muted); font-size: 0.8rem;">(x${it.qty})</span>
                  <div style="font-size: 0.76rem; color: var(--c-text-muted);">${it.spec || ''}</div>
                </div>
                <strong style="color: var(--c-deep-navy);">${CDEStore.formatRupiah((it.price || 0) * (it.qty || 1))}</strong>
              </div>
            `).join('')}
          </div>

          <!-- Resi Pengiriman jika ada -->
          ${order.resi ? `
            <div style="padding: 8px 12px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; margin-bottom: 12px; font-size: 0.82rem; display: flex; justify-content: space-between; align-items: center;">
              <span>No. Resi (${order.courier || 'Kurir Berasuransi'}): <strong>${order.resi}</strong></span>
              <button type="button" style="background: none; border: none; color: #15803D; cursor: pointer; font-weight: 700;" onclick="navigator.clipboard.writeText('${order.resi}'); showToast('Resi berhasil disalin!');">Salin Resi</button>
            </div>
          ` : ''}

          <!-- Footer Kartu Pesanan -->
          <div class="order-footer-row">
            <div>
              <span style="font-size: 0.8rem; color: var(--c-text-muted);">Total Investasi:</span>
              <strong style="font-size: 1.15rem; color: var(--c-deep-navy); margin-left: 6px;">${CDEStore.formatRupiah(order.total)}</strong>
            </div>

            <div style="display: flex; gap: 8px;">
              <button class="btn btn-hero-wa" style="padding: 7px 16px; font-size: 0.78rem;" onclick="followUpOrderWhatsApp('${order.id}')">
                <span data-lucide="messageCircle" data-size="14"></span>
                Tanya Concierge
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function followUpOrderWhatsApp(orderId) {
  const order = CDEStore.getOrderById(orderId);
  const settings = CDEStore.getSettings();
  const phone = settings.whatsappNumber || '6281239887766';
  const msg = `Halo Concierge CD'E Pearls, saya ingin menanyakan status pesanan saya dengan Order ID *${orderId}*. Mohon informasinya. Terima kasih!`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ================== 2. TAB WISHLIST ================== */
function renderWishlistTab(panel) {
  const wishlistIds = CDEStore.getWishlist();
  const allProducts = CDEStore.getProducts();
  const wishProducts = allProducts.filter(p => wishlistIds.includes(p.id));

  panel.innerHTML = `
    <div class="panel-header-row">
      <div>
        <h2 class="panel-title">Koleksi Favorit (Wishlist)</h2>
        <p style="font-size: 0.85rem; color: var(--c-text-muted);">Daftar perhiasan mutiara laut yang Anda simpan untuk dibeli atau dikonsultasikan.</p>
      </div>
      <span class="nav-badge-pill" style="font-size: 0.82rem; padding: 4px 12px;">${wishProducts.length} Koleksi</span>
    </div>

    ${wishProducts.length === 0 ? `
      <div style="text-align: center; padding: 50px 20px;">
        <span data-lucide="heart" data-size="44" style="color: var(--c-champagne-gold); margin-bottom: 12px; display: inline-block;"></span>
        <h4 style="font-family: var(--font-serif-title); color: var(--c-deep-navy); font-size: 1.2rem; margin-bottom: 6px;">Belum Ada Perhiasan Favorit</h4>
        <p style="font-size: 0.86rem; color: var(--c-text-muted); margin-bottom: 18px;">Jelajahi katalog dan tekan ikon hati untuk menyimpan perhiasan favorit Anda.</p>
        <a href="index.html#catalog" class="btn btn-hero-primary" style="padding: 10px 24px;">Jelajahi Katalog</a>
      </div>
    ` : `
      <div class="product-group-grid" style="margin-top: 0;">
        ${wishProducts.map(p => `
          <div class="product-item-wrap">
            <div class="product-card-clean">
              <button class="heart-wishlist-btn active" title="Hapus dari Favorit" onclick="removeWishlistItem('${p.id}')">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
              </button>

              <div class="card-img-box">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
                <span class="card-grade-badge">${p.pearlGrade || 'Grade AAA'}</span>
              </div>

              <h3 class="card-title-text" title="${p.name}">${p.name}</h3>

              <div class="card-pricing-row">
                <span class="price-current">${CDEStore.formatRupiah(p.price)}</span>
                ${p.discountPercent ? `<span class="discount-pill-tag">-${p.discountPercent}%</span>` : ''}
              </div>
            </div>

            <div class="card-actions-row">
              <button class="btn-card-add-cart" onclick="moveWishlistToCart('${p.id}')">
                <span data-lucide="shoppingBag" data-size="14"></span>
                ADD TO CART
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

function removeWishlistItem(productId) {
  CDEStore.toggleWishlist(productId);
  showToast('Perhiasan dihapus dari koleksi favorit.');
  renderTabContent();
}

function moveWishlistToCart(productId) {
  const p = CDEStore.getProductById(productId);
  if (!p) return;
  CDEStore.addToCart({
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    pearlType: p.pearlType,
    pearlGrade: p.pearlGrade,
    metal: p.metal,
    certificate: p.certificate,
    qty: 1
  });
  showToast(`"${p.name}" ditambahkan ke keranjang belanja!`);
}

/* ================== 3. TAB PROFIL PENGGUNA ================== */
function renderProfileTab(panel, user) {
  panel.innerHTML = `
    <div class="panel-header-row">
      <div>
        <h2 class="panel-title">Data Profil Pelanggan</h2>
        <p style="font-size: 0.85rem; color: var(--c-text-muted);">Informasi pengiriman sertifikat dan komunikasi privat atelier.</p>
      </div>
    </div>

    <form id="profileForm" style="max-width: 580px;" onsubmit="handleSaveProfile(event)">
      <div class="form-group">
        <label class="form-label" for="profName">Nama Lengkap</label>
        <input type="text" id="profName" class="form-control" value="${user.name || ''}" required>
      </div>

      <div class="form-group">
        <label class="form-label" for="profEmail">Alamat Email (Akun Utama)</label>
        <input type="email" id="profEmail" class="form-control" value="${user.email || ''}" readonly style="background: var(--c-light-gray); cursor: not-allowed;">
      </div>

      <div class="form-group">
        <label class="form-label" for="profPhone">Nomor WhatsApp Aktif</label>
        <input type="tel" id="profPhone" class="form-control" value="${user.phone || ''}" placeholder="Contoh: 081234567890">
      </div>

      <div class="form-group">
        <label class="form-label" for="profAddress">Alamat Pengiriman Utama</label>
        <textarea id="profAddress" class="form-control" placeholder="Nama Jalan, No. Rumah, Kota, Kode Pos">${user.address || ''}</textarea>
      </div>

      <button type="submit" class="btn btn-hero-primary" style="padding: 12px 28px; margin-top: 10px;">
        <span data-lucide="checkCircle" data-size="16"></span>
        Simpan Perubahan Profil
      </button>
    </form>
  `;
}

function handleSaveProfile(e) {
  e.preventDefault();
  const currentUser = CDEStore.getCurrentUser();
  if (!currentUser) return;

  const name = document.getElementById('profName').value.trim();
  const phone = document.getElementById('profPhone').value.trim();
  const address = document.getElementById('profAddress').value.trim();

  CDEStore.updateProfile(currentUser.id, { name, phone, address });
  showToast('Profil berhasil diperbarui!');
  renderCustomerView();
}

/* ================== 4. TAB ULASAN SAYA ================== */
function renderReviewsTab(panel, user) {
  const allReviews = CDEStore.getReviews();
  // Filter ulasan user
  const userReviews = allReviews.filter(r => r.userId === user.id || r.author === user.name);

  panel.innerHTML = `
    <div class="panel-header-row">
      <div>
        <h2 class="panel-title">Ulasan & Testimoni Perhiasan</h2>
        <p style="font-size: 0.85rem; color: var(--c-text-muted);">Beri ulasan dan penilaian atas kilau mutiara yang telah Anda miliki.</p>
      </div>
    </div>

    <!-- Form Kirim Ulasan Baru -->
    <div style="background: var(--c-pearl-white); border: 1px solid var(--c-light-gray); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <h4 style="font-size: 0.95rem; color: var(--c-deep-navy); margin-bottom: 12px;">Tulis Ulasan Perhiasan Baru</h4>
      <form onsubmit="handleReviewSubmit(event)">
        <div class="form-group">
          <label class="form-label">Pilih Produk Perhiasan</label>
          <select id="reviewProductSelect" class="form-control" required>
            ${CDEStore.getProducts().map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Penilaian Bintang</label>
          <select id="reviewRatingSelect" class="form-control" required>
            <option value="5">★★★★★ - Sempurna (Mirror Luster Luar Biasa)</option>
            <option value="4">★★★★☆ - Sangat Bagus</option>
            <option value="3">★★★☆☆ - Cukup</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Pengalaman & Ulasan Anda</label>
          <textarea id="reviewComment" class="form-control" placeholder="Ceritakan kepuasan Anda terhadap kilau mutiara, rangka emas, dan pelayanan..." required></textarea>
        </div>

        <button type="submit" class="btn btn-hero-primary" style="padding: 10px 22px;">
          Kirim Ulasan Resmi
        </button>
      </form>
    </div>

    <!-- Daftar Ulasan User -->
    <div>
      <h4 style="font-size: 0.92rem; color: var(--c-deep-navy); margin-bottom: 14px;">Ulasan Anda yang Telah Terpublikasi</h4>
      ${userReviews.length === 0 ? `
        <p style="font-size: 0.84rem; color: var(--c-text-muted);">Belum ada ulasan yang Anda tulis.</p>
      ` : userReviews.map(r => `
        <div style="border: 1px solid var(--c-light-gray); border-radius: 12px; padding: 14px; margin-bottom: 12px; background: #FFFFFF;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: var(--c-deep-navy); font-size: 0.9rem;">${r.productName || 'Perhiasan Mutiara CD\'E'}</strong>
            <span style="color: var(--c-champagne-gold); font-size: 0.85rem;">${'★'.repeat(r.rating || 5)}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--c-dark-text); line-height: 1.5; margin-bottom: 6px;">"${r.comment}"</p>
          <div style="font-size: 0.74rem; color: var(--c-text-muted);">${r.date} • Pembeli Terverifikasi</div>
        </div>
      `).join('')}
    </div>
  `;
}

function handleReviewSubmit(e) {
  e.preventDefault();
  const currentUser = CDEStore.getCurrentUser();
  if (!currentUser) return;

  const prodSelect = document.getElementById('reviewProductSelect');
  const ratingSelect = document.getElementById('reviewRatingSelect');
  const comment = document.getElementById('reviewComment').value.trim();

  const prodId = prodSelect.value;
  const prod = CDEStore.getProductById(prodId);

  CDEStore.addReview({
    productId: prodId,
    productName: prod ? prod.name : 'Perhiasan Mutiara',
    userId: currentUser.id,
    author: currentUser.name || currentUser.email,
    rating: parseInt(ratingSelect.value, 10),
    comment: comment,
    verifiedPurchase: true
  });

  showToast('Terima kasih! Ulasan Anda berhasil diterbitkan.');
  renderTabContent();
}

function handleLogout() {
  if (confirm('Apakah Anda yakin ingin keluar dari akun?')) {
    CDEStore.logout();
    showToast('Anda telah keluar dari akun.');
    renderCustomerView();
  }
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

// Ekspor ke window global
if (typeof window !== 'undefined') {
  window.switchAuthTab = switchAuthTab;
  window.quickDemoLogin = quickDemoLogin;
  window.switchDashboardTab = switchDashboardTab;
  window.handleLogout = handleLogout;
  window.handleSaveProfile = handleSaveProfile;
  window.handleReviewSubmit = handleReviewSubmit;
  window.removeWishlistItem = removeWishlistItem;
  window.moveWishlistToCart = moveWishlistToCart;
  window.followUpOrderWhatsApp = followUpOrderWhatsApp;
  window.showToast = showToast;
}
