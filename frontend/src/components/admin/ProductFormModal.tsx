import React, { useState, useEffect } from 'react';
import { X, Upload, Save, Star, ArrowUp, ArrowDown, Trash2, FileText, CheckCircle, ExternalLink } from 'lucide-react';
import type { MockProduct } from '../../types/models';
import { resolveMediaUrl } from '../../lib/media';

interface PhotoItem {
  id: string;
  file?: File;
  previewUrl: string;
  isPrimary: boolean;
  alt: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Partial<MockProduct> | null;
  onSave: (productData: Partial<MockProduct>, photoFiles?: File[], certificateFile?: File | null) => Promise<void> | void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
}) => {
  const isEditing = Boolean(product?.id);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Kalung');
  const [variety, setVariety] = useState('');
  const [grade, setGrade] = useState('');
  const [pearlSize, setPearlSize] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [weight, setWeight] = useState('');
  const [bentuk, setBentuk] = useState('');
  const [colorGroup, setColorGroup] = useState('emas');
  const [colorVariant, setColorVariant] = useState('');
  const [price, setPrice] = useState<number | string>(15000000);
  const [stock, setStock] = useState<number | string>(5);
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [certificateNumber, setCertificateNumber] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [existingCertificate, setExistingCertificate] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setCode(product.code || '');
      setName(product.name || '');
      setDescription(product.description || '');
      const catNorm = (product.category || 'Kalung').replace(/\s*Mutiara/i, '').trim();
      setCategory(['Kalung', 'Gelang', 'Cincin', 'Anting', 'Liontin', 'Bros'].includes(catNorm) ? catNorm : 'Kalung');
      setVariety(product.varietas || product.variety || '');
      setGrade(product.grade || '');
      setPearlSize(product.ukuran_mm || product.pearlSize || '');
      setJumlah(product.jumlah || '');
      setWeight(product.berat || product.weight || '');
      setBentuk(product.bentuk || '');
      setColorGroup(product.colorGroup || 'emas');
      setColorVariant(product.colorVariant || '');
      setPrice(Number(product.price) || 0);
      setStock(Number(product.stock) !== undefined ? Number(product.stock) : 0);
      setStatus(product.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif');
      setCertificateNumber(product.certificate_number || product.certificateNo || product.certificate?.nomor || '');
      setCertificateFile(null);
      setExistingCertificate(product.certificate_pdf_url || product.certificate?.pdf_path || null);

      if (product.images && product.images.length > 0) {
        setPhotos(
          product.images.map((img, idx) => ({
            id: `existing-${idx}`,
            previewUrl: resolveMediaUrl(img.url),
            isPrimary: img.is_primary,
            alt: img.alt || `${product.name} - Foto ${idx + 1}`,
          }))
        );
      } else if (product.image) {
        setPhotos([
          {
            id: 'existing-0',
            previewUrl: resolveMediaUrl(product.image),
            isPrimary: true,
            alt: product.name || 'Foto Produk',
          },
        ]);
      } else {
        setPhotos([]);
      }
    } else {
      setCode('');
      setName('');
      setDescription('');
      setCategory('Kalung');
      setVariety('');
      setGrade('');
      setPearlSize('');
      setJumlah('');
      setWeight('');
      setBentuk('');
      setColorGroup('emas');
      setColorVariant('');
      setPrice(15000000);
      setStock(5);
      setStatus('Aktif');
      setPhotos([]);
      setCertificateNumber('');
      setCertificateFile(null);
      setExistingCertificate(null);
    }
    setErrors({});
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotoItems: PhotoItem[] = [];
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!validMimes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          photos: 'Format foto harus berupa JPEG, PNG, atau WebP asli.',
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          photos: 'Ukuran foto maksimal 5 MB per berkas.',
        }));
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newPhotoItems.push({
        id: `upload-${Date.now()}-${i}`,
        file,
        previewUrl,
        isPrimary: photos.length === 0 && i === 0,
        alt: `${name || 'Perhiasan'} - Foto ${photos.length + i + 1}`,
      });
    }

    setPhotos((prev) => [...prev, ...newPhotoItems]);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.photos;
      return next;
    });
  };

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const validMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validMimes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        certificateFile: 'Format sertifikat wajib berupa PDF, JPG, JPEG, atau PNG.',
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        certificateFile: 'Ukuran berkas sertifikat maksimal 10 MB.',
      }));
      return;
    }

    setCertificateFile(file);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.certificateFile;
      return next;
    });
  };

  const setPrimaryPhoto = (index: number) => {
    setPhotos((prev) =>
      prev.map((p, idx) => ({
        ...p,
        isPrimary: idx === index,
      }))
    );
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      if (updated.length > 0 && !updated.some((p) => p.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    setPhotos((prev) => {
      const updated = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Nama produk mutiara wajib diisi.';
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      errs.price = 'Harga tidak boleh kurang dari Rp 0.';
    }

    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      errs.stock = 'Stok tidak boleh kurang dari 0 unit.';
    }

    if (code.trim().length > 100) {
      errs.code = 'Nomor produk (kode) maksimal 100 karakter.';
    }
    if (variety.trim().length > 100) {
      errs.variety = 'Jenis mutiara maksimal 100 karakter.';
    }
    if (grade.trim().length > 100) {
      errs.grade = 'Grade mutiara maksimal 100 karakter.';
    }
    if (pearlSize.trim().length > 100) {
      errs.pearlSize = 'Ukuran mutiara maksimal 100 karakter.';
    }
    if (jumlah.trim().length > 100) {
      errs.jumlah = 'Jumlah mutiara maksimal 100 karakter.';
    }
    if (weight.trim().length > 100) {
      errs.weight = 'Berat mutiara maksimal 100 karakter.';
    }
    if (certificateNumber.trim().length > 100) {
      errs.certificateNumber = 'Nomor sertifikat maksimal 100 karakter.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const categorySlugMap: Record<string, string> = {
        Kalung: 'kalung-mutiara',
        Gelang: 'gelang-mutiara',
        Cincin: 'cincin-mutiara',
        Anting: 'anting-mutiara',
        Liontin: 'liontin-mutiara',
        Bros: 'bros-mutiara',
      };

      const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0];
      const cleanPrice = Number(price) || 0;
      const cleanStock = Number(stock) || 0;

      const productPayload: Partial<MockProduct> = {
        ...product,
        code: code.trim(),
        name: name.trim(),
        description: description.trim(),
        category: `${category} Mutiara`,
        categorySlug: categorySlugMap[category] || 'kalung-mutiara',
        variety: variety.trim(),
        varietas: variety.trim(),
        grade: grade.trim(),
        pearlSize: pearlSize.trim(),
        ukuran_mm: pearlSize.trim(),
        jumlah: jumlah.trim(),
        weight: weight.trim(),
        berat: weight.trim(),
        bentuk: bentuk.trim(),
        colorGroup,
        colorVariant: colorVariant.trim(),
        price: cleanPrice,
        formattedPrice: `Rp ${cleanPrice.toLocaleString('id-ID')}`,
        stock: cleanStock,
        status,
        certificateNo: certificateNumber.trim(),
        certificate_number: certificateNumber.trim(),
        image: primaryPhoto ? primaryPhoto.previewUrl : product?.image || '/images/placeholder_jewelry.svg',
        images: photos.map((p, idx) => ({
          url: p.previewUrl,
          order: idx + 1,
          is_primary: p.isPrimary,
          alt: p.alt,
        })),
      };

      const filesToUpload = photos.map((p) => p.file).filter(Boolean) as File[];
      await onSave(productPayload, filesToUpload, certificateFile);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0B1528] h-full shadow-2xl flex flex-col justify-between overflow-y-auto custom-scrollbar z-10 border-l border-[#E6DDD0] dark:border-white/10">
        {/* Header Panel */}
        <div className="p-6 border-b border-[#E6DDD0] dark:border-white/10 flex items-center justify-between bg-[#FBF8F3] dark:bg-white/5">
          <div>
            <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
              Atelier Editor
            </span>
            <h3 className="font-serif text-2xl font-semibold text-[#12263A] dark:text-[#FBF8F3]">
              {isEditing ? 'Ubah Data Produk' : 'Tambah Produk Baru'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#EDE6DA] dark:hover:bg-white/10 text-[#12263A] dark:text-[#FBF8F3] transition-colors cursor-pointer"
            title="Tutup Form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
          {/* Baris 1: Nama Produk & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                Nama Perhiasan Mutiara *
              </label>
              <input
                type="text"
                required
                name="name"
                placeholder="Contoh: Kalung Mutiara South Sea 18K"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] dark:bg-white/5 border border-[#E6DDD0] dark:border-white/10 text-sm text-[#12263A] dark:text-[#FBF8F3] focus:outline-none focus:border-[#8A6A2F]"
              />
              {errors.name && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] dark:bg-white/5 border border-[#E6DDD0] dark:border-white/10 text-sm text-[#12263A] dark:text-[#FBF8F3] focus:outline-none"
              >
                <option value="Kalung">Kalung</option>
                <option value="Gelang">Gelang</option>
                <option value="Cincin">Cincin</option>
                <option value="Anting">Anting</option>
                <option value="Liontin">Liontin</option>
                <option value="Bros">Bros</option>
              </select>
            </div>
          </div>

          {/* Section: 7 Field Spesifikasi Produk (Input Teks Bebas, Tanpa Dropdown) */}
          <div className="p-4 rounded-2xl bg-[#FBF8F3] dark:bg-white/5 border border-[#E6DDD0] dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6DDD0] dark:border-white/10 pb-2">
              <span className="text-xs font-bold text-[#8A6A2F] dark:text-[#D9B877] uppercase tracking-wider">
                Spesifikasi Mahakarya (Input Bebas)
              </span>
              <span className="text-[11px] text-[#4A5666] dark:text-white/60">
                Kosongkan jika tidak relevan
              </span>
            </div>

            {/* Grid 1: No (code), Jenis (Species), Ukuran (Size) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                  No / SKU (Code)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="PRD-LMB-001"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-xs text-[#12263A] dark:text-[#FBF8F3] focus:outline-none focus:border-[#8A6A2F]"
                />
                {errors.code && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.code}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                  Jenis / Spesies (Species)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="South Sea / Tahitian / Freshwater"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-xs text-[#12263A] dark:text-[#FBF8F3] focus:outline-none focus:border-[#8A6A2F]"
                />
                {errors.variety && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.variety}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                  Ukuran (Size)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Contoh: 11.2 - 12.0 mm"
                  value={pearlSize}
                  onChange={(e) => setPearlSize(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-xs text-[#12263A] dark:text-[#FBF8F3] focus:outline-none focus:border-[#8A6A2F]"
                />
                {errors.pearlSize && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.pearlSize}</p>}
              </div>
            </div>

            {/* Grid 2: Grade, Jumlah (Quantity), Berat (Weight) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                  Grade
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="AAA / AA+ / Istimewa"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-xs text-[#12263A] dark:text-[#FBF8F3] focus:outline-none focus:border-[#8A6A2F]"
                />
                {errors.grade && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.grade}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                  Jumlah (Quantity)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="1 untai / 45 butir"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-xs text-[#12263A] dark:text-[#FBF8F3] focus:outline-none focus:border-[#8A6A2F]"
                />
                {errors.jumlah && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.jumlah}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                  Berat (Weight)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Contoh: 15.4 gr"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-xs text-[#12263A] dark:text-[#FBF8F3] focus:outline-none focus:border-[#8A6A2F]"
                />
                {errors.weight && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.weight}</p>}
              </div>
            </div>

            {/* Grid 3: Bentuk & Varian Warna */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                  Bentuk Mutiara
                </label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="Bulat / Semi-Baroque / Drop"
                  value={bentuk}
                  onChange={(e) => setBentuk(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-xs text-[#12263A] dark:text-[#FBF8F3] focus:outline-none focus:border-[#8A6A2F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                  Varian Warna
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Champagne Gold / Perak Kilau"
                  value={colorVariant}
                  onChange={(e) => setColorVariant(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-xs text-[#12263A] dark:text-[#FBF8F3] focus:outline-none focus:border-[#8A6A2F]"
                />
              </div>
            </div>
          </div>

          {/* Section: Harga, Stok, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                Harga (Rp) *
              </label>
              <input
                type="number"
                min="0"
                required
                name="price"
                placeholder="15000000"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] dark:bg-white/5 border border-[#E6DDD0] dark:border-white/10 text-sm text-[#12263A] dark:text-[#FBF8F3] focus:outline-none focus:border-[#8A6A2F]"
              />
              {errors.price && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                Stok On Hand *
              </label>
              <input
                type="number"
                min="0"
                required
                name="stock"
                placeholder="5"
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] dark:bg-white/5 border border-[#E6DDD0] dark:border-white/10 text-sm text-[#12263A] dark:text-[#FBF8F3] focus:outline-none focus:border-[#8A6A2F]"
              />
              {errors.stock && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.stock}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                Status Katalog
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Aktif' | 'Nonaktif')}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] dark:bg-white/5 border border-[#E6DDD0] dark:border-white/10 text-sm text-[#12263A] dark:text-[#FBF8F3] focus:outline-none"
              >
                <option value="Aktif">Aktif (Published)</option>
                <option value="Nonaktif">Nonaktif (Draft)</option>
              </select>
            </div>
          </div>

          {/* Section: Sertifikat Keaslian Gemologi (Nomor & Unggah File) */}
          <div className="p-4 rounded-2xl bg-[#E1ECF7]/30 dark:bg-white/5 border border-[#1D4E7A]/20 dark:border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1D4E7A] dark:text-[#D9B877]" />
              <span className="text-xs font-bold text-[#1D4E7A] dark:text-[#D9B877] uppercase tracking-wider">
                Sertifikat Gemologi Produk
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                  Nomor Sertifikat
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Contoh: CERT-LGI-2026-081"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-xs text-[#12263A] dark:text-[#FBF8F3] focus:outline-none focus:border-[#8A6A2F]"
                />
                {errors.certificateNumber && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.certificateNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
                  Berkas Sertifikat (PDF / JPG / PNG, maks 10 MB)
                </label>
                <label className="flex items-center justify-between w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-xs text-[#12263A] dark:text-[#FBF8F3] cursor-pointer hover:border-[#8A6A2F] transition-colors">
                  <span className="truncate max-w-[180px] text-[#4A5666] dark:text-white/70">
                    {certificateFile ? certificateFile.name : 'Pilih file sertifikat...'}
                  </span>
                  <Upload className="w-3.5 h-3.5 text-[#8A6A2F] dark:text-[#D9B877] shrink-0 ml-2" />
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={handleCertificateUpload}
                    className="hidden"
                  />
                </label>
                {errors.certificateFile && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.certificateFile}</p>
                )}
              </div>
            </div>

            {certificateFile && (
              <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-xl">
                <span className="flex items-center gap-1.5 truncate">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Siap diunggah: <strong>{certificateFile.name}</strong> ({(certificateFile.size / 1024).toFixed(0)} KB)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCertificateFile(null)}
                  className="text-xs text-red-600 hover:underline shrink-0 ml-2"
                >
                  Batal
                </button>
              </div>
            )}

            {existingCertificate && !certificateFile && (
              <div className="flex items-center justify-between text-xs text-[#1D4E7A] dark:text-[#D9B877] bg-white/60 dark:bg-white/5 px-3 py-2 rounded-xl border border-[#1D4E7A]/15">
                <span className="truncate">Sertifikat terlampir saat ini</span>
                <a
                  href={resolveMediaUrl(existingCertificate)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8A6A2F] dark:text-[#D9B877] hover:underline shrink-0 ml-2"
                >
                  <span>Lihat Berkas</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider mb-1">
              Deskripsi Produk
            </label>
            <textarea
              rows={3}
              name="description"
              placeholder="Jelaskan kilau nacre, asal perairan Lombok, dan detail tatahan perhiasan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#F4F1EB] dark:bg-white/5 border border-[#E6DDD0] dark:border-white/10 text-sm text-[#12263A] dark:text-[#FBF8F3] focus:outline-none focus:border-[#8A6A2F]"
            />
          </div>

          {/* Galeri & Unggah Banyak Foto */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3] uppercase tracking-wider">
                Banyak Foto Perhiasan (Maks 10)
              </label>
              <label className="text-xs font-semibold text-[#8A6A2F] dark:text-[#D9B877] hover:underline cursor-pointer flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Foto</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {errors.photos && <p className="text-red-600 dark:text-red-400 text-xs mb-2">{errors.photos}</p>}

            {photos.length === 0 ? (
              <label className="border border-dashed border-[#D9CFBF] dark:border-white/20 bg-[#F4F1EB] dark:bg-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#EDE6DA] dark:hover:bg-white/10 transition-colors">
                <Upload className="w-6 h-6 mb-2 text-[#8A6A2F] dark:text-[#D9B877]" />
                <span className="text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3]">Pilih berkas foto perhiasan</span>
                <span className="text-[11px] text-[#4A5666] dark:text-white/60 mt-0.5">JPEG, PNG, WebP hingga 5 MB per foto</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-2">
                {photos.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-[#FAF8F5] dark:bg-white/5"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#E6DDD0] dark:border-white/10 bg-black shrink-0 relative">
                      <img src={item.previewUrl} alt={item.alt} className="w-full h-full object-cover" />
                      {item.isPrimary && (
                        <span className="absolute bottom-0 inset-x-0 bg-[#8A6A2F] text-[9px] text-white text-center font-bold">
                          Utama
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        placeholder="Alt text gambar (aksesibilitas)..."
                        value={item.alt}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPhotos((prev) =>
                            prev.map((p, idx) => (idx === index ? { ...p, alt: val } : p))
                          );
                        }}
                        className="w-full min-h-[32px] px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-[#12263A] dark:text-[#FBF8F3] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPrimaryPhoto(index)}
                        className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          item.isPrimary
                            ? 'bg-[#8A6A2F] text-white'
                            : 'bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-[#4A5666] dark:text-white/70 hover:bg-[#F4F1EB] dark:hover:bg-white/10'
                        }`}
                        title="Jadikan Foto Utama"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => movePhoto(index, 'up')}
                        className="p-1.5 rounded-lg bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-[#4A5666] dark:text-white/70 hover:bg-[#F4F1EB] dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                        title="Pindah ke Atas"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={index === photos.length - 1}
                        onClick={() => movePhoto(index, 'down')}
                        className="p-1.5 rounded-lg bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-[#4A5666] dark:text-white/70 hover:bg-[#F4F1EB] dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                        title="Pindah ke Bawah"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="p-1.5 rounded-lg bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#E6DDD0] dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] px-5 rounded-full border border-[#E6DDD0] dark:border-white/10 text-[#12263A] dark:text-[#FBF8F3] hover:bg-[#F4F1EB] dark:hover:bg-white/10 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
