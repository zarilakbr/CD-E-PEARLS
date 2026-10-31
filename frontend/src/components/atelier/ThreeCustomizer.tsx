import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, Sparkles, ShoppingBag, MessageCircle, ZoomIn } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { recordWhatsAppLead } from '../../services/api';

// Jewelry Bases
const JEWELRY_BASES = [
  { id: 'cincin', name: 'Cincin Solitaire', basePrice: 12000000 },
  { id: 'kalung', name: 'Kalung Liontin', basePrice: 16000000 },
  { id: 'gelang', name: 'Gelang Bangle', basePrice: 18000000 },
  { id: 'anting', name: 'Anting Drop Pasang', basePrice: 14000000 },
  { id: 'bros', name: 'Bros Kebaya Klasik', basePrice: 15000000 },
];

// Pearl Varieties PBR
const PEARL_VARIETIES = [
  {
    id: 'gold',
    name: 'Imperial Golden South Sea',
    colorHex: 0xE5B842,
    roughness: 0.12,
    metalness: 0.1,
    multiplier: 1.5,
  },
  {
    id: 'white',
    name: 'Silvery White South Sea',
    colorHex: 0xF8F9FA,
    roughness: 0.1,
    metalness: 0.05,
    multiplier: 1.2,
  },
  {
    id: 'tahitian',
    name: 'Tahitian Peacock Grey',
    colorHex: 0x4A535A,
    roughness: 0.14,
    metalness: 0.2,
    multiplier: 1.35,
  },
  {
    id: 'champagne',
    name: 'Royal Champagne South Sea',
    colorHex: 0xF3E5AB,
    roughness: 0.11,
    metalness: 0.08,
    multiplier: 1.3,
  },
];

// Precious Metals PBR
const METALS = [
  {
    id: 'yellow_gold',
    name: 'Solid Yellow Gold 18K (750)',
    colorHex: 0xD4AF37,
    roughness: 0.2,
    metalness: 0.95,
    extraCost: 4000000,
  },
  {
    id: 'white_gold',
    name: 'Emas Putih 18K + Rhodium',
    colorHex: 0xE8ECEF,
    roughness: 0.15,
    metalness: 0.98,
    extraCost: 4500000,
  },
  {
    id: 'rose_gold',
    name: 'Rose Gold 18K Warm',
    colorHex: 0xE8A598,
    roughness: 0.22,
    metalness: 0.92,
    extraCost: 4200000,
  },
  {
    id: 'silver',
    name: 'Perak Murni 925 Platinum Plated',
    colorHex: 0xD8DDE2,
    roughness: 0.28,
    metalness: 0.85,
    extraCost: 1500000,
  },
];

export const ThreeCustomizer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedBase, setSelectedBase] = useState(JEWELRY_BASES[0]);
  const [selectedPearl, setSelectedPearl] = useState(PEARL_VARIETIES[0]);
  const [selectedMetal, setSelectedMetal] = useState(METALS[0]);
  const [pearlDiameterMm, setPearlDiameterMm] = useState(11.5);
  const [isRotating, setIsRotating] = useState(true);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const { addToCart } = useCart();

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pearlMeshRef = useRef<THREE.Mesh | null>(null);
  const metalMeshRef = useRef<THREE.Group | null>(null);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x161210);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3, 7);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = isRotating;
    controls.autoRotateSpeed = 1.2;
    controls.maxDistance = 15;
    controls.minDistance = 3;
    controlsRef.current = controls;

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5ea, 2.0);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xddeeff, 1.4);
    dirLight2.position.set(-5, -2, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffeedd, 1.5, 20);
    pointLight.position.set(0, 4, 2);
    scene.add(pointLight);

    // 6. Geometry Group
    const jewelryGroup = new THREE.Group();
    scene.add(jewelryGroup);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight || 450;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, []);

  // Update Geometry and Materials when user changes options
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clear old group
    const oldGroup = scene.getObjectByName('jewelry_root');
    if (oldGroup) scene.remove(oldGroup);

    const rootGroup = new THREE.Group();
    rootGroup.name = 'jewelry_root';

    // 1. Pearl Material PBR
    const pearlMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(selectedPearl.colorHex),
      roughness: selectedPearl.roughness,
      metalness: selectedPearl.metalness,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.95,
    });

    // Pearl Radius calculation from mm: 10 mm = radius 1.0 in 3D units
    const radius = (pearlDiameterMm / 10) * 0.9;
    const pearlGeo = new THREE.SphereGeometry(radius, 64, 64);
    const pearlMesh = new THREE.Mesh(pearlGeo, pearlMat);
    pearlMesh.position.set(0, radius * 0.6, 0);
    rootGroup.add(pearlMesh);
    pearlMeshRef.current = pearlMesh;

    // 2. Precious Metal Material PBR
    const metalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(selectedMetal.colorHex),
      metalness: selectedMetal.metalness,
      roughness: selectedMetal.roughness,
    });

    // 3. Procedural Base Ring / Pendant / Bangle / Drop / Brooch
    const metalGroup = new THREE.Group();
    if (selectedBase.id === 'cincin') {
      // Ring Band Torus
      const bandGeo = new THREE.TorusGeometry(1.6, 0.18, 32, 100);
      const bandMesh = new THREE.Mesh(bandGeo, metalMat);
      bandMesh.rotation.x = Math.PI / 2;
      metalGroup.add(bandMesh);

      // 4 Prongs
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const prongGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.9, 16);
        const prongMesh = new THREE.Mesh(prongGeo, metalMat);
        prongMesh.position.set(Math.cos(angle) * (radius * 0.8), (radius * 0.45), Math.sin(angle) * (radius * 0.8));
        metalGroup.add(prongMesh);
      }
    } else if (selectedBase.id === 'kalung') {
      // Pendant Bail loop
      const bailGeo = new THREE.TorusGeometry(0.45, 0.09, 24, 64);
      const bailMesh = new THREE.Mesh(bailGeo, metalMat);
      bailMesh.position.set(0, radius * 1.6, 0);
      metalGroup.add(bailMesh);

      // Chain circle
      const chainGeo = new THREE.TorusGeometry(2.8, 0.04, 16, 120);
      const chainMesh = new THREE.Mesh(chainGeo, metalMat);
      chainMesh.position.set(0, radius * 1.6 + 2.3, 0);
      metalGroup.add(chainMesh);
    } else if (selectedBase.id === 'gelang') {
      // Open Bangle
      const bangleGeo = new THREE.TorusGeometry(2.2, 0.16, 32, 100, Math.PI * 1.65);
      const bangleMesh = new THREE.Mesh(bangleGeo, metalMat);
      bangleMesh.rotation.x = Math.PI / 2;
      bangleMesh.rotation.z = Math.PI * 0.18;
      metalGroup.add(bangleMesh);
    } else if (selectedBase.id === 'anting') {
      // Earring Drop Hooks (Twin pair)
      pearlMesh.position.set(-1.2, radius * 0.4, 0);

      const secondPearl = new THREE.Mesh(pearlGeo, pearlMat);
      secondPearl.position.set(1.2, radius * 0.4, 0);
      rootGroup.add(secondPearl);

      const hookGeo = new THREE.TorusGeometry(0.5, 0.07, 16, 64, Math.PI);
      const hook1 = new THREE.Mesh(hookGeo, metalMat);
      hook1.position.set(-1.2, radius * 1.3, 0);
      hook1.rotation.z = Math.PI;

      const hook2 = new THREE.Mesh(hookGeo, metalMat);
      hook2.position.set(1.2, radius * 1.3, 0);
      hook2.rotation.z = Math.PI;

      metalGroup.add(hook1, hook2);
    } else {
      // Brooch Filigree Base
      const broochGeo = new THREE.TorusKnotGeometry(1.4, 0.12, 64, 16, 2, 3);
      const broochMesh = new THREE.Mesh(broochGeo, metalMat);
      broochMesh.scale.set(1, 1, 0.4);
      metalGroup.add(broochMesh);
    }

    rootGroup.add(metalGroup);
    metalMeshRef.current = metalGroup;
    scene.add(rootGroup);
  }, [selectedBase, selectedPearl, selectedMetal, pearlDiameterMm]);

  // Toggle Auto-rotation
  const toggleRotation = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !isRotating;
      setIsRotating(!isRotating);
    }
  };

  // Price Calculation Formula
  // Base Price + Metal Cost + (Diameter mm * multiplier)
  const calculatedPrice = Math.round(
    (selectedBase.basePrice + selectedMetal.extraCost) * selectedPearl.multiplier +
      (pearlDiameterMm - 9) * 1800000
  );

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const handleAddToCartCustom = () => {
    addToCart(
      {
        id: Date.now(),
        code: `CUSTOM-${selectedBase.id.toUpperCase()}`,
        name: `Custom Atelier: ${selectedBase.name} (${selectedPearl.name} ${pearlDiameterMm} mm)`,
        category_slug: selectedBase.id === 'bros' ? 'mutiara-lepas' : selectedBase.id,
        price: calculatedPrice,
        discount_percent: 0,
        stock: 5,
        rating: 5.0,
        reviews_count: 1,
        pearl_type: selectedPearl.name,
        pearl_size: `${pearlDiameterMm} mm`,
        metal: selectedMetal.name,
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
        is_featured: false,
        is_bestseller: false,
      },
      1,
      {
        base: selectedBase.name,
        pearl: selectedPearl.name,
        metal: selectedMetal.name,
        diameter: `${pearlDiameterMm} mm`,
      }
    );

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const handleOrderWhatsApp = () => {
    recordWhatsAppLead({
      customer_name: 'Pemesan 3D Atelier Custom',
      phone: 'WhatsApp User',
      source: 'CUSTOM_3D_ATELIER',
      message: `Desain Kustom: ${selectedBase.name}, Mutiara: ${selectedPearl.name} ${pearlDiameterMm} mm, Logam: ${selectedMetal.name}, Estimasi: ${formatIDR(calculatedPrice)}`,
    }).catch(() => {});

    const msg = `Halo Atelier CD'E Pearls Lombok,%0A%0ASaya ingin memesan perhiasan kustom hasil desain Studio 3D:%0A• Basis: *${encodeURIComponent(selectedBase.name)}*%0A• Mutiara: *${encodeURIComponent(selectedPearl.name)}*%0A• Diameter: *${pearlDiameterMm} mm*%0A• Logam: *${encodeURIComponent(selectedMetal.name)}*%0A• Estimasi Biaya: *${formatIDR(calculatedPrice)}*%0A%0AMohon konfirmasi waktu pengerjaan atelier dan nomor rekening pembayaran. Terima kasih.`;
    window.open(`https://wa.me/6281239887766?text=${msg}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start text-[#F5ECE5]">
      
      {/* Left: 3D WebGL Viewport (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="relative w-full h-[340px] xs:h-[380px] sm:h-[440px] lg:h-[480px] rounded-[24px] sm:rounded-[32px] overflow-hidden border border-[#2D231F] shadow-2xl bg-[#161210]">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Top Left Floating Badges */}
          <div className="absolute top-4 left-4 sm:top-5 sm:left-5 flex flex-col gap-1.5 sm:gap-2 pointer-events-none">
            <span className="px-3 py-1 rounded-full bg-[#161210]/90 backdrop-blur-md border border-[#2D231F] text-[10px] sm:text-[11px] font-bold text-[#F5ECE5] flex items-center gap-1.5 shadow-md">
              <Sparkles size={13} className="text-[#C5A880]" />
              <span>Simulasi 3D PBR Real-time</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#221915]/90 border border-[#382B24] text-[#C5A880] text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase">
              {selectedPearl.name} • {pearlDiameterMm} mm
            </span>
          </div>

          {/* Bottom Controls (Rotate, Zoom Tip) */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 flex items-center justify-between gap-2 pointer-events-none">
            <span className="text-[10px] sm:text-[11px] text-[#A39288] bg-[#161210]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#2D231F] flex items-center gap-1.5">
              <ZoomIn size={13} className="text-[#C5A880]" />
              <span>Putar 360° & Zoom</span>
            </span>

            <button
              onClick={toggleRotation}
              className="pointer-events-auto h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-[#221915]/90 hover:bg-[#2A201A] text-white text-[11px] sm:text-xs font-bold shadow-md border border-[#382B24] flex items-center gap-2 cursor-pointer transition-all"
            >
              <RotateCw size={13} className={isRotating ? 'animate-spin text-[#C5A880]' : 'text-[#A39288]'} />
              <span>{isRotating ? 'Putar Otomatis' : 'Diam'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Diameter Slider */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#161210] border border-[#2D231F] shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#A39288] uppercase tracking-wider">
              Diameter Mutiara Laut:
            </span>
            <span className="font-serif font-bold text-sm sm:text-base text-[#C5A880]">
              {pearlDiameterMm.toFixed(1)} mm
            </span>
          </div>

          <input
            type="range"
            min="9.0"
            max="14.0"
            step="0.5"
            value={pearlDiameterMm}
            onChange={(e) => setPearlDiameterMm(parseFloat(e.target.value))}
            className="w-full accent-[#C5A880] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#A39288] font-medium">
            <span>9.0 mm (Standard)</span>
            <span>11.5 mm (Optimal)</span>
            <span>14.0 mm (Rare Large)</span>
          </div>
        </div>
      </div>

      {/* Right: Customization Controls & Live Calculator (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
        
        {/* Step 1: Base Jewelry */}
        <div className="p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] bg-[#161210] border border-[#2D231F] shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#C5A880] uppercase tracking-wider block mb-1">
            Tahap 1: Pilih Basis Perhiasan
          </span>
          <h4 className="font-serif text-base sm:text-lg font-bold text-white mb-3">
            Desain Mahkota Rangka
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {JEWELRY_BASES.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBase(b)}
                className={`p-3 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                  selectedBase.id === b.id
                    ? 'border-[#C5A880] bg-[#221915] text-white font-bold shadow-sm ring-1 ring-[#C5A880]/30'
                    : 'border-[#2D231F] bg-[#120E0C] text-[#A39288] hover:border-[#3D302A] hover:text-white'
                }`}
              >
                <div className="font-semibold">{b.name}</div>
                <div className="text-[10px] text-[#C5A880] mt-0.5">{formatIDR(b.basePrice)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Pearl Variety */}
        <div className="p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] bg-[#161210] border border-[#2D231F] shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#C5A880] uppercase tracking-wider block mb-1">
            Tahap 2: Mutiara Laut Asli Lombok
          </span>
          <h4 className="font-serif text-base sm:text-lg font-bold text-white mb-3">
            Pilih Varietas Nacre
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PEARL_VARIETIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPearl(p)}
                className={`p-3 rounded-xl text-left border transition-all text-xs flex items-center gap-2.5 cursor-pointer ${
                  selectedPearl.id === p.id
                    ? 'border-[#C5A880] bg-[#221915] text-white font-bold shadow-sm ring-1 ring-[#C5A880]/30'
                    : 'border-[#2D231F] bg-[#120E0C] text-[#A39288] hover:border-[#3D302A] hover:text-white'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shrink-0 shadow-inner"
                  style={{ backgroundColor: `#${p.colorHex.toString(16).padStart(6, '0')}` }}
                />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Metal Type */}
        <div className="p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] bg-[#161210] border border-[#2D231F] shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#C5A880] uppercase tracking-wider block mb-1">
            Tahap 3: Logam Mulia Rangka
          </span>
          <h4 className="font-serif text-base sm:text-lg font-bold text-white mb-3">
            Kadar Emas & Perak
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {METALS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMetal(m)}
                className={`p-3 rounded-xl text-left border transition-all text-xs flex items-center gap-2.5 cursor-pointer ${
                  selectedMetal.id === m.id
                    ? 'border-[#C5A880] bg-[#221915] text-white font-bold shadow-sm ring-1 ring-[#C5A880]/30'
                    : 'border-[#2D231F] bg-[#120E0C] text-[#A39288] hover:border-[#3D302A] hover:text-white'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shrink-0 shadow-inner"
                  style={{ backgroundColor: `#${m.colorHex.toString(16).padStart(6, '0')}` }}
                />
                <span className="truncate">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Investment Price Calculator & CTA */}
        <div className="p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] bg-gradient-to-br from-[#1E1714] to-[#140F0D] border border-[#C5A880]/40 text-white shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs uppercase tracking-wider text-[#A39288]">
              Estimasi Investasi Atelier:
            </span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-[#C5A880]">
              {formatIDR(calculatedPrice)}
            </span>
          </div>

          <div className="text-[11px] text-[#A39288] space-y-1 font-light">
            <div className="flex items-center gap-2">
              <span className="text-[#C5A880]">✓</span>
              <span>Gratis Kotak Beludru Obsidian & Grafir Nama</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#C5A880]">✓</span>
              <span>Sertifikat Keaslian Laboratorium Gemologi 100% Asli</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#C5A880]">✓</span>
              <span>Pengiriman Berasuransi Penuh ke Seluruh Indonesia</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleAddToCartCustom}
              className="h-11 rounded-full bg-gradient-to-r from-[#C5A880] to-[#B39368] hover:scale-102 text-[#120E0C] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <ShoppingBag size={15} />
              <span>{addedSuccess ? 'DITAMBAHKAN!' : '+ KERANJANG'}</span>
            </button>

            <button
              onClick={handleOrderWhatsApp}
              className="h-11 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <MessageCircle size={15} />
              <span>PESAN VIA WA</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
