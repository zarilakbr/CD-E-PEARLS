/**
 * CDE PEARLS - INTERACTIVE PEARL JEWELRY CUSTOMIZER (ATELIER STUDIO)
 * Mengatur builder perhiasan 4 tahap, visualizer rendering dinamis,
 * perhitungan harga real-time, dan pemesanan custom ke keranjang / WhatsApp.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCustomizer();
  updateCartBadge();

  window.addEventListener('cde_store_updated', () => {
    updateCartBadge();
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

// State Konfigurasi Perhiasan Custom
const customState = {
  step: 1,
  basis: {
    id: 'cincin',
    name: 'Cincin Solitaire',
    category: 'cincin',
    basePrice: 6500000,
    graphicClass: 'render-base-ring'
  },
  pearl: {
    id: 'gold',
    name: 'Lombok Golden South Sea Pearl',
    grade: 'Grade AAA (Metallic Gold Luster)',
    basePrice: 14500000,
    diameter: 12, // mm
    swatchClass: 'swatch-gold'
  },
  metal: {
    id: 'emas_kuning',
    name: 'Solid Yellow Gold 18K (750)',
    priceAdj: 0,
    hex: '#D4AF37'
  },
  size: 14, // Nomor ukuran cincin (atau cm untuk kalung)
  engraving: ''
};

// Data Pilihan Basis Perhiasan (Ikon SVG Bersih Tanpa Emoji)
const BASIS_OPTIONS = [
  { 
    id: 'cincin', 
    name: 'Cincin Solitaire', 
    desc: 'Desain ergonomis elegan dengan dudukan 4-prong pengaman.', 
    basePrice: 6500000, 
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="7"></circle><path d="M12 7V3"></path><path d="M9 4l3-2 3 2"></path></svg>', 
    graphic: 'render-base-ring' 
  },
  { 
    id: 'kalung', 
    name: 'Kalung Liontin', 
    desc: 'Rantai halus kokoh dengan liontin mutiara menggantung anggun.', 
    basePrice: 7200000, 
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="18" r="2"></circle></svg>', 
    graphic: 'render-base-necklace' 
  },
  { 
    id: 'gelang', 
    name: 'Gelang Rantai Tenun', 
    desc: 'Aksen gelang tangan dengan jepit gesper ukir khas Lombok.', 
    basePrice: 8500000, 
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="4" r="1.5"></circle><circle cx="12" cy="20" r="1.5"></circle></svg>', 
    graphic: 'render-base-bracelet' 
  },
  { 
    id: 'anting', 
    name: 'Anting Drop Gantung', 
    desc: 'Sepasang anting gantung berayun lembut menangkap cahaya.', 
    basePrice: 5800000, 
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 6v8a5 5 0 0 0 10 0V6"></path><circle cx="12" cy="19" r="2"></circle></svg>', 
    graphic: 'render-base-earring' 
  },
  { 
    id: 'bros', 
    name: 'Bros Kebaya Klasik', 
    desc: 'Bros serbaguna berornamen bunga Lombok untuk busana resmi.', 
    basePrice: 9200000, 
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>', 
    graphic: 'render-base-brooch' 
  }
];

// Data Pilihan Mutiara Lombok
const PEARL_OPTIONS = [
  { id: 'gold', name: 'Lombok Golden South Sea', desc: 'Kilau emas cermin pekat dari tiram Pinctada Maxima Lombok.', basePrice: 14500000, swatch: 'swatch-gold', grade: 'Grade AAA (Metallic Gold)' },
  { id: 'white', name: 'Lombok Silvery White', desc: 'Warna putih keperakan alami dengan pantulan cahaya murni.', basePrice: 12000000, swatch: 'swatch-white', grade: 'Grade AAA (Silvery White)' },
  { id: 'tahitian', name: 'Tahitian Peacock Black', desc: 'Pantulan gelap eksotis rona hijau merak dan terong mutiara.', basePrice: 11500000, swatch: 'swatch-tahitian', grade: 'Grade AAA (Peacock Green/Black)' },
  { id: 'champagne', name: 'Lombok Champagne Pearl', desc: 'Warna sampanye lembut memberikan nuansa hangat nan mewah.', basePrice: 9800000, swatch: 'swatch-champagne', grade: 'Grade AA+ (Warm Champagne)' }
];

// Data Pilihan Logam Mulia
const METAL_OPTIONS = [
  { id: 'emas_kuning', name: 'Emas Kuning 18K (750)', desc: 'Paduan emas murni 75% tahan lama & anti-kusam.', priceAdj: 0, hex: '#D4AF37', pillClass: 'metal-yellow' },
  { id: 'emas_putih', name: 'Emas Putih 18K + Rhodium', desc: 'Kilau putih mewah modern berlapis rhodium Eropa.', priceAdj: 300000, hex: '#C8D1D9', pillClass: 'metal-white' },
  { id: 'rose_gold', name: 'Rose Gold 18K (Pink Gold)', desc: 'Nuansa tembaga elegan yang feminin dan memikat.', priceAdj: 100000, hex: '#E09F8C', pillClass: 'metal-rose' },
  { id: 'perak_925', name: 'Perak 925 Berlapis Emas Putih', desc: 'Alternatif bernilai tinggi perak murni lapis emas putih.', priceAdj: -4500000, hex: '#B0B7BD', pillClass: 'metal-silver' }
];

// Inisialisasi Studio
function initCustomizer() {
  renderStepOptions();
  setupEventListeners();
  initThreeDVisualizer();
  updateVisualizer();
  updatePricingAndSummary();
}

// Render Opsi Pada Tiap Tab Wizard
function renderStepOptions() {
  // Step 1: Basis
  const basisContainer = document.getElementById('basisOptionsContainer');
  if (basisContainer) {
    basisContainer.innerHTML = BASIS_OPTIONS.map(opt => `
      <div class="option-card ${opt.id === customState.basis.id ? 'selected' : ''}" onclick="selectBasis('${opt.id}')">
        <div class="option-icon-box">${opt.icon}</div>
        <div>
          <div class="option-title">${opt.name}</div>
          <div class="option-sub">${opt.desc}</div>
        </div>
        <div class="option-price-tag">Mulai ${CDEStore.formatRupiah(opt.basePrice)}</div>
      </div>
    `).join('');
  }

  // Step 2: Mutiara
  const pearlContainer = document.getElementById('pearlOptionsContainer');
  if (pearlContainer) {
    pearlContainer.innerHTML = PEARL_OPTIONS.map(opt => `
      <div class="option-card ${opt.id === customState.pearl.id ? 'selected' : ''}" onclick="selectPearl('${opt.id}')">
        <div class="pearl-swatch ${opt.swatch}"></div>
        <div style="text-align: center;">
          <div class="option-title">${opt.name}</div>
          <div class="option-sub">${opt.grade}</div>
        </div>
        <div class="option-price-tag" style="text-align: center;">${CDEStore.formatRupiah(opt.basePrice)}</div>
      </div>
    `).join('');
  }

  // Step 3: Logam
  const metalContainer = document.getElementById('metalOptionsContainer');
  if (metalContainer) {
    metalContainer.innerHTML = METAL_OPTIONS.map(opt => `
      <div class="option-card ${opt.id === customState.metal.id ? 'selected' : ''}" onclick="selectMetal('${opt.id}')">
        <div class="metal-pill">
          <div class="metal-dot" style="background: ${opt.hex};"></div>
          <div class="option-title" style="margin: 0;">${opt.name}</div>
        </div>
        <div class="option-sub" style="margin-top: 6px;">${opt.desc}</div>
        <div class="option-price-tag">
          ${opt.priceAdj === 0 ? 'Harga Standar Rangka' : (opt.priceAdj > 0 ? '+ ' + CDEStore.formatRupiah(opt.priceAdj) : '- ' + CDEStore.formatRupiah(Math.abs(opt.priceAdj)))}
        </div>
      </div>
    `).join('');
  }
}

// Setup Event Listener
function setupEventListeners() {
  // Stepper Items Klik
  const stepItems = document.querySelectorAll('.step-item');
  stepItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetStep = parseInt(item.getAttribute('data-step'), 10);
      goToStep(targetStep);
    });
  });

  // Tombol Next & Prev
  const btnNext = document.getElementById('btnNextStep');
  const btnPrev = document.getElementById('btnPrevStep');

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (customState.step < 4) {
        goToStep(customState.step + 1);
      } else {
        handleOrderCustom();
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (customState.step > 1) {
        goToStep(customState.step - 1);
      }
    });
  }

  // Slider Diameter Mutiara
  const pearlDiameterSlider = document.getElementById('pearlDiameterSlider');
  const pearlDiameterVal = document.getElementById('pearlDiameterVal');
  if (pearlDiameterSlider && pearlDiameterVal) {
    pearlDiameterSlider.addEventListener('input', (e) => {
      customState.pearl.diameter = parseFloat(e.target.value);
      pearlDiameterVal.textContent = customState.pearl.diameter + ' mm';
      updateVisualizer();
      updatePricingAndSummary();
    });
  }

  // Slider Ukuran Cincin / Panjang
  const sizeSlider = document.getElementById('sizeSlider');
  const sizeValueDisplay = document.getElementById('sizeValueDisplay');
  if (sizeSlider && sizeValueDisplay) {
    sizeSlider.addEventListener('input', (e) => {
      customState.size = e.target.value;
      sizeValueDisplay.textContent = customState.basis.id === 'kalung' 
        ? customState.size + ' cm' 
        : 'Ukuran ' + customState.size;
      updatePricingAndSummary();
    });
  }

  // Input Grafir Nama
  const engravingInput = document.getElementById('engravingInput');
  if (engravingInput) {
    engravingInput.addEventListener('input', (e) => {
      customState.engraving = e.target.value.trim();
      updatePricingAndSummary();
    });
  }

  // Tombol Pesan Custom di Box Summary
  const btnOrderSummary = document.getElementById('btnOrderCustomNow');
  if (btnOrderSummary) {
    btnOrderSummary.addEventListener('click', handleOrderCustom);
  }
}

// Navigasi Pindah Step
function goToStep(stepNum) {
  customState.step = stepNum;

  // Update Stepper Visual
  const stepItems = document.querySelectorAll('.step-item');
  stepItems.forEach(item => {
    const s = parseInt(item.getAttribute('data-step'), 10);
    item.classList.remove('active', 'completed');
    if (s === stepNum) {
      item.classList.add('active');
    } else if (s < stepNum) {
      item.classList.add('completed');
    }
  });

  const progress = document.querySelector('.stepper-progress');
  if (progress) {
    progress.style.width = ((stepNum - 1) / 3 * 100) + '%';
  }

  // Update Tampilan Panel
  const panels = document.querySelectorAll('.step-panel');
  panels.forEach(p => p.classList.remove('active'));
  const activePanel = document.getElementById(`stepPanel${stepNum}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  // Update Nav Buttons
  const btnPrev = document.getElementById('btnPrevStep');
  const btnNext = document.getElementById('btnNextStep');
  if (btnPrev) {
    btnPrev.style.visibility = stepNum === 1 ? 'hidden' : 'visible';
  }
  if (btnNext) {
    if (stepNum === 4) {
      btnNext.innerHTML = 'Pesan Custom Sekarang';
      btnNext.className = 'btn btn-gold';
    } else {
      btnNext.innerHTML = 'Langkah Selanjutnya →';
      btnNext.className = 'btn btn-dark';
    }
  }

  // Penyesuaian label slider ukuran di step 4
  const sizeSliderLabel = document.getElementById('sizeSliderLabel');
  const sizeSlider = document.getElementById('sizeSlider');
  const sizeValueDisplay = document.getElementById('sizeValueDisplay');
  if (sizeSliderLabel && sizeSlider) {
    if (customState.basis.id === 'kalung') {
      sizeSliderLabel.textContent = 'Panjang Rantai Kalung:';
      sizeSlider.min = '40';
      sizeSlider.max = '60';
      sizeSlider.value = '45';
      customState.size = 45;
      if (sizeValueDisplay) sizeValueDisplay.textContent = '45 cm';
    } else if (customState.basis.id === 'gelang') {
      sizeSliderLabel.textContent = 'Lingkar Pergelangan Tangan:';
      sizeSlider.min = '15';
      sizeSlider.max = '22';
      sizeSlider.value = '17';
      customState.size = 17;
      if (sizeValueDisplay) sizeValueDisplay.textContent = '17 cm';
    } else {
      sizeSliderLabel.textContent = 'Ukuran Jari / Cincin (HK Size):';
      sizeSlider.min = '10';
      sizeSlider.max = '24';
      sizeSlider.value = '14';
      customState.size = 14;
      if (sizeValueDisplay) sizeValueDisplay.textContent = 'Ukuran 14';
    }
  }
}

// Aksi Pilih Basis
function selectBasis(id) {
  const opt = BASIS_OPTIONS.find(b => b.id === id);
  if (!opt) return;
  customState.basis = {
    id: opt.id,
    name: opt.name,
    category: opt.id,
    basePrice: opt.basePrice,
    graphicClass: opt.graphic
  };
  renderStepOptions();
  updateVisualizer();
  updatePricingAndSummary();
}

// Aksi Pilih Mutiara
function selectPearl(id) {
  const opt = PEARL_OPTIONS.find(p => p.id === id);
  if (!opt) return;
  customState.pearl.id = opt.id;
  customState.pearl.name = opt.name;
  customState.pearl.grade = opt.grade;
  customState.pearl.basePrice = opt.basePrice;
  customState.pearl.swatchClass = opt.swatch;
  renderStepOptions();
  updateVisualizer();
  updatePricingAndSummary();
}

// Aksi Pilih Logam
function selectMetal(id) {
  const opt = METAL_OPTIONS.find(m => m.id === id);
  if (!opt) return;
  customState.metal = {
    id: opt.id,
    name: opt.name,
    priceAdj: opt.priceAdj,
    hex: opt.hex
  };
  renderStepOptions();
  updateVisualizer();
  updatePricingAndSummary();
}

// Update Visualizer Render Grafis Real-Time
function updateVisualizer() {
  const baseGraphic = document.getElementById('renderBaseGraphic');
  const pearlOrb = document.getElementById('renderPearlOrb');
  const liveBadge = document.getElementById('renderBadgeLiveText');

  if (baseGraphic) {
    // Reset classes
    baseGraphic.className = 'render-base-graphic ' + customState.basis.graphicClass;
    baseGraphic.style.borderColor = customState.metal.hex;
  }

  if (pearlOrb) {
    // Terapkan gradien mutiara
    let bgGradient = '';
    if (customState.pearl.id === 'gold') {
      bgGradient = 'radial-gradient(circle at 35% 35%, #FFF6DD 0%, #D4AF37 50%, #7A5817 100%)';
    } else if (customState.pearl.id === 'white') {
      bgGradient = 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #E8EEF5 55%, #A8B4C0 100%)';
    } else if (customState.pearl.id === 'tahitian') {
      bgGradient = 'radial-gradient(circle at 35% 35%, #4C6E66 0%, #1A2624 55%, #0B1110 100%)';
    } else if (customState.pearl.id === 'champagne') {
      bgGradient = 'radial-gradient(circle at 35% 35%, #FFF8F0 0%, #E2C3A0 55%, #8A653E 100%)';
    }
    pearlOrb.style.background = bgGradient;

    // Skala diameter mutiara (antara 64px sampai 90px sesuai diameter mm)
    const baseSizePx = 54 + (customState.pearl.diameter * 2.5);
    pearlOrb.style.width = baseSizePx + 'px';
    pearlOrb.style.height = baseSizePx + 'px';
  }

  if (liveBadge) {
    liveBadge.textContent = `${customState.basis.name} • ${customState.pearl.diameter}mm`;
  }

  // Perbarui Model 3D WebGL Three.js Real-time
  if (typeof updateThreeDModel === 'function') {
    updateThreeDModel();
  }
}

// Hitung Harga dan Perbarui Teks Ringkasan
function updatePricingAndSummary() {
  // Formula:
  // Harga Logam = Basis Base Price + Metal Price Adj
  const metalPrice = Math.max(1000000, customState.basis.basePrice + customState.metal.priceAdj);
  
  // Harga Mutiara berskala diameter: faktor (diameter / 11) ^ 1.4
  const diameterFactor = Math.pow(customState.pearl.diameter / 11, 1.4);
  const pearlPrice = Math.round(customState.pearl.basePrice * diameterFactor / 100000) * 100000;

  const grandTotal = metalPrice + pearlPrice;

  // Update Nilai di DOM
  const sumBasis = document.getElementById('sumBasis');
  const sumPearl = document.getElementById('sumPearl');
  const sumMetal = document.getElementById('sumMetal');
  const sumSize = document.getElementById('sumSize');
  const sumEngraving = document.getElementById('sumEngraving');

  if (sumBasis) sumBasis.textContent = customState.basis.name;
  if (sumPearl) sumPearl.textContent = `${customState.pearl.name} (${customState.pearl.diameter}mm, ${customState.pearl.grade.split('(')[0].trim()})`;
  if (sumMetal) sumMetal.textContent = customState.metal.name;
  if (sumSize) {
    sumSize.textContent = customState.basis.id === 'kalung' ? `${customState.size} cm` : (customState.basis.id === 'gelang' ? `${customState.size} cm` : `Ukuran ${customState.size}`);
  }
  if (sumEngraving) {
    sumEngraving.textContent = customState.engraving ? `"${customState.engraving}"` : 'Tanpa Grafir';
  }

  // Update Harga Breakdown
  const priceMetalEl = document.getElementById('breakdownMetalPrice');
  const pricePearlEl = document.getElementById('breakdownPearlPrice');
  const totalEl = document.getElementById('breakdownTotalPrice');

  if (priceMetalEl) priceMetalEl.textContent = CDEStore.formatRupiah(metalPrice);
  if (pricePearlEl) pricePearlEl.textContent = CDEStore.formatRupiah(pearlPrice);
  if (totalEl) totalEl.textContent = CDEStore.formatRupiah(grandTotal);

  return {
    metalPrice,
    pearlPrice,
    grandTotal
  };
}

// Handler Saat Tombol "Pesan Custom Sekarang" Ditekan
function handleOrderCustom() {
  const pricing = updatePricingAndSummary();

  const customItem = {
    id: 'cde-custom-' + Date.now(),
    name: `Kustom ${customState.basis.name} (${customState.pearl.name})`,
    price: pricing.grandTotal,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    pearlType: `${customState.pearl.name} ${customState.pearl.diameter}mm`,
    pearlGrade: customState.pearl.grade,
    metal: customState.metal.name,
    customSpec: `Basis: ${customState.basis.name}, Mutiara: ${customState.pearl.name} ${customState.pearl.diameter}mm, Logam: ${customState.metal.name}, Ukuran: ${customState.size}${customState.engraving ? ', Grafir: "' + customState.engraving + '"' : ''}`,
    certificate: 'CDE-CUSTOM-CERT-' + Math.floor(1000 + Math.random() * 9000),
    qty: 1
  };

  CDEStore.addToCart(customItem);
  
  if (typeof showToast === 'function') {
    showToast('Desain kustom Anda berhasil disimpan ke Keranjang Belanja.');
  }

  // Redirect ke halaman keranjang untuk checkout
  setTimeout(() => {
    window.location.href = 'cart.html';
  }, 600);
}

// =========================================================================
// THREE.JS 3D WEBGL ENGINE (ATELIER STUDIO 360° INTERACTIVE VISUALIZER)
// =========================================================================

let threeScene = null;
let threeCamera = null;
let threeRenderer = null;
let threeControls = null;
let jewelryRootGroup = null;
let isAutoRotating = true;

/**
 * Inisialisasi Scene Three.js, Kamera, Studio Lighting, dan OrbitControls
 */
function initThreeDVisualizer() {
  const container = document.getElementById('threeDContainer');
  if (!container || typeof THREE === 'undefined') {
    console.warn('[3D Studio] Container atau Three.js library tidak terdeteksi.');
    return;
  }

  const width = container.clientWidth || 400;
  const height = container.clientHeight || 380;

  // 1. Scene & Ambiance
  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(0x16110D);
  threeScene.fog = new THREE.FogExp2(0x16110D, 0.09);

  // 2. Camera
  const aspect = width / height;
  threeCamera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
  threeCamera.position.set(0, 1.8, 5.0);

  // 3. Renderer
  threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  threeRenderer.setSize(width, height);
  threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if (threeRenderer.toneMapping !== undefined) {
    threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    threeRenderer.toneMappingExposure = 1.35;
  }
  threeRenderer.domElement.style.outline = 'none';
  threeRenderer.domElement.style.borderRadius = '16px';
  container.innerHTML = '';
  container.appendChild(threeRenderer.domElement);

  // 4. OrbitControls
  if (THREE.OrbitControls) {
    threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
    threeControls.enableDamping = true;
    threeControls.dampingFactor = 0.05;
    threeControls.autoRotate = true;
    threeControls.autoRotateSpeed = 1.4;
    threeControls.minDistance = 2.2;
    threeControls.maxDistance = 8.5;
    threeControls.maxPolarAngle = Math.PI / 2 + 0.15;
    threeControls.target.set(0, 0.1, 0);
  }

  // 5. Studio Multi-Point Lighting System (Khusus Kilau Mutiara & Kilap Logam)
  // Ambient hangat
  const ambientLight = new THREE.AmbientLight(0xFFF2E6, 1.4);
  threeScene.add(ambientLight);

  // Key Light (Cahaya emas lembut dari kanan atas depan)
  const keyLight = new THREE.DirectionalLight(0xFFF5E4, 2.5);
  keyLight.position.set(5, 8, 4);
  threeScene.add(keyLight);

  // Fill Light (Cahaya lembut spekular dari kiri depan)
  const fillLight = new THREE.DirectionalLight(0xDCE9FC, 1.6);
  fillLight.position.set(-6, 4, -4);
  threeScene.add(fillLight);

  // Rim Light (Pantulan kristal dari belakang atas)
  const rimLight = new THREE.DirectionalLight(0xFFFFFF, 2.2);
  rimLight.position.set(0, 7, -6);
  threeScene.add(rimLight);

  // Bounce Light Bawah (Nuansa hangat beludru meja studio)
  const bounceLight = new THREE.DirectionalLight(0xC98A58, 0.9);
  bounceLight.position.set(0, -4, 3);
  threeScene.add(bounceLight);

  // Point Light lokal untuk titik kemilau (sparkle)
  const sparkleLight = new THREE.PointLight(0xFFEEDD, 1.3, 10);
  sparkleLight.position.set(2, 2.5, 2.5);
  threeScene.add(sparkleLight);

  // 6. Alas Meja Beludru Studio Gelap (Ground Pedestal)
  const pedestalGeo = new THREE.CylinderGeometry(2.2, 2.3, 0.06, 64);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x0E0B08,
    roughness: 0.85,
    metalness: 0.15
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.y = -1.3;
  threeScene.add(pedestal);

  // Subtle Pedestal Rim Gold
  const rimPedestalGeo = new THREE.TorusGeometry(2.25, 0.02, 16, 64);
  const rimPedestalMat = new THREE.MeshStandardMaterial({
    color: 0x8C6838,
    roughness: 0.3,
    metalness: 0.8
  });
  const rimPedestal = new THREE.Mesh(rimPedestalGeo, rimPedestalMat);
  rimPedestal.rotation.x = Math.PI / 2;
  rimPedestal.position.y = -1.27;
  threeScene.add(rimPedestal);

  // 7. Master Root Group untuk Perhiasan
  jewelryRootGroup = new THREE.Group();
  threeScene.add(jewelryRootGroup);

  // 8. Event Listener Resize & Toolbar
  window.addEventListener('resize', onThreeWindowResize);

  const btnAuto = document.getElementById('btnAutoRotate3D');
  if (btnAuto) {
    btnAuto.addEventListener('click', () => {
      isAutoRotating = !isAutoRotating;
      if (threeControls) {
        threeControls.autoRotate = isAutoRotating;
      }
      btnAuto.classList.toggle('active', isAutoRotating);
    });
    btnAuto.classList.add('active');
  }

  const btnReset = document.getElementById('btnResetView3D');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (threeControls) {
        threeControls.reset();
        threeCamera.position.set(0, 1.8, 5.0);
        threeControls.target.set(0, 0.1, 0);
      }
    });
  }

  // 9. Loop Render Animasi
  function animateThreeD() {
    requestAnimationFrame(animateThreeD);
    if (threeControls) threeControls.update();
    if (threeRenderer && threeScene && threeCamera) {
      threeRenderer.render(threeScene, threeCamera);
    }
  }
  animateThreeD();

  // Model pertama
  updateThreeDModel();
}

/**
 * Resize Three.js saat ukuran window berubah
 */
function onThreeWindowResize() {
  const container = document.getElementById('threeDContainer');
  if (!container || !threeCamera || !threeRenderer) return;
  const width = container.clientWidth || 400;
  const height = container.clientHeight || 380;
  threeCamera.aspect = width / height;
  threeCamera.updateProjectionMatrix();
  threeRenderer.setSize(width, height);
}

/**
 * Membangun Ulang Geometri dan Material 3D sesuai Konfigurasi Aktif
 */
function updateThreeDModel() {
  if (!jewelryRootGroup || !threeScene) return;

  // Bersihkan model lama
  while (jewelryRootGroup.children.length > 0) {
    const child = jewelryRootGroup.children[0];
    if (child.geometry) child.geometry.dispose();
    jewelryRootGroup.remove(child);
  }

  // 1. Tentukan Material Logam PBR
  let metalHex = 0xF5C75D; // Solid Yellow Gold 18K
  let metalnessVal = 0.95;
  let roughnessVal = 0.17;

  if (customState.metal.id === 'emas_putih') {
    metalHex = 0xE6ECF2; // White Gold 18K + Rhodium
    metalnessVal = 0.94;
    roughnessVal = 0.15;
  } else if (customState.metal.id === 'rose_gold') {
    metalHex = 0xE8A08C; // Rose Gold 18K
    metalnessVal = 0.93;
    roughnessVal = 0.19;
  } else if (customState.metal.id === 'perak_925') {
    metalHex = 0xD4DCE4; // Perak 925
    metalnessVal = 0.90;
    roughnessVal = 0.22;
  }

  const metalMaterial = new THREE.MeshStandardMaterial({
    color: metalHex,
    metalness: metalnessVal,
    roughness: roughnessVal
  });

  // 2. Tentukan Material Mutiara PBR (Clearcoat Luster Air Laut)
  let pearlHex = 0xF5CE6B; // Golden South Sea
  let pearlEmissive = 0x221500;
  let pearlRoughness = 0.11;

  if (customState.pearl.id === 'white') {
    pearlHex = 0xFCFCFC; // Silvery White
    pearlEmissive = 0x11161A;
    pearlRoughness = 0.09;
  } else if (customState.pearl.id === 'tahitian') {
    pearlHex = 0x22302A; // Tahitian Peacock Green/Black
    pearlEmissive = 0x081712;
    pearlRoughness = 0.13;
  } else if (customState.pearl.id === 'champagne') {
    pearlHex = 0xF0D7BA; // Champagne Pearl
    pearlEmissive = 0x1F1409;
    pearlRoughness = 0.11;
  }

  const pearlMaterial = new THREE.MeshPhysicalMaterial({
    color: pearlHex,
    emissive: pearlEmissive,
    emissiveIntensity: 0.12,
    roughness: pearlRoughness,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    reflectivity: 0.95
  });

  // Skala ukuran mutiara proporsional terhadap customState.pearl.diameter (9 - 14mm)
  const baseDiameter = customState.pearl.diameter || 12;
  const pearlRadius = 0.44 * (baseDiameter / 12);

  // 3. Bangun Geometri Berdasarkan Jenis Basis
  const basisId = customState.basis.id;

  if (basisId === 'cincin') {
    // === CINCIN SOLITAIRE ===
    // Rangka Cincin (Torus)
    const bandGeo = new THREE.TorusGeometry(1.08, 0.11, 30, 80);
    const bandMesh = new THREE.Mesh(bandGeo, metalMaterial);
    bandMesh.rotation.x = Math.PI / 2;
    jewelryRootGroup.add(bandMesh);

    // Dudukan Collet Mahkota di puncak (y = 1.08)
    const colletGeo = new THREE.CylinderGeometry(0.36, 0.22, 0.32, 32);
    const colletMesh = new THREE.Mesh(colletGeo, metalMaterial);
    colletMesh.position.y = 1.08;
    jewelryRootGroup.add(colletMesh);

    // 4 Cakar Prong Pengaman
    const prongAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    const prongGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.46, 16);
    prongAngles.forEach(ang => {
      const prong = new THREE.Mesh(prongGeo, metalMaterial);
      const dist = 0.28;
      prong.position.set(Math.cos(ang) * dist, 1.28, Math.sin(ang) * dist);
      prong.rotation.z = -Math.cos(ang) * 0.16;
      prong.rotation.x = Math.sin(ang) * 0.16;
      jewelryRootGroup.add(prong);
    });

    // Mutiara Solitaire
    const pearlGeo = new THREE.SphereGeometry(pearlRadius, 64, 64);
    const pearlMesh = new THREE.Mesh(pearlGeo, pearlMaterial);
    pearlMesh.position.set(0, 1.15 + pearlRadius * 0.85, 0);
    jewelryRootGroup.add(pearlMesh);

    jewelryRootGroup.position.y = -0.4;

  } else if (basisId === 'kalung') {
    // === KALUNG LIONTIN ===
    // Rantai Melengkung Lembut
    const curvePoints = [];
    for (let i = 0; i <= 36; i++) {
      const t = (i / 36) * Math.PI;
      const x = Math.cos(t) * 1.55;
      const y = 1.3 - Math.sin(t) * 1.65;
      const z = Math.sin(t) * 0.28;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const chainGeo = new THREE.TubeGeometry(curve, 64, 0.032, 12, false);
    const chainMesh = new THREE.Mesh(chainGeo, metalMaterial);
    jewelryRootGroup.add(chainMesh);

    // Bail Ring Gantungan Liontin
    const bailGeo = new THREE.TorusGeometry(0.18, 0.045, 16, 32);
    const bailMesh = new THREE.Mesh(bailGeo, metalMaterial);
    bailMesh.position.set(0, -0.42, 0.28);
    bailMesh.rotation.y = Math.PI / 2;
    jewelryRootGroup.add(bailMesh);

    // Cup Dudukan Liontin (Corong Emas)
    const cupGeo = new THREE.ConeGeometry(0.26, 0.22, 24);
    const cupMesh = new THREE.Mesh(cupGeo, metalMaterial);
    cupMesh.position.set(0, -0.62, 0.28);
    cupMesh.rotation.x = Math.PI;
    jewelryRootGroup.add(cupMesh);

    // Mutiara Liontin Menjuntai
    const pearlGeo = new THREE.SphereGeometry(pearlRadius * 1.1, 64, 64);
    const pearlMesh = new THREE.Mesh(pearlGeo, pearlMaterial);
    pearlMesh.position.set(0, -0.76 - pearlRadius * 0.95, 0.28);
    jewelryRootGroup.add(pearlMesh);

    jewelryRootGroup.position.y = 0.35;

  } else if (basisId === 'gelang') {
    // === GELANG RANTAI TENUN / BANGLE ===
    // Lingkar Gelang Ergonomis
    const bangleGeo = new THREE.TorusGeometry(1.25, 0.08, 24, 80);
    const bangleMesh = new THREE.Mesh(bangleGeo, metalMaterial);
    bangleMesh.rotation.x = Math.PI / 2;
    jewelryRootGroup.add(bangleMesh);

    // Gesper & Stasiun Ornamen Lombok
    const stationGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.16, 32);
    const stationMesh = new THREE.Mesh(stationGeo, metalMaterial);
    stationMesh.position.set(0, 0, 1.25);
    stationMesh.rotation.x = Math.PI / 2;
    jewelryRootGroup.add(stationMesh);

    // Mutiara Mahkota Gelang
    const pearlGeo = new THREE.SphereGeometry(pearlRadius, 64, 64);
    const pearlMesh = new THREE.Mesh(pearlGeo, pearlMaterial);
    pearlMesh.position.set(0, 0, 1.28 + pearlRadius * 0.9);
    jewelryRootGroup.add(pearlMesh);

    jewelryRootGroup.position.y = -0.1;

  } else if (basisId === 'anting') {
    // === ANTING DROP GANTUNG (SEPASANG KIRI & KANAN) ===
    [-0.85, 0.85].forEach(xOffset => {
      // Hook Pengait Telinga Lengkung Anggun
      const hookCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(xOffset, 0.95, 0),
        new THREE.Vector3(xOffset, 1.45, 0.22),
        new THREE.Vector3(xOffset, 1.25, -0.25),
        new THREE.Vector3(xOffset, 0.82, -0.15)
      );
      const hookGeo = new THREE.TubeGeometry(hookCurve, 32, 0.028, 12, false);
      const hookMesh = new THREE.Mesh(hookGeo, metalMaterial);
      jewelryRootGroup.add(hookMesh);

      // Manik Logam / Cap Atas
      const capGeo = new THREE.ConeGeometry(0.20, 0.18, 20);
      const capMesh = new THREE.Mesh(capGeo, metalMaterial);
      capMesh.position.set(xOffset, 0.72, 0);
      capMesh.rotation.x = Math.PI;
      jewelryRootGroup.add(capMesh);

      // Mutiara Drop Menggantung
      const pearlGeo = new THREE.SphereGeometry(pearlRadius * 0.95, 64, 64);
      const pearlMesh = new THREE.Mesh(pearlGeo, pearlMaterial);
      pearlMesh.position.set(xOffset, 0.72 - pearlRadius * 1.15, 0);
      jewelryRootGroup.add(pearlMesh);
    });

    jewelryRootGroup.position.y = 0.1;

  } else if (basisId === 'bros') {
    // === BROS KEBAYA KLASIK (ROSETTE FILIGREE) ===
    const numPetals = 8;
    for (let i = 0; i < numPetals; i++) {
      const angle = (i / numPetals) * Math.PI * 2;
      const petalGeo = new THREE.TorusGeometry(0.55, 0.055, 16, 32);
      const petalMesh = new THREE.Mesh(petalGeo, metalMaterial);
      petalMesh.position.set(Math.cos(angle) * 0.52, Math.sin(angle) * 0.52, 0);
      petalMesh.rotation.z = angle;
      jewelryRootGroup.add(petalMesh);
    }

    // Dudukan Tengah Filigree
    const broochCupGeo = new THREE.CylinderGeometry(0.42, 0.35, 0.22, 32);
    const broochCup = new THREE.Mesh(broochCupGeo, metalMaterial);
    broochCup.rotation.x = Math.PI / 2;
    broochCup.position.set(0, 0, 0.09);
    jewelryRootGroup.add(broochCup);

    // Mutiara Besar Utama di Pusat Bros
    const pearlGeo = new THREE.SphereGeometry(pearlRadius * 1.08, 64, 64);
    const pearlMesh = new THREE.Mesh(pearlGeo, pearlMaterial);
    pearlMesh.position.set(0, 0, 0.18 + pearlRadius * 0.88);
    jewelryRootGroup.add(pearlMesh);

    jewelryRootGroup.position.y = 0;
  }

  // Update Teks Live Badge
  const liveBadge = document.getElementById('renderBadgeLiveText');
  if (liveBadge) {
    liveBadge.textContent = `3D ${customState.basis.name} • ${customState.pearl.name.split(' ')[0]} ${customState.pearl.diameter}mm`;
  }
}

// Ekspor ke window
window.selectBasis = selectBasis;
window.selectPearl = selectPearl;
window.selectMetal = selectMetal;
window.goToStep = goToStep;
window.handleOrderCustom = handleOrderCustom;
window.updateThreeDModel = updateThreeDModel;

