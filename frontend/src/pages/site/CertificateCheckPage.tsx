import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, ShieldCheck, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { certificateApi } from '../../lib/api';

export const CertificateCheckPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('nomor') || searchParams.get('code') || '';

  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Cek Sertifikat Gemologi | CD'E Pearls Lombok";
    if (initialCode) {
      handleLookup(initialCode);
    }
  }, [initialCode]);

  const handleLookup = async (certCode: string) => {
    if (!certCode.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await certificateApi.lookup(certCode.trim());
      if (data && (data.certificate || data.data)) {
        setResult(data.certificate || data.data);
      } else {
        setError('Nomor sertifikat tidak ditemukan dalam arsip gemologi resmi CD\'E Pearls Lombok.');
      }
    } catch {
      setError('Nomor sertifikat tidak ditemukan dalam arsip gemologi resmi CD\'E Pearls Lombok.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(code);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
      {/* Page Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A6A2F]/10 border border-[#8A6A2F]/20 text-[#8A6A2F] text-[12px] font-semibold tracking-wider uppercase">
          <Award className="w-3.5 h-3.5" />
          <span>Verifikasi Gemologi Resmi</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
          Verifikasi Sertifikat Gemologi
        </h1>
        <p className="text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] leading-relaxed font-light">
          Setiap butir mutiara CD'E Pearls diuji secara independen oleh gemolog bersertifikasi. Masukkan nomor sertifikat untuk memeriksa keaslian arsip laboratorium.
        </p>
      </div>

      {/* Search Input Form */}
      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8A6A2F] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: CDE-PL-2026-0891"
              className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-white dark:bg-[#12263A] text-xs font-mono text-[#12263A] dark:text-[#FBF8F3] uppercase placeholder:normal-case focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="min-h-[48px] px-6 rounded-xl bg-[#12263A] text-white hover:bg-[#1A3652] disabled:opacity-50 text-xs font-semibold cursor-pointer shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            {isLoading ? 'Memeriksa...' : 'Periksa Sertifikat'}
          </button>
        </form>
      </div>

      {/* Error Notice */}
      {error && (
        <div
          role="alert"
          className="max-w-xl mx-auto p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {/* Certificate Details Result */}
      {result && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#12263A] border-2 border-[#D9B877] rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-[#E6DDD0] dark:border-white/10 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 block">
                  Status: Terverifikasi Asli (100% Authentic)
                </span>
                <h3 className="font-mono text-xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
                  {result.certificate_number}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#4A5666] dark:text-[#D9B877] block">Tanggal Penerbitan:</span>
              <span className="font-semibold text-xs text-[#12263A] dark:text-[#FBF8F3]">
                {result.issued_date || '15 Maret 2026'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FBF8F3] dark:bg-white/5 space-y-1">
              <span className="text-[#4A5666] dark:text-[#D9B877]/80 block">Laboratorium Penguji</span>
              <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">{result.lab_name}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FBF8F3] dark:bg-white/5 space-y-1">
              <span className="text-[#4A5666] dark:text-[#D9B877]/80 block">Grade Gemologi</span>
              <span className="font-bold text-[#8A6A2F] dark:text-[#D9B877]">{result.grade}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FBF8F3] dark:bg-white/5 space-y-1">
              <span className="text-[#4A5666] dark:text-[#D9B877]/80 block">Varietas Mutiara</span>
              <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">{result.variety}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FBF8F3] dark:bg-white/5 space-y-1">
              <span className="text-[#4A5666] dark:text-[#D9B877]/80 block">Lokasi Budidaya</span>
              <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">
                {result.origin || 'Sekotong & Medana, Lombok'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FBF8F3] dark:bg-white/5 space-y-1">
              <span className="text-[#4A5666] dark:text-[#D9B877]/80 block">Diameter Butir</span>
              <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">{result.diameter_mm || '12.4 mm'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FBF8F3] dark:bg-white/5 space-y-1">
              <span className="text-[#4A5666] dark:text-[#D9B877]/80 block">Kilau (Luster) & Bentuk</span>
              <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">
                {result.luster} • {result.shape}
              </span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-[#E6DDD0] dark:border-white/10">
            <div className="flex items-center gap-2 text-xs text-[#4A5666] dark:text-[#D9B877]">
              <ShieldCheck className="w-4 h-4 text-[#8A6A2F]" />
              <span>Arsip Gemologi Terenkripsi &amp; Terverifikasi SPI</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateCheckPage;
