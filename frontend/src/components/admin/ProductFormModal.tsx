import React, { useState, useEffect } from 'react';
import { X, Upload, Save, Star, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import type { MockProduct } from '../../types/models';

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
  onSave: (productData: Partial<MockProduct>, photoFiles?: File[]) => Promise<void> | void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
}) => {
  const isEditing = Boolean(product?.id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Kalung');
  const [variety, setVariety] = useState('South Sea');
  const [grade, setGrade] = useState('AAA');
  const [pearlSize, setPearlSize] = useState('12.0');
  const [weight, setWeight] = useState('5.0 gr');
  const [bentuk, setBentuk] = useState('Bulat');
  const [colorGroup, setColorGroup] = useState('emas');
  const [colorVariant, setColorVariant] = useState('Emas Champagne');
  const [price, setPrice] = useState(15000000);
  const [stock, setStock] = useState(5);
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      // Normalize category (e.g. Kalung Mutiara -> Kalung)
      const catNorm = (product.category || 'Kalung').replace(/\s*Mutiara/i, '').trim();
      setCategory(['Kalung', 'Gelang', 'Cincin', 'Anting', 'Liontin', 'Bros'].includes(catNorm) ? catNorm : 'Kalung');
      const varNorm = (product.variety || 'South Sea').replace(/\s*Pearl/i, '').replace(/Golden\s*/i, '').replace(/Black\s*/i, '').trim();
      setVariety(['Freshwater', 'South Sea', 'Tahitian'].includes(varNorm) ? varNorm : 'South Sea');
      setGrade(product.grade || 'AAA');
      setPearlSize(product.pearlSize ? product.pearlSize.replace(/[^0-9.]/g, '') || '12.0' : '12.0');
      setWeight(product.weight || '5.0 gr');
      setBentuk(product.bentuk || 'Bulat');
      setColorGroup(product.colorGroup || 'emas');
      setColorVariant(product.colorVariant || 'Emas Champagne');
      setPrice(Number(product.price) || 15000000);
      setStock(Number(product.stock) !== undefined ? Number(product.stock) : 5);
      setStatus(product.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif');

      if (product.images && product.images.length > 0) {
        setPhotos(
          product.images.map((img, idx) => ({
            id: `existing-${idx}`,
            previewUrl: img.url,
            isPrimary: img.is_primary,
            alt: img.alt || `${product.name} - Foto ${idx + 1}`,
          }))
        );
      } else if (product.image) {
        setPhotos([
          {
            id: 'existing-0',
            previewUrl: product.image,
            isPrimary: true,
            alt: product.name || 'Foto Produk',
          },
        ]);
      } else {
        setPhotos([]);
      }
    } else {
      setName('');
      setDescription('');
      setCategory('Kalung');
      setVariety('South Sea');
      setGrade('AAA');
      setPearlSize('12.0');
      setWeight('5.0 gr');
      setBentuk('Bulat');
      setColorGroup('emas');
      setColorVariant('Emas Champagne');
      setPrice(15000000);
      setStock(5);
      setStatus('Aktif');
      setPhotos([]);
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

    const sizeNum = parseFloat(pearlSize);
    if (isNaN(sizeNum) || sizeNum < 9 || sizeNum > 21) {
      errs.pearlSize = 'Ukuran mutiara wajib berada dalam rentang 9 hingga 21 mm.';
    }

    if (price < 0) {
      errs.price = 'Harga tidak boleh kurang dari Rp 0.';
    }

    if (stock < 0) {
      errs.stock = 'Stok tidak boleh kurang dari 0 unit.';
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

      const productPayload: Partial<MockProduct> = {
        ...product,
        name: name.trim(),
        description: description.trim(),
        category: `${category} Mutiara`,
        categorySlug: categorySlugMap[category] || 'kalung-mutiara',
        variety,
        grade,
        pearlSize: `${pearlSize} mm`,
        weight,
        bentuk,
        colorGroup,
        colorVariant,
        price,
        formattedPrice: `Rp ${price.toLocaleString('id-ID')}`,
        stock,
        status,
        image: primaryPhoto ? primaryPhoto.previewUrl : product?.image || '/images/placeholder_jewelry.svg',
        images: photos.map((p, idx) => ({
          url: p.previewUrl,
          order: idx + 1,
          is_primary: p.isPrimary,
          alt: p.alt,
        })),
      };

      const filesToUpload = photos.map((p) => p.file).filter(Boolean) as File[];
      await onSave(productPayload, filesToUpload);
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

      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto custom-scrollbar z-10 border-l border-[#E6DDD0]">
        {/* Header Panel */}
        <div className="p-6 border-b border-[#E6DDD0] flex items-center justify-between bg-[#FBF8F3]">
          <div>
            <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
              Atelier Editor
            </span>
            <h3 className="font-serif text-2xl font-semibold text-[#12263A]">
              {isEditing ? 'Ubah Data Produk' : 'Tambah Produk Baru'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#EDE6DA] text-[#12263A] transition-colors cursor-pointer"
            title="Tutup Form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          {/* Nama Produk */}
          <div>
            <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
              Nama Perhiasan Mutiara *
            </label>
            <input
              type="text"
              required
              name="name" placeholder="Contoh: Kalung Mutiara South Sea 18K"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none focus:border-[#12263A]"
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Kategori & Jenis Mutiara */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
              >
                <option value="Kalung">Kalung</option>
                <option value="Gelang">Gelang</option>
                <option value="Cincin">Cincin</option>
                <option value="Anting">Anting</option>
                <option value="Liontin">Liontin</option>
                <option value="Bros">Bros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                Jenis Mutiara
              </label>
              <select
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
              >
                <option value="South Sea">South Sea</option>
                <option value="Freshwater">Freshwater</option>
                <option value="Tahitian">Tahitian</option>
              </select>
            </div>
          </div>

          {/* Grade, Ukuran mm, Bentuk */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                Grade
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
              >
                <option value="AAA">AAA</option>
                <option value="AA">AA</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                Ukuran (mm) *
              </label>
              <input
                type="number"
                step="0.1"
                min="9"
                max="21"
                required
                name="ukuran_mm" placeholder="9-21 mm"
                value={pearlSize}
                onChange={(e) => setPearlSize(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
              />
              {errors.pearlSize && <p className="text-red-600 text-xs mt-1">{errors.pearlSize}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                Bentuk
              </label>
              <select
                value={bentuk}
                onChange={(e) => setBentuk(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
              >
                <option value="Bulat">Bulat</option>
                <option value="Semi-Baroque">Semi-Baroque</option>
                <option value="Baroque">Baroque</option>
                <option value="Drop">Drop</option>
                <option value="Oval">Oval</option>
                <option value="Button">Button</option>
              </select>
            </div>
          </div>

          {/* Berat, Kelompok Warna, Varian Warna */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                Berat
              </label>
              <input
                type="text"
                placeholder="Contoh: 5.2 gr"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                Kelompok Warna
              </label>
              <select
                value={colorGroup}
                onChange={(e) => setColorGroup(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
              >
                <option value="putih">Putih</option>
                <option value="emas">Emas</option>
                <option value="kuning">Kuning</option>
                <option value="langka">Langka</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                Varian Warna
              </label>
              <input
                type="text"
                placeholder="Champagne / Perak"
                value={colorVariant}
                onChange={(e) => setColorVariant(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
              />
            </div>
          </div>

          {/* Harga & Stok On Hand */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                Harga (Rp) *
              </label>
              <input
                type="number"
                min="0"
                required
                name="price" placeholder="15000000"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
              />
              {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price}</p>}
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                Stok On Hand *
              </label>
              <input
                type="number"
                min="0"
                required
                name="stock" placeholder="5"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
              />
              {errors.stock && <p className="text-red-600 text-xs mt-1">{errors.stock}</p>}
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                Status Aktif
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Aktif' | 'Nonaktif')}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
              Deskripsi Produk
            </label>
            <textarea
              rows={3}
              name="description" placeholder="Jelaskan kilau nacre, asal perairan Lombok, dan detail tatahan perhiasan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
            />
          </div>

          {/* Galeri & Unggah Banyak Foto */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider">
                Banyak Foto Perhiasan (Maks 10)
              </label>
              <label className="text-xs font-semibold text-[#8A6A2F] hover:underline cursor-pointer flex items-center gap-1">
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

            {errors.photos && <p className="text-red-600 text-xs mb-2">{errors.photos}</p>}

            {photos.length === 0 ? (
              <label className="border border-dashed border-[#D9CFBF] bg-[#F4F1EB] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#EDE6DA] transition-colors">
                <Upload className="w-6 h-6 mb-2 text-[#8A6A2F]" />
                <span className="text-xs font-semibold text-[#12263A]">Pilih berkas foto perhiasan</span>
                <span className="text-[11px] text-[#4A5666] mt-0.5">JPEG, PNG, WebP hingga 5 MB per foto</span>
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
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF8F5]"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#E6DDD0] bg-black shrink-0 relative">
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
                        className="w-full min-h-[32px] px-2.5 py-1 text-xs rounded-lg bg-white border border-[#E6DDD0] text-[#12263A] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPrimaryPhoto(index)}
                        className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          item.isPrimary
                            ? 'bg-[#8A6A2F] text-white'
                            : 'bg-white border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB]'
                        }`}
                        title="Jadikan Foto Utama"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => movePhoto(index, 'up')}
                        className="p-1.5 rounded-lg bg-white border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB] disabled:opacity-30 cursor-pointer"
                        title="Pindah ke Atas"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={index === photos.length - 1}
                        onClick={() => movePhoto(index, 'down')}
                        className="p-1.5 rounded-lg bg-white border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB] disabled:opacity-30 cursor-pointer"
                        title="Pindah ke Bawah"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="p-1.5 rounded-lg bg-white border border-[#E6DDD0] text-red-600 hover:bg-red-50 cursor-pointer"
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
          <div className="pt-4 border-t border-[#E6DDD0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] px-5 rounded-full border border-[#E6DDD0] text-[#12263A] hover:bg-[#F4F1EB] text-xs font-semibold transition-colors cursor-pointer"
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

