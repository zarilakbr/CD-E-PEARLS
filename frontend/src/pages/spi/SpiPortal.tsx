import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  X,
  Search,
  Download,
  Lock,
  Unlock,
  Key,
  UserPlus,
} from 'lucide-react';
import { SpiDashboardLayout } from '../../layouts/SpiDashboardLayout';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import {
  type MockSpiAuditLog,
  type MockSpiFinding,
  type MockStaffAccount,
  type MockApprovalItem,
  type MockProduct,
  type MockOrder,
  type MockStockItem,
} from '../../data/mock';
import { spiApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface SpiPortalProps {
  onNavigateHome: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
  approvals: MockApprovalItem[];
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, reason: string) => void;
  auditLogs: MockSpiAuditLog[];
  staffAccounts: MockStaffAccount[];
  onToggleStaffStatus: (id: number) => void;
  onAddStaffAccount?: (staff: Omit<MockStaffAccount, 'id' | 'status' | 'lastActive'>) => void;
  onResetPassword?: (id: number, email: string) => void;
  findings: MockSpiFinding[];
  onAddFinding: (finding: Omit<MockSpiFinding, 'id' | 'date'>) => void;
  onToggleFindingStatus: (id: number) => void;
  onDeleteFinding: (id: number) => void;
  products?: MockProduct[];
  orders?: MockOrder[];
  stockItems?: MockStockItem[];
  initialMenu?: string;
}

export const SpiPortal: React.FC<SpiPortalProps> = ({
  onNavigateHome,
  onOpenAdmin,
  onLogout,
  approvals,
  onApprove,
  onReject,
  auditLogs,
  staffAccounts,
  onToggleStaffStatus,
  onAddStaffAccount,
  onResetPassword,
  findings,
  onAddFinding,
  onToggleFindingStatus,
  onDeleteFinding,
  initialMenu,
}) => {
  const { user } = useAuth();
  const [activeMenu, setActiveMenu] = useState<string>(() => {
    if (initialMenu) return initialMenu;
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/spi/log-aktivitas') return 'log-aktivitas';
      if (path === '/spi/persetujuan') return 'persetujuan';
      if (path === '/spi/akun-role') return 'akun-role';
      if (path === '/spi/laporan-audit') return 'laporan-audit';

      const params = new URLSearchParams(window.location.search);
      const m = params.get('menu');
      if (m && ['ringkasan', 'log-aktivitas', 'persetujuan', 'akun-role', 'laporan-audit'].includes(m)) {
        return m;
      }
    }
    return 'ringkasan';
  });

  React.useEffect(() => {
    if (initialMenu) {
      setActiveMenu(initialMenu);
    }
  }, [initialMenu]);

  const handleSelectSpiMenu = (menuId: string) => {
    setActiveMenu(menuId);
    const pathMap: Record<string, string> = {
      ringkasan: '/spi',
      'log-aktivitas': '/spi/log-aktivitas',
      persetujuan: '/spi/persetujuan',
      'akun-role': '/spi/akun-role',
      'laporan-audit': '/spi/laporan-audit',
    };
    const targetPath = pathMap[menuId] || '/spi';
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  // Persetujuan Tab Filter ('Semua' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak')
  const [approvalTab, setApprovalTab] = useState<'Semua' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak'>('Menunggu Persetujuan');
  const [selectedApproval, setSelectedApproval] = useState<MockApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
  const [approvalNote, setApprovalNote] = useState<string>('');

  // Log Aktivitas Filters
  const [logSearch, setLogSearch] = useState<string>('');
  const [logRoleFilter, setLogRoleFilter] = useState<string>('Semua');

  // Laporan Audit Filters & Modals
  const [findingSeverityFilter, setFindingSeverityFilter] = useState<string>('Semua');
  const [isAddFindingModalOpen, setIsAddFindingModalOpen] = useState<boolean>(false);
  const [newFindingCode, setNewFindingCode] = useState<string>('');
  const [newFindingTitle, setNewFindingTitle] = useState<string>('');
  const [newFindingCategory, setNewFindingCategory] = useState<MockSpiFinding['category']>('Inventaris');
  const [newFindingSeverity, setNewFindingSeverity] = useState<MockSpiFinding['severity']>('Tinggi');
  const [newFindingStaff, setNewFindingStaff] = useState<string>('Hendra Saputra (Staff Gudang)');
  const [newFindingRec, setNewFindingRec] = useState<string>('');

  // Akun & Role SPI States
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<MockStaffAccount['role']>('Admin Operasional');
  const [newStaffPerms, setNewStaffPerms] = useState('Katalog, Pesanan, Stok');

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;
    const perms = newStaffPerms.split(',').map((p) => p.trim()).filter(Boolean);
    onAddStaffAccount?.({
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      role: newStaffRole,
      permissions: perms.length > 0 ? perms : ['Katalog', 'Pesanan', 'Stok'],
    });
    setNewStaffName('');
    setNewStaffEmail('');
    setIsAddStaffModalOpen(false);
  };

  // Counts
  const pendingApprovals = approvals.filter((a) => a.status === 'Menunggu Persetujuan');
  const activeFindings = findings.filter((f) => f.status === 'Dalam Investigasi');

  // Handle Approve Action
  const handleConfirmApprove = () => {
    if (!selectedApproval) return;
    onApprove(selectedApproval.id, approvalNote.trim() || undefined);
    setIsApproveModalOpen(false);
    setSelectedApproval(null);
    setApprovalNote('');
  };

  // Handle Reject Action
  const handleConfirmReject = () => {
    if (!selectedApproval || !rejectReason.trim()) return;
    onReject(selectedApproval.id, rejectReason.trim());
    setIsRejectModalOpen(false);
    setSelectedApproval(null);
    setRejectReason('');
  };

  // Handle Add Finding
  const handleSaveFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFindingTitle.trim()) return;
    const generatedCode = newFindingCode.trim() || `SPI-FND-00${findings.length + 1}`;
    onAddFinding({
      code: generatedCode,
      title: newFindingTitle.trim(),
      category: newFindingCategory,
      severity: newFindingSeverity,
      staffName: newFindingStaff,
      recommendation: newFindingRec.trim() || 'Lakukan audit dan sinkronisasi SOP berkala.',
      status: 'Dalam Investigasi',
    });
    setNewFindingCode('');
    setNewFindingTitle('');
    setNewFindingRec('');
    setIsAddFindingModalOpen(false);
  };

  const getTypeBadge = (type: MockApprovalItem['type']) => {
    switch (type) {
      case 'KONFIRMASI_PEMBAYARAN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E1ECF7] text-[#1D4E7A]">Konfirmasi Pembayaran</span>;
      case 'PERUBAHAN_HARGA':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FBEFD5] text-[#7A5410]">Perubahan Harga (&gt;10%)</span>;
      case 'HAPUS_PRODUK':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800">Hapus Produk</span>;
      case 'PENYESUAIAN_STOK':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">Penyesuaian Stok</span>;
      case 'PEMBATALAN_PESANAN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-800">Pembatalan Pesanan</span>;
      case 'DISKON_VIP':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Diskon VIP (&gt;15%)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-800">{type}</span>;
    }
  };

  return (
    <SpiDashboardLayout
      activeMenuId={activeMenu}
      onSelectMenu={handleSelectSpiMenu}
      pendingApprovalsCount={pendingApprovals.length}
      userName={user?.name || 'Satuan Pengawas Internal'}
      userEmail={user?.email || 'owner.spi@cdepearls.com'}
      onNavigateHome={onNavigateHome}
      onOpenAdmin={onOpenAdmin}
      onLogout={onLogout}
    >
      {/* =======================================================================
          1. MENU: RINGKASAN
         ======================================================================= */}
      {activeMenu === 'ringkasan' && (
        <div className="space-y-6">
          <PageHeader
            title="Ringkasan Pengawasan SPI"
            description="Portal Satuan Pengawas Internal: Kendali integritas transaksi, persetujuan sensitif, dan log audit CD'E Pearls Lombok."
          />

          {/* Pending Alert Banner if any items waiting */}
          {pendingApprovals.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#12263A] text-white border border-[#D9B877]/60 shadow-md flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D9B877] text-[#12263A] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {pendingApprovals.length}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#D9B877]">
                    Terdapat {pendingApprovals.length} Aksi Sensitif Membutuhkan Persetujuan SPI
                  </h3>
                  <p className="text-xs text-white/80 mt-0.5">
                    Permintaan dari Admin mencakup pembayaran transfer manual, revisi harga &gt;10%, dan perubahan stok.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMenu('persetujuan')}
                className="min-h-[42px] px-5 rounded-full bg-[#D9B877] text-[#12263A] font-bold text-xs hover:bg-[#E5C98E] active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Tinjau Persetujuan Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Menunggu Persetujuan"
              value={`${pendingApprovals.length} Pengajuan`}
              note={pendingApprovals.length > 0 ? 'Perlu Keputusan' : 'Semua Bersih'}
              trend={pendingApprovals.length > 0 ? 'down' : 'up'}
            />
            <StatCard
              label="Total Log Aktivitas"
              value={`${auditLogs.length} Entri`}
              note="Tercatat Realtime"
              trend="neutral"
            />
            <StatCard
              label="Temuan Audit Aktif"
              value={`${activeFindings.length} Kasus`}
              note={activeFindings.length > 0 ? 'Dalam Investigasi' : 'Nol Masalah'}
              trend={activeFindings.length > 0 ? 'down' : 'up'}
            />
            <StatCard
              label="Kepatuhan SOP Internal"
              value="98.8%"
              note="Taraf Unggul & Teruji"
              trend="up"
            />
          </div>

          {/* 2-Columns: Persetujuan Mendesak + Aktivitas Terbaru */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: Persetujuan Menunggu */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#E6DDD0]">
                  <h3 className="font-serif text-xl font-semibold text-[#12263A]">
                    Persetujuan Mendesak (Pending SPI)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveMenu('persetujuan')}
                    className="text-xs font-semibold text-[#8A6A2F] hover:underline cursor-pointer"
                  >
                    Lihat Semua ({pendingApprovals.length})
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {pendingApprovals.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#4A5666]">
                      ✓ Tidak ada aksi sensitif yang tertunda saat ini.
                    </div>
                  ) : (
                    pendingApprovals.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-[#F4F1EB]/60 border border-[#E6DDD0] flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {getTypeBadge(item.type)}
                            <h4 className="font-semibold text-xs text-[#12263A] mt-1.5">{item.title}</h4>
                            <p className="text-[11px] text-[#4A5666]">{item.target}</p>
                          </div>
                          <span className="text-[10px] text-[#4A5666] shrink-0">{item.requestDate}</span>
                        </div>
                        <div className="text-[11px] bg-white p-2.5 rounded-lg border border-[#E6DDD0]/60 italic text-[#4A5666]">
                          "{item.notes}"
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApproval(item);
                              setIsRejectModalOpen(true);
                            }}
                            className="min-h-[32px] px-3 rounded-full border border-red-300 text-red-700 hover:bg-red-50 text-[11px] font-semibold cursor-pointer"
                          >
                            Tolak
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApproval(item);
                              setIsApproveModalOpen(true);
                            }}
                            className="min-h-[32px] px-3.5 rounded-full bg-[#12263A] text-[#D9B877] hover:bg-[#1A3652] text-[11px] font-bold cursor-pointer"
                          >
                            Setujui
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Box 2: Log Audit Terbaru */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#E6DDD0]">
                  <h3 className="font-serif text-xl font-semibold text-[#12263A]">
                    Log Audit Transaksi Terbaru
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveMenu('log-aktivitas')}
                    className="text-xs font-semibold text-[#8A6A2F] hover:underline cursor-pointer"
                  >
                    Buka Log Lengkap ({auditLogs.length})
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {auditLogs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#FBF8F3] border border-[#E6DDD0]/70 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#12263A]">{log.action}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'Disetujui'
                                ? 'bg-[#E2F1E0] text-[#2B6330]'
                                : log.status === 'Ditolak'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-[#FBEFD5] text-[#7A5410]'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#4A5666]">
                          Pelaku: <strong className="text-[#12263A]">{log.user}</strong> • Objek: {log.target}
                        </p>
                        {log.oldValue && log.newValue && (
                          <div className="text-[10px] text-[#4A5666] grid grid-cols-2 gap-2 pt-0.5 font-mono">
                            <div><span className="text-red-700">Lama:</span> {log.oldValue}</div>
                            <div><span className="text-emerald-700">Baru:</span> {log.newValue}</div>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[#4A5666] shrink-0 whitespace-nowrap">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          2. MENU: LOG AKTIVITAS (Waktu, Pelaku, Aksi, Target, Nilai Lama, Nilai Baru, Status)
         ======================================================================= */}
      {activeMenu === 'log-aktivitas' && (
        <div className="space-y-6">
          <PageHeader
            title="Log Aktivitas &amp; Audit Forensik"
            description="Perekaman kronologis mutlak setiap aksi di seluruh toko: perubahan harga, transaksi, penghapusan, dan penerbitan sertifikat."
          />

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6DDD0] flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <input
                type="text"
                placeholder="Cari pelaku, objek, atau nomor pesanan..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full min-h-[44px] pl-10 pr-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A] focus:bg-white"
              />
              <Search className="w-4 h-4 text-[#4A5666] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#4A5666]">Filter Peran:</span>
              {(['Semua', 'admin', 'spi', 'user'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setLogRoleFilter(role)}
                  className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                    logRoleFilter === role
                      ? 'bg-[#12263A] text-white'
                      : 'bg-[#F4F1EB] text-[#4A5666] hover:bg-[#EDE6DA]'
                  }`}
                >
                  {role === 'Semua' ? 'Semua Peran' : role === 'spi' ? 'SPI' : role === 'admin' ? 'Admin' : 'User'}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Log Table */}
          <DataTable>
            <thead>
              <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                <th className="py-3.5 px-4 text-left">Waktu &amp; Tanggal</th>
                <th className="py-3.5 px-4 text-left">Pelaku &amp; Peran</th>
                <th className="py-3.5 px-4 text-left">Aksi Sistem</th>
                <th className="py-3.5 px-4 text-left">Target Objek</th>
                <th className="py-3.5 px-4 text-left">Nilai Lama</th>
                <th className="py-3.5 px-4 text-left">Nilai Baru</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDD0]/60 text-xs">
              {auditLogs
                .filter((l) => (logRoleFilter === 'Semua' ? true : l.role === logRoleFilter))
                .filter((l) =>
                  logSearch
                    ? l.user.toLowerCase().includes(logSearch.toLowerCase()) ||
                      l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
                      l.target.toLowerCase().includes(logSearch.toLowerCase())
                    : true
                )
                .map((log) => (
                  <tr key={log.id} className="hover:bg-[#FBF8F3] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#4A5666] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#12263A]">{log.user}</div>
                      <span className="text-[10px] text-[#4A5666] uppercase">{log.role}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#12263A]">{log.action}</td>
                    <td className="py-3.5 px-4 text-[#4A5666] font-mono text-[11px]">{log.target}</td>
                    <td className="py-3.5 px-4 text-red-700 font-mono text-[11px] max-w-[160px] truncate" title={log.oldValue || '-'}>
                      {log.oldValue || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-700 font-mono text-[11px] max-w-[160px] truncate" title={log.newValue || '-'}>
                      {log.newValue || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'Disetujui'
                            ? 'bg-[#E2F1E0] text-[#2B6330]'
                            : log.status === 'Ditolak'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-[#FBEFD5] text-[#7A5410]'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </DataTable>
        </div>
      )}

      {/* =======================================================================
          3. MENU: PERSETUJUAN (Semua aksi sensitif: Pembayaran, Ubah Harga >10%, Hapus Produk, Stok, Batal, Diskon >15%)
         ======================================================================= */}
      {activeMenu === 'persetujuan' && (
        <div className="space-y-6">
          <PageHeader
            title="Persetujuan Aksi Sensitif (Otorisasi SPI)"
            description="Alur persetujuan eksklusif: Setiap pengajuan dari Admin wajib dilengkapi catatan dan diputuskan oleh SPI sebelum dieksekusi ke data aktif."
          />

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E6DDD0] pb-3">
            {(['Semua', 'Menunggu Persetujuan', 'Disetujui', 'Ditolak'] as const).map((tab) => {
              const count =
                tab === 'Semua'
                  ? approvals.length
                  : approvals.filter((a) => a.status === tab).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setApprovalTab(tab)}
                  className={`min-h-[40px] px-4 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    approvalTab === tab
                      ? 'bg-[#12263A] text-white shadow-xs'
                      : 'bg-white border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB]'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] ${
                      approvalTab === tab
                        ? 'bg-[#D9B877] text-[#12263A] font-bold'
                        : 'bg-[#F4F1EB] text-[#4A5666]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List of Approval Cards */}
          <div className="space-y-4">
            {approvals
              .filter((item) => (approvalTab === 'Semua' ? true : item.status === approvalTab))
              .map((item) => {
                const isPending = item.status === 'Menunggu Persetujuan';
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    {/* Header Card */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E6DDD0]">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-[#8A6A2F] bg-[#FBF8F3] px-2.5 py-1 rounded-md border border-[#E6DDD0]">
                          {item.id}
                        </span>
                        {getTypeBadge(item.type)}
                        <h3 className="font-serif text-lg font-semibold text-[#12263A]">{item.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#4A5666]">Diajukan: {item.requestDate}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.status === 'Disetujui'
                              ? 'bg-[#E2F1E0] text-[#2B6330]'
                              : item.status === 'Ditolak'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-[#FBEFD5] text-[#7A5410]'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-[#4A5666] block mb-0.5">Pengaju (Admin):</span>
                        <span className="font-semibold text-[#12263A]">{item.requestedBy}</span>
                      </div>
                      <div>
                        <span className="text-[#4A5666] block mb-0.5">Target Objek:</span>
                        <span className="font-mono font-semibold text-[#12263A]">{item.target}</span>
                      </div>
                      <div>
                        <span className="text-[#4A5666] block mb-0.5">Jenis Operasi:</span>
                        <span className="font-medium text-[#12263A]">{item.type.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    {/* Catatan Wajib Admin (Highlight) */}
                    <div className="p-3.5 rounded-xl bg-[#FBF8F3] border border-[#E6DDD0] text-xs">
                      <span className="font-semibold text-[#8A6A2F] block mb-1">
                        Catatan Pengajuan dari Admin:
                      </span>
                      <p className="text-[#12263A] leading-relaxed italic">
                        "{item.notes}"
                      </p>
                    </div>

                    {/* Perbandingan Nilai Lama vs Nilai Baru */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-red-50/70 border border-red-200">
                        <span className="text-red-800 font-bold block mb-1">Nilai / Kondisi Lama:</span>
                        <p className="text-red-950 font-medium">{item.oldValue}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                        <span className="text-emerald-800 font-bold block mb-1">Nilai / Kondisi Baru yang Diajukan:</span>
                        <p className="text-emerald-950 font-medium">{item.newValue}</p>
                      </div>
                    </div>

                    {/* Review Info if already decided */}
                    {item.reviewedBy && (
                      <div className="p-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-[#12263A]">Keputusan oleh: </span>
                          <span className="text-[#4A5666]">{item.reviewedBy} ({item.reviewedDate})</span>
                        </div>
                        {item.reviewNotes && (
                          <div className="text-[#4A5666] italic">
                            Catatan SPI: "{item.reviewNotes}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons for Pending Items */}
                    {isPending && (
                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E6DDD0]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApproval(item);
                            setIsRejectModalOpen(true);
                          }}
                          className="min-h-[42px] px-5 rounded-full border border-red-300 text-red-700 hover:bg-red-50 active:scale-95 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Tolak Pengajuan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApproval(item);
                            setIsApproveModalOpen(true);
                          }}
                          className="min-h-[42px] px-6 rounded-full bg-[#12263A] text-[#D9B877] hover:bg-[#1A3652] active:scale-95 text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md transition-all border border-[#D9B877]/40"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#D9B877]" />
                          <span>Setujui &amp; Terapkan Sistem</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* =======================================================================
          4. MENU: AKUN & ROLE (Pengawasan RBAC & Akun Staf)
         ======================================================================= */}
      {activeMenu === 'akun-role' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <PageHeader
              title="Pengawasan Akun &amp; Hak Akses (RBAC)"
              description="Satuan Pengawas Internal memiliki hak veto untuk memverifikasi hak akses staf, menambah akun operasional, dan membekukan akun bila terindikasi anomali."
            />
            <button
              type="button"
              onClick={() => setIsAddStaffModalOpen(true)}
              className="min-h-[44px] px-5 rounded-full bg-[#12263A] text-[#D9B877] font-bold text-xs hover:bg-[#1A3652] inline-flex items-center gap-2 cursor-pointer shadow-md border border-[#D9B877]/40"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Akun Admin Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Akun Karyawan"
              value={`${staffAccounts.length} Akun`}
              note="Terdaftar Aktif"
              trend="neutral"
            />
            <StatCard
              label="Akun Berstatus Aktif"
              value={`${staffAccounts.filter((s) => s.status === 'Aktif').length} Staf`}
              note="Hak Akses Terverifikasi"
              trend="up"
            />
            <StatCard
              label="Akun Dibekukan"
              value={`${staffAccounts.filter((s) => s.status !== 'Aktif').length} Akun`}
              note={staffAccounts.some((s) => s.status !== 'Aktif') ? 'Tersuspend Sementara' : 'Nol Suspensi'}
              trend={staffAccounts.some((s) => s.status !== 'Aktif') ? 'down' : 'neutral'}
            />
          </div>

          <DataTable>
            <thead>
              <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                <th className="py-3.5 px-4 text-left">Nama &amp; Email</th>
                <th className="py-3.5 px-4 text-left">Peran / Jabatan</th>
                <th className="py-3.5 px-4 text-left">Hak Akses Sistem</th>
                <th className="py-3.5 px-4 text-left">Aktivitas Terakhir</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Tindakan SPI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDD0]/60 text-xs">
              {staffAccounts.map((account) => {
                const isAktif = account.status === 'Aktif';
                return (
                  <tr key={account.id} className="hover:bg-[#FBF8F3] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#12263A]">{account.name}</div>
                      <span className="text-[11px] text-[#4A5666]">{account.email}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#12263A]">
                      {account.role}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {account.permissions.map((perm, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-full text-[10px] bg-[#F4F1EB] text-[#12263A] border border-[#E6DDD0]"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#4A5666] text-[11px]">{account.lastActive}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isAktif ? 'bg-[#E2F1E0] text-[#2B6330]' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {account.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Reset kata sandi akun ${account.name} (${account.email}) ke password default "password123"?`)) {
                              onResetPassword?.(account.id, account.email);
                            }
                          }}
                          className="min-h-[34px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1 border border-[#E6DDD0] text-[#4A5666] hover:text-[#12263A] hover:bg-[#F4F1EB] transition-all cursor-pointer"
                          title="Reset kata sandi akun ini"
                        >
                          <Key className="w-3.5 h-3.5 text-[#8A6A2F]" />
                          <span className="hidden sm:inline">Reset Sandi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleStaffStatus(account.id)}
                          className={`min-h-[34px] px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                            isAktif
                              ? 'border border-red-300 text-red-700 hover:bg-red-50'
                              : 'bg-[#12263A] text-[#D9B877] hover:bg-[#1A3652]'
                          }`}
                          title={isAktif ? 'Bekukan akun staf ini untuk sementara' : 'Aktifkan kembali akun staf ini'}
                        >
                          {isAktif ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          <span>{isAktif ? 'Bekukan' : 'Aktifkan'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </div>
      )}

      {/* =======================================================================
          5. MENU: LAPORAN AUDIT (Temuan SPI, Rekomendasi, Tambah Temuan, Export)
         ======================================================================= */}
      {activeMenu === 'laporan-audit' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <PageHeader
              title="Laporan Temuan Audit SPI"
              description="Dokumentasi temuan ketidaksesuaian operasional butik, stok mutiara, selisih kasir, dan kepatuhan sertifikat."
            />
            <button
              type="button"
              onClick={() => setIsAddFindingModalOpen(true)}
              className="min-h-[44px] px-5 rounded-full bg-[#12263A] text-[#D9B877] font-bold text-xs hover:bg-[#1A3652] inline-flex items-center gap-2 cursor-pointer shadow-md border border-[#D9B877]/40"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Temuan Audit Baru</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6DDD0] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#12263A]">Filter Keparahan:</span>
              {(['Semua', 'Tinggi', 'Sedang', 'Rendah'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setFindingSeverityFilter(sev)}
                  className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    findingSeverityFilter === sev
                      ? 'bg-[#12263A] text-white'
                      : 'bg-[#F4F1EB] text-[#4A5666] hover:bg-[#EDE6DA]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => window.open(spiApi.getAuditFindingsReportUrl(), '_blank')}
              className="min-h-[36px] px-4 rounded-full border border-[#E6DDD0] text-[#12263A] hover:bg-[#F4F1EB] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#8A6A2F]" />
              <span>Unduh Laporan Audit (PDF)</span>
            </button>
          </div>

          {/* Findings List */}
          <div className="space-y-4">
            {findings
              .filter((f) => (findingSeverityFilter === 'Semua' ? true : f.severity === findingSeverityFilter))
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E6DDD0]">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-[#8A6A2F] bg-[#FBF8F3] px-2.5 py-1 rounded-md border border-[#E6DDD0]">
                        {item.code}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.severity === 'Tinggi'
                            ? 'bg-red-100 text-red-800'
                            : item.severity === 'Sedang'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        Keparahan: {item.severity}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F4F1EB] text-[#12263A]">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#4A5666]">{item.date}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.status === 'Selesai'
                            ? 'bg-[#E2F1E0] text-[#2B6330]'
                            : 'bg-[#FBEFD5] text-[#7A5410]'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-serif text-lg font-semibold text-[#12263A]">{item.title}</h3>

                  <div className="p-3.5 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs">
                    <span className="font-semibold text-[#8A6A2F] block mb-1">Rekomendasi Tindakan Korektif SPI:</span>
                    <p className="text-[#12263A] leading-relaxed">{item.recommendation}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                    <span className="text-[#4A5666]">
                      Personel Terkait: <strong className="text-[#12263A]">{item.staffName}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleFindingStatus(item.id)}
                        className={`min-h-[34px] px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                          item.status === 'Selesai'
                            ? 'bg-[#F4F1EB] text-[#4A5666] hover:bg-[#EDE6DA]'
                            : 'bg-[#E2F1E0] text-[#2B6330] hover:bg-[#D4E8D2]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{item.status === 'Selesai' ? 'Buka Kembali Investigasi' : 'Tandai Selesai'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteFinding(item.id)}
                        className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus Temuan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: SETUJUI AKSI SENSITIF
         ======================================================================= */}
      {isApproveModalOpen && selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12263A]/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-[#E6DDD0] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#12263A] space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#E2F1E0] text-[#2B6330] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#12263A]">
                  Setujui Pengajuan #{selectedApproval.id}
                </h3>
                <p className="text-xs text-[#4A5666]">
                  Keputusan ini akan segera memperbarui data aktif toko dan tercatat di Log Aktivitas.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#4A5666]">Target:</span>
                <span className="font-semibold text-[#12263A]">{selectedApproval.target}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A5666]">Pengaju:</span>
                <span className="font-semibold text-[#12263A]">{selectedApproval.requestedBy}</span>
              </div>
              <div className="border-t border-[#E6DDD0] pt-1.5 mt-1.5">
                <span className="text-[#4A5666] block mb-0.5">Nilai Baru:</span>
                <span className="font-mono text-emerald-800 font-semibold">{selectedApproval.newValue}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1.5">
                Catatan Persetujuan SPI (Opsional)
              </label>
              <textarea
                rows={2}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Contoh: Bukti mutasi telah diverifikasi cocok dengan rekening koran butik."
                className="w-full p-3 rounded-2xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A] focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsApproveModalOpen(false);
                  setSelectedApproval(null);
                }}
                className="min-h-[44px] px-5 rounded-full border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB] text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-[#D9B877] font-bold text-xs hover:bg-[#1A3652] cursor-pointer shadow-md inline-flex items-center gap-2 border border-[#D9B877]/40"
              >
                <Check className="w-4 h-4 text-[#D9B877]" />
                <span>Konfirmasi Setujui</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: TOLAK AKSI SENSITIF
         ======================================================================= */}
      {isRejectModalOpen && selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12263A]/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-[#E6DDD0] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#12263A] space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#12263A]">
                  Tolak Pengajuan #{selectedApproval.id}
                </h3>
                <p className="text-xs text-[#4A5666]">
                  Aksi sensitif tidak akan diterapkan dan alasan penolakan wajib dicatat.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#4A5666]">Target:</span>
                <span className="font-semibold text-[#12263A]">{selectedApproval.target}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A5666]">Diajukan oleh:</span>
                <span className="font-semibold text-[#12263A]">{selectedApproval.requestedBy}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1.5">
                Alasan Penolakan SPI <span className="text-red-600">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Bukti mutasi belum tertera di internet banking butik atau diskon melampaui margin modal."
                className="w-full p-3 rounded-2xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A] focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setSelectedApproval(null);
                }}
                className="min-h-[44px] px-5 rounded-full border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB] text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={handleConfirmReject}
                className="min-h-[44px] px-6 rounded-full bg-red-700 text-white font-bold text-xs hover:bg-red-800 disabled:opacity-50 cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Konfirmasi Tolak</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: TAMBAH TEMUAN AUDIT BARU
         ======================================================================= */}
      {isAddFindingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12263A]/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-[#E6DDD0] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#12263A] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DDD0]">
              <h3 className="font-serif text-2xl font-semibold text-[#12263A]">
                Catat Temuan Audit SPI Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddFindingModalOpen(false)}
                className="p-2 rounded-full text-[#4A5666] hover:bg-[#F4F1EB]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFinding} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                  Judul Temuan <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFindingTitle}
                  onChange={(e) => setNewFindingTitle(e.target.value)}
                  placeholder="Contoh: Selisih Fisik Mutiara South Sea 12mm di Brankas Utama"
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                    Kategori Temuan
                  </label>
                  <select
                    value={newFindingCategory}
                    onChange={(e) => setNewFindingCategory(e.target.value as any)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                  >
                    <option value="Inventaris">Inventaris &amp; Stok</option>
                    <option value="Finansial">Finansial &amp; Transaksi</option>
                    <option value="Kepatuhan Gemologi">Kepatuhan Gemologi</option>
                    <option value="Operasional">Operasional Butik</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                    Tingkat Keparahan
                  </label>
                  <select
                    value={newFindingSeverity}
                    onChange={(e) => setNewFindingSeverity(e.target.value as any)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                  >
                    <option value="Tinggi">Tinggi (Kritis)</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                  Personel / Staf Terkait
                </label>
                <input
                  type="text"
                  value={newFindingStaff}
                  onChange={(e) => setNewFindingStaff(e.target.value)}
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                  Rekomendasi Tindakan Korektif SPI
                </label>
                <textarea
                  rows={3}
                  value={newFindingRec}
                  onChange={(e) => setNewFindingRec(e.target.value)}
                  placeholder="Langkah-langkah yang harus dipenuhi oleh staf operasional..."
                  className="w-full p-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DDD0]">
                <button
                  type="button"
                  onClick={() => setIsAddFindingModalOpen(false)}
                  className="min-h-[44px] px-5 rounded-full border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB] font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-[#D9B877] font-bold hover:bg-[#1A3652] cursor-pointer shadow-md border border-[#D9B877]/40"
                >
                  Simpan Temuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =======================================================================
          MODAL: TAMBAH AKUN STAF ADMIN BARU (SPI EXCLUSIVE)
         ======================================================================= */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12263A]/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-[#E6DDD0] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#12263A] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DDD0]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#8A6A2F]" />
                <h3 className="font-serif text-2xl font-semibold text-[#12263A]">
                  Tambah Akun Staf Admin Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="p-2 rounded-full text-[#4A5666] hover:bg-[#F4F1EB]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                  Nama Lengkap Staf <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Contoh: Rian Anggara"
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                  Email Akun CD'E Pearls <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="nama.staf@cdepearls.com"
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                    Jabatan / Peran
                  </label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as MockStaffAccount['role'])}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                  >
                    <option value="Admin Operasional">Admin Operasional</option>
                    <option value="Kasir Butik">Kasir Butik</option>
                    <option value="Staf Gudang">Staf Gudang</option>
                    <option value="Gemologis">Gemologis</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                    Cakupan Izin Akses
                  </label>
                  <input
                    type="text"
                    value={newStaffPerms}
                    onChange={(e) => setNewStaffPerms(e.target.value)}
                    placeholder="Katalog, Pesanan, Stok"
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                  />
                </div>
              </div>

              <p className="text-[11px] text-[#4A5666] italic bg-[#FBF8F3] p-3 rounded-xl border border-[#E6DDD0]">
                Kata sandi awal akun baru ini akan diset ke <strong>password123</strong>. Penambahan akun akan dicatat permanen dalam Log Aktivitas SPI.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DDD0]">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="min-h-[44px] px-5 rounded-full border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB] font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-[#D9B877] font-bold hover:bg-[#1A3652] cursor-pointer shadow-md border border-[#D9B877]/40"
                >
                  Tambahkan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SpiDashboardLayout>
  );
};
