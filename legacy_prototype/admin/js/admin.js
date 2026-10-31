/**
 * CDE PEARLS - SUPER ADMIN & ATELIER PORTAL CONTROLLER (v3.0)
 * Mengatur Dashboard KPI, Manajemen CRUD Produk Katalog, 5 Kategori Mutiara,
 * Penyesuaian Stok Mutiara, Pelacak Pesanan Dual-Status, CRM Leads WhatsApp,
 * Ulasan Pelanggan, RBAC Admin Users, Laporan Eksekutif, dan Gateway WhatsApp.
 */

let editingProductId = null;
let currentSearchQuery = '';
let currentFilterCategory = 'all';
let currentOrderStatusFilter = 'all';
let currentLeadStatusFilter = 'ALL';
let orderSearchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof CDEStore !== 'undefined') {
    initAdmin();
  } else {
    console.error('CDEStore belum termuat di admin.');
  }
});

function initAdmin() {
  checkAdminAuth();
  setupNavLinks();
  setupProductForm();
  setupSettingsForm();
  setupAdminUsersForm();
  setupLoginForm();

  // Listener event perubahan store (real-time sync)
  window.addEventListener('cde_store_updated', () => {
    refreshAllViews();
  });
}

// ==========================================================================
// 1. AUTENTIKASI & RBAC (ROLE-BASED ACCESS CONTROL)
// ==========================================================================
function checkAdminAuth() {
  const currentUser = CDEStore.getCurrentUser();
  const overlay = document.getElementById('adminLoginOverlay');
  const userBox = document.getElementById('admUserBox');

  if (!currentUser || currentUser.role === 'CUSTOMER') {
    // Tampilkan Login Overlay
    if (overlay) overlay.style.display = 'flex';
    if (userBox) userBox.style.display = 'none';
    return;
  }

  // Pengguna valid (ADMIN atau SUPER_ADMIN)
  if (overlay) overlay.style.display = 'none';
  if (userBox) userBox.style.display = 'flex';

  const nameEl = document.getElementById('admCurrentUserName');
  const emailEl = document.getElementById('admCurrentUserEmail');
  const roleBadgeEl = document.getElementById('admCurrentUserRoleBadge');

  if (nameEl) nameEl.textContent = currentUser.name || currentUser.email.split('@')[0];
  if (emailEl) emailEl.textContent = currentUser.email;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  if (roleBadgeEl) {
    roleBadgeEl.innerHTML = isSuperAdmin
      ? '<span class="role-badge-super">👑 SUPER ADMIN</span>'
      : '<span class="role-badge-admin">🛠 ADMIN ATELIER</span>';
  }

  // Terapkan pembatasan hak akses (Super Admin Only)
  const superAdminNavs = document.querySelectorAll('.sec-superadmin-only');
  superAdminNavs.forEach(nav => {
    if (isSuperAdmin) {
      nav.style.display = 'flex';
    } else {
      nav.style.display = 'none';
    }
  });

  // Render seluruh komponen
  refreshAllViews();
}

function setupLoginForm() {
  const form = document.getElementById('adminLoginForm');
  const alertBox = document.getElementById('loginAlertBox');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) return;

    const users = CDEStore.getUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser && existingUser.role === 'CUSTOMER') {
      if (alertBox) {
        alertBox.textContent = 'Akses Ditolak: Akun ini terdaftar sebagai Pembeli/Customer. Silakan gunakan kredensial administrator.';
        alertBox.style.display = 'block';
      }
      return;
    }

    // Login default role jika user baru masuk
    const role = (email.includes('super') || email.includes('direktur')) ? 'SUPER_ADMIN' : 'ADMIN';
    CDEStore.login(email, existingUser ? existingUser.role : role);

    if (alertBox) alertBox.style.display = 'none';
    checkAdminAuth();
    showAdminToast('✓ Selamat datang di Pusat Kontrol CD\'E Pearls.');
  });
}

function quickLoginDemo(email) {
  const role = email.includes('superadmin') ? 'SUPER_ADMIN' : 'ADMIN';
  CDEStore.login(email, role);
  const alertBox = document.getElementById('loginAlertBox');
  if (alertBox) alertBox.style.display = 'none';
  checkAdminAuth();
  showAdminToast(`✓ Masuk sebagai ${role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin Atelier'}.`);
}

function handleAdminLogout() {
  if (confirm('Apakah Anda yakin ingin keluar dari Pusat Kontrol Super Admin?')) {
    CDEStore.logout();
    checkAdminAuth();
    showAdminToast('Anda telah keluar dari sesi admin.');
  }
}

// ==========================================================================
// 2. NAVIGASI TAB UTAMA
// ==========================================================================
function setupNavLinks() {
  const navLinks = document.querySelectorAll('.adm-nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSectionId = link.getAttribute('data-target');
      if (targetSectionId) {
        switchAdminTab(targetSectionId);
      }
    });
  });
}

function switchAdminTab(targetTabId) {
  const navLinks = document.querySelectorAll('.adm-nav-link');
  navLinks.forEach(l => {
    if (l.getAttribute('data-target') === targetTabId) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });

  document.querySelectorAll('.adm-tab-content').forEach(sec => {
    sec.style.display = 'none';
  });

  const target = document.getElementById(targetTabId);
  if (target) {
    target.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Refresh Lucide icons jika ada icon baru
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function refreshAllViews() {
  updateKPIs();
  renderDashboardOverview();
  renderInventoryTable();
  renderCategoriesGrid();
  renderStockTable();
  renderOrdersTracker();
  renderLeadsTable();
  renderCustomersTable();
  renderReviewsTable();
  renderAdminUsersTable();
  renderReportsAndLogs();
  loadSettings();

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ==========================================================================
// 3. DASHBOARD METRICS & RECENT ACTIVITIES
// ==========================================================================
function updateKPIs() {
  const products = CDEStore.getProducts();
  const orders = CDEStore.getOrders();

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrdersCount = orders.length;
  const totalProductsCount = products.length;
  const totalPearlStock = products.reduce((sum, p) => sum + (parseInt(p.stock, 10) || 0), 0);

  const kpiRevenueEl = document.getElementById('kpiTotalRevenue');
  const kpiOrdersEl = document.getElementById('kpiTotalOrders');
  const kpiProductsEl = document.getElementById('kpiTotalProducts');
  const kpiStockEl = document.getElementById('kpiTotalStock');

  if (kpiRevenueEl) kpiRevenueEl.textContent = CDEStore.formatRupiah(totalRevenue);
  if (kpiOrdersEl) kpiOrdersEl.textContent = `${totalOrdersCount} Pesanan`;
  if (kpiProductsEl) kpiProductsEl.textContent = `${totalProductsCount} Desain`;
  if (kpiStockEl) kpiStockEl.textContent = `${totalPearlStock} Butir`;
}

function renderDashboardOverview() {
  const recentOrdersContainer = document.getElementById('dashboardRecentOrders');
  const recentLeadsContainer = document.getElementById('dashboardRecentLeads');

  const orders = CDEStore.getOrders().slice(0, 4);
  const leads = CDEStore.getLeads().slice(0, 4);

  // Recent Orders
  if (recentOrdersContainer) {
    if (orders.length === 0) {
      recentOrdersContainer.innerHTML = '<div style="color: var(--adm-text-muted); font-size: 0.85rem; padding: 12px 0;">Belum ada pesanan terbaru.</div>';
    } else {
      recentOrdersContainer.innerHTML = orders.map(o => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #EEF1F3;">
          <div>
            <div style="font-weight: 700; font-size: 0.88rem; color: var(--adm-text-main);">${o.customerName}</div>
            <div style="font-size: 0.75rem; color: var(--adm-text-muted);">${o.id} • ${o.date}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: var(--adm-gold-dark); font-size: 0.88rem;">${CDEStore.formatRupiah(o.total)}</div>
            <span class="badge-pay ${o.paymentStatus === 'PAID' ? 'badge-pay-paid' : 'badge-pay-waiting'}">${o.paymentStatus}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Recent Leads
  if (recentLeadsContainer) {
    if (leads.length === 0) {
      recentLeadsContainer.innerHTML = '<div style="color: var(--adm-text-muted); font-size: 0.85rem; padding: 12px 0;">Belum ada lead masuk.</div>';
    } else {
      recentLeadsContainer.innerHTML = leads.map(l => {
        const cleanPhone = (l.phone || '').replace(/\D/g, '');
        const waLink = `https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(l.customerName || 'Bapak/Ibu')},%20terima%20kasih%20telah%20menghubungi%20CDE%20Pearls%20Lombok.`;
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #EEF1F3;">
            <div>
              <div style="font-weight: 700; font-size: 0.88rem; color: var(--adm-text-main);">${l.customerName || 'Calon Pembeli'}</div>
              <div style="font-size: 0.75rem; color: var(--adm-text-muted);">${l.productName || l.phone}</div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge-lead badge-lead-${(l.status || 'NEW').toLowerCase()}">${l.status || 'NEW'}</span>
              <a href="${waLink}" target="_blank" class="btn-adm btn-adm-gold" style="padding: 4px 8px; font-size: 0.72rem;">Chat WA</a>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

// ==========================================================================
// 4. KATALOG INVENTARIS PRODUK (CRUD)
// ==========================================================================
function renderInventoryTable() {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;

  let products = CDEStore.getProducts();

  if (currentFilterCategory !== 'all') {
    products = products.filter(p => (p.categoryId || p.category || '').toLowerCase() === currentFilterCategory.toLowerCase());
  }

  if (currentSearchQuery.trim()) {
    const q = currentSearchQuery.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.pearlType && p.pearlType.toLowerCase().includes(q)) ||
      (p.certificate && p.certificate.toLowerCase().includes(q))
    );
  }

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--adm-text-muted);">
          Tidak ada koleksi perhiasan yang sesuai dengan filter pencarian.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const isLowStock = p.stock <= 3 && p.stock > 0;
    const isOutOfStock = p.stock <= 0;

    let statusBadge = '';
    if (isOutOfStock) {
      statusBadge = '<span class="badge-status" style="background:#FCEAEA; color:#A32828;">Habis (0 butir)</span>';
    } else if (isLowStock) {
      statusBadge = `<span class="badge-status low-stock">Menipis (${p.stock} butir)</span>`;
    } else {
      statusBadge = `<span class="badge-status in-stock">Tersedia (${p.stock} butir)</span>`;
    }

    return `
      <tr>
        <td>
          <img src="${p.image}" alt="${p.name}" class="table-thumb" style="width: 54px; height: 54px; object-fit: cover; border-radius: 8px;">
        </td>
        <td>
          <div style="font-weight: 700; color: var(--adm-text-main); font-size: 0.92rem;">${p.name}</div>
          <div style="font-size: 0.74rem; color: var(--adm-gold-dark); font-family: monospace;">
            Cert: ${p.certificate || 'CDE-CERT-8890'}
          </div>
        </td>
        <td>
          <span style="text-transform: uppercase; font-size: 0.74rem; font-weight: 700; background: #EEF1F3; padding: 3px 8px; border-radius: 4px;">
            ${p.category || p.categoryId}
          </span>
        </td>
        <td>
          <div style="font-size: 0.82rem; font-weight: 600;">${p.pearlType || 'South Sea'} (${p.pearlGrade || 'Grade AAA'})</div>
          <div style="font-size: 0.74rem; color: var(--adm-text-muted);">${p.metal || 'Emas 18K'} • ${p.pearlSize || ''}</div>
        </td>
        <td style="font-weight: 700; color: var(--adm-gold-dark);">
          ${CDEStore.formatRupiah(p.price)}
        </td>
        <td>
          ${statusBadge}
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-adm btn-adm-gold" style="padding: 6px 10px; font-size: 0.74rem;" onclick="editProduct('${p.id}')">
              Edit
            </button>
            <button class="btn-adm btn-adm-danger" style="padding: 6px 10px; font-size: 0.74rem;" onclick="deleteProduct('${p.id}')">
              Hapus
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupProductForm() {
  const form = document.getElementById('productForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const pearlType = document.getElementById('prodPearlType').value.trim();
    const pearlGrade = document.getElementById('prodPearlGrade').value;
    const pearlSize = document.getElementById('prodPearlSize').value.trim();
    const metal = document.getElementById('prodMetal').value.trim();
    const price = parseInt(document.getElementById('prodPrice').value, 10) || 0;
    const stock = parseInt(document.getElementById('prodStock').value, 10) || 0;
    const origin = document.getElementById('prodOrigin').value.trim() || 'Sekotong, Lombok Barat';
    const image = document.getElementById('prodImage').value.trim() || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80';
    const description = document.getElementById('prodDesc').value.trim();

    if (!name || price <= 0) {
      alert('Mohon lengkapi Nama Perhiasan dan Harga Jual.');
      return;
    }

    const payload = {
      name,
      category,
      categoryId: category,
      pearlType,
      pearlGrade,
      pearlSize,
      metal,
      price,
      stock,
      origin,
      image,
      description
    };

    if (editingProductId) {
      CDEStore.updateProduct(editingProductId, payload);
      showAdminToast('✓ Koleksi perhiasan berhasil diperbarui.');
      cancelEdit();
    } else {
      CDEStore.addProduct(payload);
      showAdminToast('✓ Koleksi perhiasan baru berhasil ditambahkan ke katalog.');
      form.reset();
    }
  });

  const searchInput = document.getElementById('tableSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      renderInventoryTable();
    });
  }

  const categoryFilter = document.getElementById('tableCategoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      currentFilterCategory = e.target.value;
      renderInventoryTable();
    });
  }
}

function editProduct(id) {
  const p = CDEStore.getProductById(id);
  if (!p) return;

  editingProductId = id;

  document.getElementById('prodName').value = p.name || '';
  document.getElementById('prodCategory').value = p.category || p.categoryId || 'kalung';
  document.getElementById('prodPearlType').value = p.pearlType || '';
  document.getElementById('prodPearlGrade').value = p.pearlGrade || 'Grade AAA';
  document.getElementById('prodPearlSize').value = p.pearlSize || '';
  document.getElementById('prodMetal').value = p.metal || '';
  document.getElementById('prodPrice').value = p.price || '';
  document.getElementById('prodStock').value = p.stock || 1;
  document.getElementById('prodOrigin').value = p.origin || '';
  document.getElementById('prodImage').value = p.image || '';
  document.getElementById('prodDesc').value = p.description || '';

  const submitBtn = document.getElementById('btnSubmitProduct');
  if (submitBtn) {
    submitBtn.textContent = 'Simpan Perubahan';
    submitBtn.className = 'btn-adm btn-adm-gold';
  }

  const cancelBtn = document.getElementById('btnCancelEdit');
  if (cancelBtn) cancelBtn.style.display = 'inline-block';

  document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
  editingProductId = null;
  const form = document.getElementById('productForm');
  if (form) form.reset();

  const submitBtn = document.getElementById('btnSubmitProduct');
  if (submitBtn) {
    submitBtn.textContent = '+ Tambah ke Katalog';
    submitBtn.className = 'btn-adm btn-adm-primary';
  }

  const cancelBtn = document.getElementById('btnCancelEdit');
  if (cancelBtn) cancelBtn.style.display = 'none';
}

function deleteProduct(id) {
  const p = CDEStore.getProductById(id);
  if (!p) return;

  if (confirm(`Apakah Anda yakin ingin menghapus "${p.name}" dari katalog perhiasan?`)) {
    CDEStore.deleteProduct(id);
    showAdminToast('Koleksi berhasil dihapus dari katalog.');
  }
}

// ==========================================================================
// 5. 5 KATEGORI MUTIARA
// ==========================================================================
function renderCategoriesGrid() {
  const container = document.getElementById('categoryAdminGrid');
  if (!container) return;

  const categories = CDEStore.getCategories();
  const products = CDEStore.getProducts();

  container.innerHTML = categories.map(cat => {
    const count = products.filter(p => (p.categoryId || p.category) === cat.id).length;
    return `
      <div class="category-admin-card">
        <div>
          <div class="category-admin-header">
            <div class="category-icon-box">
              <i data-lucide="gem" style="width: 22px; height: 22px;"></i>
            </div>
            <div>
              <div class="category-admin-title">${cat.name}</div>
              <div class="category-admin-count">${count} Koleksi Tersedia</div>
            </div>
          </div>
          <p class="category-admin-desc">${cat.description || 'Kategori perhiasan mutiara air laut Lombok pilihan.'}</p>
        </div>
        <button class="btn-adm btn-adm-primary" style="width: 100%; font-size: 0.78rem;" onclick="filterInventoryByCategory('${cat.id}')">
          Kelola Produk ${cat.name} →
        </button>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function filterInventoryByCategory(catId) {
  currentFilterCategory = catId;
  const filterSelect = document.getElementById('tableCategoryFilter');
  if (filterSelect) filterSelect.value = catId;
  switchAdminTab('tabInventory');
  renderInventoryTable();
}

// ==========================================================================
// 6. STOK BUTIR MUTIARA & FAST ADJUSTMENT
// ==========================================================================
function renderStockTable() {
  const tbody = document.getElementById('stockTableBody');
  const alertBanner = document.getElementById('lowStockAlertBanner');
  if (!tbody) return;

  const products = CDEStore.getProducts();
  let hasLowStock = false;

  tbody.innerHTML = products.map(p => {
    const isLow = p.stock <= 3 && p.stock > 0;
    const isZero = p.stock <= 0;
    if (isLow || isZero) hasLowStock = true;

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--adm-text-main); font-size: 0.9rem;">${p.name}</div>
          <div style="font-size: 0.74rem; color: var(--adm-text-muted); font-family: monospace;">Cert: ${p.certificate || '-'}</div>
        </td>
        <td>
          <span style="text-transform: uppercase; font-size: 0.72rem; font-weight: 700; background: #EEF1F3; padding: 2px 6px; border-radius: 4px;">
            ${p.category}
          </span>
        </td>
        <td>${p.pearlType || '-'} (${p.pearlGrade || 'AAA'})</td>
        <td>
          ${isZero ? '<span class="badge-status" style="background:#FCEAEA; color:#A32828;">HABIS</span>' : 
            isLow ? `<span class="badge-status low-stock">MENIPIS (${p.stock} butir)</span>` : 
            `<span class="badge-status in-stock">TERSEDIA (${p.stock} butir)</span>`}
        </td>
        <td style="text-align: center;">
          <div class="stock-adjust-group">
            <button type="button" class="btn-stock-step" onclick="adjustProductStock('${p.id}', -1)" title="Kurangi 1 butir">-</button>
            <span class="stock-val-display" id="stockDisplay_${p.id}">${p.stock}</span>
            <button type="button" class="btn-stock-step" onclick="adjustProductStock('${p.id}', 1)" title="Tambah 1 butir">+</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (alertBanner) {
    alertBanner.style.display = hasLowStock ? 'block' : 'none';
  }
}

function adjustProductStock(productId, delta) {
  const p = CDEStore.getProductById(productId);
  if (!p) return;

  const newStock = Math.max(0, (parseInt(p.stock, 10) || 0) + delta);
  CDEStore.updateProduct(productId, { stock: newStock });
  showAdminToast(`✓ Stok ${p.name} diperbarui menjadi ${newStock} butir.`);
}

// ==========================================================================
// 7. PESANAN & VERIFIKASI PEMBAYARAN
// ==========================================================================
function renderOrdersTracker() {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;

  let orders = CDEStore.getOrders();

  if (currentOrderStatusFilter !== 'all') {
    if (currentOrderStatusFilter === 'WAITING_PAYMENT' || currentOrderStatusFilter === 'PAID') {
      orders = orders.filter(o => o.paymentStatus === currentOrderStatusFilter);
    } else {
      orders = orders.filter(o => o.orderStatus === currentOrderStatusFilter);
    }
  }

  if (orderSearchQuery.trim()) {
    const q = orderSearchQuery.toLowerCase();
    orders = orders.filter(o => 
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.phone && o.phone.includes(q))
    );
  }

  if (orders.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 50px; color: var(--adm-text-muted);">
        Belum ada pesanan yang sesuai dengan filter ini.
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(order => {
    const cleanPhone = (order.phone || '').replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const directWaLink = `https://wa.me/${waPhone}?text=Halo%20${encodeURIComponent(order.customerName)},%20update%20pesanan%20CDE%20Pearls%20Lombok%20(${order.id}):%20Status%20pembayaran%20*${order.paymentStatus}*,%20status%20pesanan%20*${order.orderStatus}*.`;

    const isPaid = order.paymentStatus === 'PAID';

    return `
      <div class="order-card-adm">
        <!-- Kolom 1: ID & Pemesan -->
        <div>
          <div class="order-id-label">${order.id}</div>
          <div class="order-customer-name">${order.customerName}</div>
          <a href="${directWaLink}" target="_blank" class="order-phone-link">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.879.808 2.8.808 3.182 0 5.768-2.587 5.768-5.766.001-3.181-2.584-5.766-5.772-5.766zm8.905 5.767c0 4.936-4.015 8.95-8.905 8.95-1.579 0-3.047-.417-4.329-1.139l-4.702 1.233 1.258-4.597c-.822-1.344-1.294-2.923-1.294-4.447 0-4.936 4.016-8.95 8.905-8.95 4.937 0 8.906 4.014 8.906 8.95z"/></svg>
            ${order.phone}
          </a>
          <div style="font-size: 0.74rem; color: var(--adm-text-muted); margin-top: 4px;">
            ${order.date}
          </div>
        </div>

        <!-- Kolom 2: Rincian Barang & Pengiriman -->
        <div>
          <div class="order-items-preview">
            ${order.items.map(item => `
              <div style="margin-bottom: 4px;">
                • <strong>${item.name}</strong> (x${item.qty})<br>
                <span style="font-size: 0.73rem; color: #888;">${item.spec || ''}</span>
              </div>
            `).join('')}
          </div>
          <div style="font-size: 0.74rem; color: var(--adm-text-muted); margin-top: 6px;">
            Alamat: <em>${order.address}</em>
          </div>
        </div>

        <!-- Kolom 3: Total & Status Pembayaran -->
        <div>
          <div class="order-amount-text">${CDEStore.formatRupiah(order.total)}</div>
          <div style="font-size: 0.74rem; color: var(--adm-text-muted); margin-top: 2px;">
            ${order.courier || 'JNE YES'}
          </div>
          <div style="margin-top: 6px;">
            <span class="badge-pay ${isPaid ? 'badge-pay-paid' : 'badge-pay-waiting'}">
              ${order.paymentStatus}
            </span>
          </div>
          ${order.resi && order.resi !== '-' ? `
            <div style="font-size: 0.72rem; color: var(--adm-gold-dark); font-family: monospace; margin-top: 4px;">
              Resi: ${order.resi}
            </div>
          ` : ''}
        </div>

        <!-- Kolom 4: Aksi Verifikasi & Pengerjaan -->
        <div>
          <div style="margin-bottom: 6px;">
            <span class="badge-status ${order.orderStatus === 'PROCESSING' ? 'atelier' : order.orderStatus === 'SHIPPED' ? 'shipped' : 'pending'}">
              ${order.orderStatus}
            </span>
          </div>

          ${!isPaid ? `
            <button class="btn-adm btn-adm-gold" style="width: 100%; font-size: 0.74rem; padding: 6px 8px; margin-bottom: 6px;" onclick="verifyPaymentAction('${order.id}')">
              ✓ Konfirmasi Lunas (PAID)
            </button>
          ` : ''}

          <select class="adm-select" style="font-size: 0.76rem; padding: 6px 8px; width: 100%;" onchange="updateStatusAction('${order.id}', this.value)">
            <option value="PENDING" ${order.orderStatus === 'PENDING' ? 'selected' : ''}>Pending (Verifikasi)</option>
            <option value="PROCESSING" ${order.orderStatus === 'PROCESSING' ? 'selected' : ''}>Proses Atelier Lombok</option>
            <option value="SHIPPED" ${order.orderStatus === 'SHIPPED' ? 'selected' : ''}>Siap Kirim / Resi</option>
            <option value="DELIVERED" ${order.orderStatus === 'DELIVERED' ? 'selected' : ''}>Terkirim</option>
            <option value="COMPLETED" ${order.orderStatus === 'COMPLETED' ? 'selected' : ''}>Selesai</option>
          </select>
        </div>
      </div>
    `;
  }).join('');
}

function filterOrdersByStatus(status, btn) {
  currentOrderStatusFilter = status;
  document.querySelectorAll('.order-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderOrdersTracker();
}

function handleSearchOrders(query) {
  orderSearchQuery = query;
  renderOrdersTracker();
}

function verifyPaymentAction(orderId) {
  if (confirm(`Verifikasi pembayaran untuk pesanan ${orderId} sebagai LUNAS (PAID)?`)) {
    CDEStore.updatePaymentStatus(orderId, 'PAID');
    showAdminToast(`✓ Pembayaran ${orderId} berhasil diverifikasi LUNAS.`);
  }
}

function updateStatusAction(orderId, newStatus) {
  let resi = null;
  if (newStatus === 'SHIPPED') {
    resi = prompt('Masukkan Nomor Resi Ekspedisi Pengiriman Berasuransi:', 'JNE-LOM-' + Math.floor(10000000 + Math.random() * 90000000));
  }
  CDEStore.updateOrderStatus(orderId, newStatus, resi);
  showAdminToast(`✓ Status pesanan ${orderId} diubah menjadi ${newStatus}.`);
}

// ==========================================================================
// 8. WHATSAPP LEADS CRM
// ==========================================================================
function renderLeadsTable() {
  const tbody = document.getElementById('leadsTableBody');
  if (!tbody) return;

  let leads = CDEStore.getLeads();

  if (currentLeadStatusFilter !== 'ALL') {
    leads = leads.filter(l => (l.status || 'NEW') === currentLeadStatusFilter);
  }

  if (leads.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 30px; color: var(--adm-text-muted);">
          Belum ada data leads konsultasi WhatsApp yang tercatat.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = leads.map(lead => {
    const cleanPhone = (lead.phone || '').replace(/\D/g, '');
    const waLink = `https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(lead.customerName || 'Bapak/Ibu')},%20saya%20Concierge%20CDE%20Pearls%20Lombok.`;

    return `
      <tr>
        <td style="font-size: 0.78rem; color: var(--adm-text-muted);">${lead.createdAt || '-'}</td>
        <td style="font-weight: 700; color: var(--adm-text-main); font-size: 0.9rem;">${lead.customerName || 'Tamu Butik'}</td>
        <td>
          <a href="${waLink}" target="_blank" style="color: #25D366; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
            ${lead.phone || '-'}
          </a>
        </td>
        <td>
          <div style="font-size: 0.85rem; font-weight: 600;">${lead.productName || lead.inquiryType || 'Konsultasi Mutiara'}</div>
          <div style="font-size: 0.74rem; color: var(--adm-text-muted);">${lead.notes || ''}</div>
        </td>
        <td>
          <select class="adm-select" style="padding: 4px 8px; font-size: 0.75rem;" onchange="changeLeadStatus('${lead.id}', this.value)">
            <option value="NEW" ${(lead.status || 'NEW') === 'NEW' ? 'selected' : ''}>NEW (Baru)</option>
            <option value="CONTACTED" ${lead.status === 'CONTACTED' ? 'selected' : ''}>CONTACTED (Sedang Chat)</option>
            <option value="DEAL" ${lead.status === 'DEAL' ? 'selected' : ''}>DEAL (Pesan)</option>
            <option value="CANCELLED" ${lead.status === 'CANCELLED' ? 'selected' : ''}>CANCELLED (Batal)</option>
          </select>
        </td>
        <td>
          <a href="${waLink}" target="_blank" class="btn-adm btn-adm-gold" style="padding: 6px 12px; font-size: 0.74rem; text-decoration: none;">
            Buka Chat WA
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function filterLeads(status, btn) {
  currentLeadStatusFilter = status;
  document.querySelectorAll('.lead-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderLeadsTable();
}

function changeLeadStatus(leadId, status) {
  CDEStore.updateLeadStatus(leadId, status);
  showAdminToast(`✓ Status lead berhasil diubah ke ${status}.`);
}

function promptAddManualLead() {
  const name = prompt('Nama Calon Pembeli:');
  if (!name) return;
  const phone = prompt('Nomor WhatsApp (contoh: 08123456789):');
  if (!phone) return;
  const product = prompt('Produk / Kebutuhan yang diminati:', 'Kalung Mutiara South Sea');

  CDEStore.addLead({
    customerName: name,
    phone: phone,
    productName: product,
    notes: 'Input manual oleh admin concierge'
  });

  showAdminToast('✓ Lead baru berhasil dicatat.');
}

// ==========================================================================
// 9. PELANGGAN & ULASAN
// ==========================================================================
function renderCustomersTable() {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  const users = CDEStore.getUsers().filter(u => u.role === 'CUSTOMER');
  const orders = CDEStore.getOrders();

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px;">Belum ada pelanggan terdaftar.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const userOrders = orders.filter(o => o.userId === u.id);
    const totalSpent = userOrders.reduce((s, o) => s + (o.total || 0), 0);

    return `
      <tr>
        <td style="font-weight: 700; color: var(--adm-text-main); font-size: 0.9rem;">${u.name}</td>
        <td style="font-size: 0.85rem; color: var(--adm-text-muted);">${u.email}</td>
        <td>${u.phone || '-'}</td>
        <td style="font-size: 0.82rem;">${u.address || '-'}</td>
        <td style="font-size: 0.82rem; color: var(--adm-text-muted);">${u.createdAt || '-'}</td>
        <td style="font-weight: 700; color: var(--adm-gold-dark);">
          ${userOrders.length} Pesanan (${CDEStore.formatRupiah(totalSpent)})
        </td>
      </tr>
    `;
  }).join('');
}

function renderReviewsTable() {
  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;

  const reviews = CDEStore.getReviews();

  if (reviews.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px;">Belum ada ulasan testimoni.</td></tr>`;
    return;
  }

  tbody.innerHTML = reviews.map(r => {
    const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(Math.max(0, 5 - (r.rating || 5)));
    return `
      <tr>
        <td style="font-weight: 600; font-size: 0.85rem;">${r.productId || 'Koleksi CDE'}</td>
        <td style="font-weight: 700;">${r.userName}</td>
        <td style="color: #D97706; font-size: 0.95rem;">${stars}</td>
        <td style="font-size: 0.78rem; color: var(--adm-text-muted);">${r.date}</td>
        <td style="font-size: 0.82rem; color: #334155;"><em>"${r.comment}"</em></td>
        <td>
          <button class="btn-adm btn-adm-danger" style="padding: 4px 8px; font-size: 0.72rem;" onclick="deleteReviewAction('${r.id}')">
            Hapus
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function deleteReviewAction(reviewId) {
  if (confirm('Apakah Anda yakin ingin menghapus testimoni ini?')) {
    CDEStore.deleteReview(reviewId);
    showAdminToast('Ulasan berhasil dihapus.');
  }
}

// ==========================================================================
// 10. ADMIN USERS (SUPER ADMIN ONLY)
// ==========================================================================
function renderAdminUsersTable() {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;

  const users = CDEStore.getUsers().filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
  const currentUser = CDEStore.getCurrentUser();

  tbody.innerHTML = users.map(u => {
    const isSelf = currentUser && currentUser.id === u.id;
    return `
      <tr>
        <td style="font-weight: 700; color: var(--adm-text-main); font-size: 0.9rem;">${u.name} ${isSelf ? '(Anda)' : ''}</td>
        <td style="font-size: 0.85rem;">${u.email}</td>
        <td>
          <span class="${u.role === 'SUPER_ADMIN' ? 'role-badge-super' : 'role-badge-admin'}">
            ${u.role}
          </span>
        </td>
        <td style="font-size: 0.82rem; color: var(--adm-text-muted);">${u.createdAt || '-'}</td>
        <td>
          ${!isSelf ? `
            <div style="display: flex; gap: 6px;">
              <button class="btn-adm btn-adm-gold" style="padding: 4px 8px; font-size: 0.72rem;" onclick="toggleUserRoleAction('${u.id}', '${u.role}')">
                Ganti Peran
              </button>
              <button class="btn-adm btn-adm-danger" style="padding: 4px 8px; font-size: 0.72rem;" onclick="deleteUserAction('${u.id}')">
                Hapus
              </button>
            </div>
          ` : '<span style="font-size: 0.75rem; color: #888;">Akun Aktif</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

function setupAdminUsersForm() {
  const form = document.getElementById('addAdminUserForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newAdminName').value.trim();
    const email = document.getElementById('newAdminEmail').value.trim();
    const role = document.getElementById('newAdminRole').value;

    if (!name || !email) return;

    CDEStore.addUser({ name, email, role });
    showAdminToast(`✓ Akun admin baru "${name}" (${role}) berhasil dibuat.`);
    form.reset();
  });
}

function toggleUserRoleAction(userId, currentRole) {
  const newRole = currentRole === 'SUPER_ADMIN' ? 'ADMIN' : 'SUPER_ADMIN';
  if (confirm(`Ubah peran administrator ini menjadi ${newRole}?`)) {
    CDEStore.updateUserRole(userId, newRole);
    showAdminToast(`✓ Peran pengguna diperbarui menjadi ${newRole}.`);
  }
}

function deleteUserAction(userId) {
  if (confirm('Hapus akun administrator ini dari sistem?')) {
    CDEStore.deleteUser(userId);
    showAdminToast('Akun administrator telah dihapus.');
  }
}

// ==========================================================================
// 11. LAPORAN KINERJA & AUDIT LOGS (SUPER ADMIN ONLY)
// ==========================================================================
function renderReportsAndLogs() {
  const orders = CDEStore.getOrders();
  const products = CDEStore.getProducts();
  const categories = CDEStore.getCategories();
  const logs = CDEStore.getAuditLogs();

  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
  const paidRevenue = paidOrders.reduce((s, o) => s + (o.total || 0), 0);
  const aov = paidOrders.length > 0 ? Math.round(paidRevenue / paidOrders.length) : 0;
  const itemsSold = paidOrders.reduce((s, o) => s + (o.items ? o.items.reduce((sum, item) => sum + (item.qty || 1), 0) : 0), 0);

  const repRevenueEl = document.getElementById('repTotalPaidRevenue');
  const repAovEl = document.getElementById('repAverageOrderValue');
  const repItemsSoldEl = document.getElementById('repTotalItemsSold');

  if (repRevenueEl) repRevenueEl.textContent = CDEStore.formatRupiah(paidRevenue);
  if (repAovEl) repAovEl.textContent = CDEStore.formatRupiah(aov);
  if (repItemsSoldEl) repItemsSoldEl.textContent = `${itemsSold} Butir Mutiara`;

  // Breakdown Kategori
  const catTbody = document.getElementById('categoryReportTableBody');
  if (catTbody) {
    catTbody.innerHTML = categories.map(cat => {
      const catProducts = products.filter(p => (p.categoryId || p.category) === cat.id);
      const catOrders = orders.filter(o => o.items && o.items.some(it => catProducts.some(cp => cp.id === it.id || cp.name === it.name)));
      const catRevenue = catOrders.reduce((s, o) => s + (o.total || 0), 0);

      return `
        <tr>
          <td style="font-weight: 700; color: var(--adm-text-main); font-size: 0.9rem;">${cat.name}</td>
          <td>${catProducts.length} Desain</td>
          <td>${catOrders.length} Pesanan</td>
          <td style="font-weight: 700; color: var(--adm-gold-dark);">${CDEStore.formatRupiah(catRevenue)}</td>
        </tr>
      `;
    }).join('');
  }

  // Audit Logs Table
  const auditTbody = document.getElementById('auditLogsTableBody');
  if (auditTbody) {
    if (logs.length === 0) {
      auditTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px;">Belum ada catatan log aktivitas.</td></tr>`;
      return;
    }

    auditTbody.innerHTML = logs.slice(0, 30).map(log => `
      <tr>
        <td style="font-size: 0.76rem; color: var(--adm-text-muted); font-family: monospace;">${log.timestamp || '-'}</td>
        <td style="font-weight: 600; font-size: 0.85rem;">${log.user}</td>
        <td>
          <span class="audit-log-badge">${log.role}</span>
        </td>
        <td style="font-weight: 700; font-size: 0.82rem; color: var(--adm-info);">${log.action}</td>
        <td style="font-size: 0.82rem; color: #475569;">${log.details || '-'}</td>
      </tr>
    `).join('');
  }
}

// ==========================================================================
// 12. GATEWAY WHATSAPP & LIVE PREVIEW
// ==========================================================================
function loadSettings() {
  const settings = CDEStore.getSettings();
  const phoneInput = document.getElementById('setWhatsAppPhone');
  const addressInput = document.getElementById('setAddress');
  const greetingInput = document.getElementById('setGreeting');

  if (phoneInput) phoneInput.value = settings.whatsappNumber || '6281239887766';
  if (addressInput) addressInput.value = settings.boutiqueAddress || 'Jl. Raya Senggigi No. 88, Lombok Barat, NTB';
  if (greetingInput) greetingInput.value = settings.templateGreeting || 'Mohon informasi petunjuk nomor rekening resmi CDE Pearls Lombok. Terima kasih!';

  updateWaPreview();
}

function setupSettingsForm() {
  const form = document.getElementById('settingsForm');
  if (!form) return;

  const phoneInput = document.getElementById('setWhatsAppPhone');
  const greetingInput = document.getElementById('setGreeting');

  if (phoneInput) phoneInput.addEventListener('input', updateWaPreview);
  if (greetingInput) greetingInput.addEventListener('input', updateWaPreview);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = document.getElementById('setAddress') ? document.getElementById('setAddress').value.trim() : '';
    const greeting = greetingInput ? greetingInput.value.trim() : '';

    CDEStore.saveSettings({
      whatsappNumber: phone,
      boutiqueAddress: address,
      templateGreeting: greeting
    });

    showAdminToast('✓ Pengaturan Gateway WhatsApp berhasil diperbarui.');
  });
}

function updateWaPreview() {
  const previewEl = document.getElementById('waTemplatePreview');
  const phoneInput = document.getElementById('setWhatsAppPhone');
  const greetingInput = document.getElementById('setGreeting');

  const phone = phoneInput ? phoneInput.value : '6281239887766';
  const greeting = greetingInput ? greetingInput.value : '';

  if (previewEl) {
    previewEl.textContent = 
`*PESANAN PERHIASAN MUTIARA CD'E PEARLS LOMBOK*
━━━━━━━━━━━━━━━━━━━━━
*No. Pesanan:* CDE-2026-0041
*Tanggal:* 13 Sep 2026, 09:30

*DATA PEMESAN:*
• Nama Lengkap: *Ibu Ratna Paramitha*
• No. WhatsApp: 081298765432
• Alamat Kirim: Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan
• Ekspedisi: JNE YES (Berasuransi Penuh)

*RINCIAN PERHIASAN:*
1. *Kalung Mutiara Lombok Royal Queen South Sea Gold* (x1)
   • Spesifikasi: Panjang 45cm, Emas Kuning 18K Solid
   • Harga: Rp 38.500.000

━━━━━━━━━━━━━━━━━━━━━
• Subtotal: Rp 38.500.000
• Asuransi Pengiriman: Rp 50.000
• Sertifikat & Velvet Box: *GRATIS (Sertifikat Lab Gemologi CDE)*
• *TOTAL INVESTASI:* *Rp 38.550.000*
━━━━━━━━━━━━━━━━━━━━━
${greeting || 'Mohon informasi petunjuk nomor rekening resmi CDE Pearls. Terima kasih!'}`;
  }
}

// ==========================================================================
// 13. TOAST NOTIFIKASI ADMIN
// ==========================================================================
function showAdminToast(msg) {
  let toast = document.getElementById('admToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0B1F33;
      color: #FFFFFF;
      border-left: 4px solid #C9A96E;
      padding: 14px 22px;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      font-size: 0.88rem;
      z-index: 99999;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 3200);
}

// Global Export untuk Handler HTML
window.quickLoginDemo = quickLoginDemo;
window.handleAdminLogout = handleAdminLogout;
window.switchAdminTab = switchAdminTab;
window.editProduct = editProduct;
window.cancelEdit = cancelEdit;
window.deleteProduct = deleteProduct;
window.filterInventoryByCategory = filterInventoryByCategory;
window.adjustProductStock = adjustProductStock;
window.filterOrdersByStatus = filterOrdersByStatus;
window.handleSearchOrders = handleSearchOrders;
window.verifyPaymentAction = verifyPaymentAction;
window.updateStatusAction = updateStatusAction;
window.filterLeads = filterLeads;
window.changeLeadStatus = changeLeadStatus;
window.promptAddManualLead = promptAddManualLead;
window.deleteReviewAction = deleteReviewAction;
window.toggleUserRoleAction = toggleUserRoleAction;
window.deleteUserAction = deleteUserAction;
