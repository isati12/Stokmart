import React, { useState, useEffect } from 'react';
import {
  Database,
  Boxes,
  Tag,
  Truck,
  Ruler,
  Warehouse,
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  CheckCircle2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Info,
  ShieldCheck,
  Layers,
  Sparkles,
  ChevronRight,
  FileSpreadsheet,
  AlertCircle,
  X,
  Save,
  Check,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Product } from '../../types/inventory';
import { formatRupiah } from '../../utils/tsbAlgorithm';

// Master Category Type
export interface MasterCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  targetMarginPct: number;
  isActive: boolean;
}

// Master Supplier Type
export interface MasterSupplier {
  id: string;
  code: string;
  name: string;
  picName: string;
  email: string;
  phone: string;
  city: string;
  leadTimeDays: number;
  deliveryRating: number;
  paymentTerms: string; // e.g. "Net 30", "COD", "Net 14"
  status: 'ACTIVE' | 'INACTIVE';
}

// Master Unit of Measurement (UoM)
export interface MasterUoM {
  id: string;
  code: string;
  name: string;
  description: string;
  standardType: 'Count' | 'Length' | 'Volume' | 'Weight';
  isActive: boolean;
}

// Master Warehouse / Storage Location
export interface MasterWarehouse {
  id: string;
  code: string;
  name: string;
  type: 'Central' | 'Hub Regional' | 'Transit';
  address: string;
  capacityUnits: number;
  picName: string;
  storageBins: string[];
  status: 'OPERATIONAL' | 'MAINTENANCE';
}

const DEFAULT_CATEGORIES: MasterCategory[] = [
  {
    id: 'cat-01',
    code: 'MEK',
    name: 'Mekanikal & Transmisi',
    description: 'Bantalan poros (bearing), puli, kopling, belt transmisi tenaga putar industri.',
    targetMarginPct: 35,
    isActive: true,
  },
  {
    id: 'cat-02',
    code: 'SEN',
    name: 'Sensor & Otomasi',
    description: 'Sensor kedekatan (proximity), photoelectric, rotary encoder, dan modul input PLC.',
    targetMarginPct: 40,
    isActive: true,
  },
  {
    id: 'cat-03',
    code: 'PNE',
    name: 'Pneumatik & Hidrolik',
    description: 'Solenoid valve, silinder aktuator udara bertekanan, regulator FRL, dan fitting.',
    targetMarginPct: 30,
    isActive: true,
  },
  {
    id: 'cat-04',
    code: 'KEL',
    name: 'Kelistrikan & Kontrol',
    description: 'Inverter VFD, kontaktor magnetik, relay pengaman beban, dan terminal block.',
    targetMarginPct: 28,
    isActive: true,
  },
  {
    id: 'cat-05',
    code: 'NET',
    name: 'Jaringan & Infrastruktur IT',
    description: 'Switch industrial managed, patch cord fiber optic, transceiver SFP+, router gateway.',
    targetMarginPct: 32,
    isActive: true,
  },
];

const DEFAULT_SUPPLIERS: MasterSupplier[] = [
  {
    id: 'sup-01',
    code: 'VEN-MPJ-01',
    name: 'PT Mitra Presisi Jaya',
    picName: 'Bambang Hartono',
    email: 'sales@mitrapresisi.co.id',
    phone: '+62 21 8972 3411',
    city: 'Cikarang, Jawa Barat',
    leadTimeDays: 4,
    deliveryRating: 4.8,
    paymentTerms: 'Net 30 Hari',
    status: 'ACTIVE',
  },
  {
    id: 'sup-02',
    code: 'VEN-OIM-02',
    name: 'PT Otomasi Industri Unggul',
    picName: 'Dewi Rahmawati',
    email: 'order@otomasiunggul.id',
    phone: '+62 21 5433 9081',
    city: 'Tangerang, Banten',
    leadTimeDays: 5,
    deliveryRating: 4.9,
    paymentTerms: 'Net 14 Hari',
    status: 'ACTIVE',
  },
  {
    id: 'sup-03',
    code: 'VEN-PNE-03',
    name: 'PT Pneumatindo Sentosa',
    picName: 'Hendro Santoso',
    email: 'distribution@pneumatindo.co.id',
    phone: '+62 31 7654 2200',
    city: 'Surabaya, Jawa Timur',
    leadTimeDays: 3,
    deliveryRating: 4.7,
    paymentTerms: 'Net 30 Hari',
    status: 'ACTIVE',
  },
  {
    id: 'sup-04',
    code: 'VEN-SME-04',
    name: 'PT Schneider Mega Elektrik',
    picName: 'Ignatius Kurnia',
    email: 'partner@schneidermega.com',
    phone: '+62 21 2980 1122',
    city: 'Jakarta Timur, DKI Jakarta',
    leadTimeDays: 7,
    deliveryRating: 4.6,
    paymentTerms: 'Net 45 Hari',
    status: 'ACTIVE',
  },
];

const DEFAULT_UOM: MasterUoM[] = [
  {
    id: 'uom-01',
    code: 'PCS',
    name: 'Pieces (Buah/Keping)',
    description: 'Satuan unit tunggal untuk komponen bearing, fitting, dan suku cadang kecil.',
    standardType: 'Count',
    isActive: true,
  },
  {
    id: 'uom-02',
    code: 'UNIT',
    name: 'Unit Mesin / Alat',
    description: 'Satuan perangkat mandiri seperti Sensor, Inverter VFD, PLC, dan Silinder.',
    standardType: 'Count',
    isActive: true,
  },
  {
    id: 'uom-03',
    code: 'BOX',
    name: 'Box / Kotak Kemasan',
    description: 'Kemasan karton berisikan isi kelipatan tertentu dari pabrikan.',
    standardType: 'Count',
    isActive: true,
  },
  {
    id: 'uom-04',
    code: 'ROLL',
    name: 'Roll / Gulungan',
    description: 'Untuk selang pneumatik polyurethane (PU) atau kabel kontrol spiral.',
    standardType: 'Length',
    isActive: true,
  },
  {
    id: 'uom-05',
    code: 'SET',
    name: 'Set / Paket Rakit',
    description: 'Kombinasi paket modul lengkap dengan aksesoris instalasi pendukung.',
    standardType: 'Count',
    isActive: true,
  },
];

const DEFAULT_WAREHOUSES: MasterWarehouse[] = [
  {
    id: 'wh-01',
    code: 'GUD-CKR-01',
    name: 'Gudang Utama Distribusi Cikarang',
    type: 'Central',
    address: 'Kawasan Industri Jababeka Blok C No. 12, Cikarang',
    capacityUnits: 15000,
    picName: 'Rahmat Hidayat (Head of Logistics)',
    storageBins: ['RAK-A1 (Mekanikal)', 'RAK-B2 (Sensor)', 'RAK-C3 (Pneumatik)', 'RAK-D4 (Inverter)'],
    status: 'OPERATIONAL',
  },
  {
    id: 'wh-02',
    code: 'HUB-SBY-02',
    name: 'Hub Regional Logistik Jawa Timur',
    type: 'Hub Regional',
    address: 'Kawasan Industri Rungkut SIER No. 45, Surabaya',
    capacityUnits: 5000,
    picName: 'Ferry Sugiarto (Supervisor Gudang)',
    storageBins: ['ZONE-SURABAYA-A', 'ZONE-SURABAYA-B'],
    status: 'OPERATIONAL',
  },
  {
    id: 'wh-03',
    code: 'TRN-TGR-03',
    name: 'Gudang Transit Karantina Bandara Soetta',
    type: 'Transit',
    address: 'Area Pergudangan Soewarna Soekarno-Hatta, Tangerang',
    capacityUnits: 2500,
    picName: 'Andi Wijaya (Quality Inspector)',
    storageBins: ['INSPECTION-BAY-01', 'HOLDING-AREA-02'],
    status: 'OPERATIONAL',
  },
];

type MasterSubTab = 'products' | 'categories' | 'suppliers' | 'uom' | 'warehouses';

export const MasterDataTab: React.FC = () => {
  const { products, addNewProduct, updateProduct, deleteProduct } = useInventory();
  const [activeSubTab, setActiveSubTab] = useState<MasterSubTab>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalysisGuide, setShowAnalysisGuide] = useState(true);

  // Categories State
  const [categories, setCategories] = useState<MasterCategory[]>(() => {
    const saved = localStorage.getItem('netsolusions_master_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // Suppliers State
  const [suppliers, setSuppliers] = useState<MasterSupplier[]>(() => {
    const saved = localStorage.getItem('netsolusions_master_suppliers');
    return saved ? JSON.parse(saved) : DEFAULT_SUPPLIERS;
  });

  // UoM State
  const [uoms, setUoms] = useState<MasterUoM[]>(() => {
    const saved = localStorage.getItem('netsolusions_master_uoms');
    return saved ? JSON.parse(saved) : DEFAULT_UOM;
  });

  // Warehouse State
  const [warehouses, setWarehouses] = useState<MasterWarehouse[]>(() => {
    const saved = localStorage.getItem('netsolusions_master_warehouses');
    return saved ? JSON.parse(saved) : DEFAULT_WAREHOUSES;
  });

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    code: '',
    name: '',
    description: '',
    targetMarginPct: 30,
  });

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    code: '',
    name: '',
    picName: '',
    email: '',
    phone: '',
    city: '',
    leadTimeDays: 4,
    deliveryRating: 4.8,
    paymentTerms: 'Net 30 Hari',
  });

  const [isUomModalOpen, setIsUomModalOpen] = useState(false);
  const [uomForm, setUomForm] = useState({
    code: '',
    name: '',
    description: '',
    standardType: 'Count' as MasterUoM['standardType'],
  });

  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({
    code: '',
    name: '',
    type: 'Central' as MasterWarehouse['type'],
    address: '',
    capacityUnits: 10000,
    picName: '',
    binsInput: 'RAK-A1, RAK-B1',
  });

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('netsolusions_master_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('netsolusions_master_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('netsolusions_master_uoms', JSON.stringify(uoms));
  }, [uoms]);

  useEffect(() => {
    localStorage.setItem('netsolusions_master_warehouses', JSON.stringify(warehouses));
  }, [warehouses]);

  // Handlers for Add
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.code || !categoryForm.name) return;
    const newCat: MasterCategory = {
      id: `cat-${Date.now()}`,
      code: categoryForm.code.toUpperCase(),
      name: categoryForm.name,
      description: categoryForm.description || 'Kategori komponen industri.',
      targetMarginPct: Number(categoryForm.targetMarginPct) || 30,
      isActive: true,
    };
    setCategories((prev) => [...prev, newCat]);
    setIsCategoryModalOpen(false);
    setCategoryForm({ code: '', name: '', description: '', targetMarginPct: 30 });
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name || !supplierForm.code) return;
    const newSup: MasterSupplier = {
      id: `sup-${Date.now()}`,
      code: supplierForm.code.toUpperCase(),
      name: supplierForm.name,
      picName: supplierForm.picName || 'PIC Pengadaan',
      email: supplierForm.email || 'vendor@example.com',
      phone: supplierForm.phone || '+62 21 0000 0000',
      city: supplierForm.city || 'Jakarta',
      leadTimeDays: Number(supplierForm.leadTimeDays) || 4,
      deliveryRating: Number(supplierForm.deliveryRating) || 4.5,
      paymentTerms: supplierForm.paymentTerms || 'Net 30 Hari',
      status: 'ACTIVE',
    };
    setSuppliers((prev) => [...prev, newSup]);
    setIsSupplierModalOpen(false);
    setSupplierForm({
      code: '',
      name: '',
      picName: '',
      email: '',
      phone: '',
      city: '',
      leadTimeDays: 4,
      deliveryRating: 4.8,
      paymentTerms: 'Net 30 Hari',
    });
  };

  const handleAddUoM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uomForm.code || !uomForm.name) return;
    const newUoM: MasterUoM = {
      id: `uom-${Date.now()}`,
      code: uomForm.code.toUpperCase(),
      name: uomForm.name,
      description: uomForm.description || 'Satuan baku operasional.',
      standardType: uomForm.standardType,
      isActive: true,
    };
    setUoms((prev) => [...prev, newUoM]);
    setIsUomModalOpen(false);
    setUomForm({ code: '', name: '', description: '', standardType: 'Count' });
  };

  const handleAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseForm.code || !warehouseForm.name) return;
    const bins = warehouseForm.binsInput
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);
    const newWh: MasterWarehouse = {
      id: `wh-${Date.now()}`,
      code: warehouseForm.code.toUpperCase(),
      name: warehouseForm.name,
      type: warehouseForm.type,
      address: warehouseForm.address || 'Kawasan Pergudangan Logistik',
      capacityUnits: Number(warehouseForm.capacityUnits) || 10000,
      picName: warehouseForm.picName || 'Koordinator Gudang',
      storageBins: bins.length > 0 ? bins : ['RAK-A1'],
      status: 'OPERATIONAL',
    };
    setWarehouses((prev) => [...prev, newWh]);
    setIsWarehouseModalOpen(false);
    setWarehouseForm({
      code: '',
      name: '',
      type: 'Central',
      address: '',
      capacityUnits: 10000,
      picName: '',
      binsInput: 'RAK-A1, RAK-B1',
    });
  };

  // Export to CSV simulation
  const handleExportData = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeSubTab === 'products') {
      csvContent += 'SKU,Nama Produk,Kategori,Satuan,HPP,Harga Jual,Stok,Lead Time,Supplier\n';
      products.forEach((p) => {
        csvContent += `"${p.sku}","${p.name}","${p.category}","${p.unit}",${p.costPrice},${p.price},${p.currentStock},${p.leadTimeDays},"${p.supplier?.name}"\n`;
      });
    } else if (activeSubTab === 'categories') {
      csvContent += 'Kode,Nama Kategori,Deskripsi,Target Margin %\n';
      categories.forEach((c) => {
        csvContent += `"${c.code}","${c.name}","${c.description}",${c.targetMarginPct}\n`;
      });
    } else if (activeSubTab === 'suppliers') {
      csvContent += 'Kode Vendor,Nama Perusahaan,PIC,Email,Telepon,Kota,Lead Time,TOP\n';
      suppliers.forEach((s) => {
        csvContent += `"${s.code}","${s.name}","${s.picName}","${s.email}","${s.phone}","${s.city}",${s.leadTimeDays},"${s.paymentTerms}"\n`;
      });
    } else if (activeSubTab === 'uom') {
      csvContent += 'Kode UoM,Nama Satuan,Tipe,Deskripsi\n';
      uoms.forEach((u) => {
        csvContent += `"${u.code}","${u.name}","${u.standardType}","${u.description}"\n`;
      });
    } else {
      csvContent += 'Kode Gudang,Nama Gudang,Tipe,Kapasitas,PIC,Alamat\n';
      warehouses.forEach((w) => {
        csvContent += `"${w.code}","${w.name}","${w.type}",${w.capacityUnits},"${w.picName}","${w.address}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `netsolusions_master_${activeSubTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Card with Enterprise Professional Look */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shrink-0">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Data Master Terpadu
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                ERP Standards ISO-9001
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Pondasi data non-transaksional sistem NetSolusions: Pengendalian entitas Produk SKU, Hierarki Kategori, Direktori Vendor Pemasok, Satuan Ukur (UoM), dan Gudang Penyimpanan Fisik.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleExportData}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAnalysisGuide(!showAnalysisGuide)}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/60 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showAnalysisGuide ? 'Sembunyikan Analisis' : 'Analisis Arsitektur Master'}</span>
          </button>
        </div>
      </div>

      {/* 2. Professional Architecture Analysis (Penjelasan & Analisis Mengapa Masuk ke Data Master) */}
      {showAnalysisGuide && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/50 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Analisis &amp; Rekomendasi Arsitektur Data Master (Best-Practice ERP &amp; TSB Engine)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 font-semibold">
              NetSolusions Framework v2.4
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Data Master adalah entitas rujukan tunggal (Single Source of Truth) yang bersifat statis-relasional dan tidak boleh bercampur dengan data transaksi harian (seperti faktur penjualan atau order restok PO). Berikut 5 bagian inti yang wajib masuk ke Data Master agar aplikasi berskala korporat (enterprise):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                <span>1. Master Produk</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Identitas SKU, HPP modal, harga jual, dan lead time acuan rumus peramalan TSB.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Tag className="w-3.5 h-3.5 text-emerald-500" />
                <span>2. Master Kategori</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Taksonomi hierarki, standarisasi prefix SKU, dan target profit margin per kategori.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Truck className="w-3.5 h-3.5 text-amber-500" />
                <span>3. Master Supplier</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Data legalitas vendor, SLA keandalan, TOP pembayaran, dan kontak darurat pengadaan.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Ruler className="w-3.5 h-3.5 text-cyan-500" />
                <span>4. Master Satuan</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Unit of Measurement (UoM) baku (Pcs, Box, Unit, Roll) mencegah kerancuan konversi stok.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Warehouse className="w-3.5 h-3.5 text-purple-500" />
                <span>5. Master Gudang</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Pemetaan lokasi fisik, penomoran Rak/Bin penyimpanan, dan pembagian zona logistik.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Master Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveSubTab('products')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeSubTab === 'products'
              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total SKU</span>
            <Boxes className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {products.length} <span className="text-xs font-normal text-slate-500">Item</span>
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab('categories')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeSubTab === 'categories'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Kategori</span>
            <Tag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {categories.length} <span className="text-xs font-normal text-slate-500">Divisi</span>
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab('suppliers')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeSubTab === 'suppliers'
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Vendor Mitra</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {suppliers.length} <span className="text-xs font-normal text-slate-500">Pemasok</span>
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab('uom')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeSubTab === 'uom'
              ? 'bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Satuan UoM</span>
            <Ruler className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {uoms.length} <span className="text-xs font-normal text-slate-500">Satuan</span>
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab('warehouses')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeSubTab === 'warehouses'
              ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Gudang &amp; Hub</span>
            <Warehouse className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {warehouses.length} <span className="text-xs font-normal text-slate-500">Lokasi</span>
          </div>
        </div>
      </div>

      {/* 4. Sub-Tab Switcher & Action Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'products' as MasterSubTab, label: 'Master Produk & SKU', icon: Boxes },
              { id: 'categories' as MasterSubTab, label: 'Master Kategori', icon: Tag },
              { id: 'suppliers' as MasterSubTab, label: 'Master Supplier / Vendor', icon: Truck },
              { id: 'uom' as MasterSubTab, label: 'Master Satuan (UoM)', icon: Ruler },
              { id: 'warehouses' as MasterSubTab, label: 'Master Gudang & Rak', icon: Warehouse },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSubTab(tab.id);
                    setSearchQuery('');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search & Add Button for the active sub-tab */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari entitas master..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
              />
            </div>

            {activeSubTab === 'categories' && (
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kategori Baru</span>
              </button>
            )}

            {activeSubTab === 'suppliers' && (
              <button
                onClick={() => setIsSupplierModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Supplier Baru</span>
              </button>
            )}

            {activeSubTab === 'uom' && (
              <button
                onClick={() => setIsUomModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Satuan Baru</span>
              </button>
            )}

            {activeSubTab === 'warehouses' && (
              <button
                onClick={() => setIsWarehouseModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gudang Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* 5. Active Sub-Tab Contents */}

        {/* SUB-TAB 1: MASTER PRODUK & SKU */}
        {activeSubTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">SKU &amp; Identitas Produk</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Satuan</th>
                  <th className="p-3 text-right">HPP Modal</th>
                  <th className="p-3 text-right">Harga Jual</th>
                  <th className="p-3 text-right">Margin %</th>
                  <th className="p-3 text-center">Stok Fisik</th>
                  <th className="p-3">Supplier Acuan</th>
                  <th className="p-3 text-center">Lead Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {products
                  .filter(
                    (p) =>
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.category.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((product) => {
                    const margin =
                      product.price > 0
                        ? (((product.price - product.costPrice) / product.price) * 100).toFixed(1)
                        : '0.0';
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                            <div>
                              <div className="font-mono font-bold text-slate-900 dark:text-white">
                                {product.sku}
                              </div>
                              <div className="text-slate-600 dark:text-slate-300 font-medium line-clamp-1 max-w-xs">
                                {product.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                          {product.unit}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatRupiah(product.costPrice)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiah(product.price)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          +{margin}%
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded ${
                              product.currentStock <= product.minimumStock
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                            }`}
                          >
                            {product.currentStock}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                          {product.supplier?.name || '-'}
                        </td>
                        <td className="p-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {product.leadTimeDays} Hari
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-TAB 2: MASTER KATEGORI */}
        {activeSubTab === 'categories' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Kode Prefix</th>
                  <th className="p-3">Nama Kategori</th>
                  <th className="p-3">Deskripsi Komponen</th>
                  <th className="p-3 text-right">Target Margin</th>
                  <th className="p-3 text-center">Jumlah SKU</th>
                  <th className="p-3 text-right">Valuasi Stok</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {categories
                  .filter(
                    (c) =>
                      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.code.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((category) => {
                    const relatedProducts = products.filter((p) => p.category === category.name);
                    const totalValuation = relatedProducts.reduce(
                      (acc, p) => acc + p.currentStock * p.costPrice,
                      0
                    );
                    return (
                      <tr
                        key={category.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors"
                      >
                        <td className="p-3">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                            {category.code}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {category.name}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 max-w-sm">
                          {category.description}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {category.targetMarginPct}%
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                          {relatedProducts.length} SKU
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiah(totalValuation)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                            AKTIF
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              if (confirm(`Hapus kategori ${category.name}?`)) {
                                setCategories((prev) => prev.filter((c) => c.id !== category.id));
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-TAB 3: MASTER SUPPLIER / VENDOR */}
        {activeSubTab === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Kode Vendor</th>
                  <th className="p-3">Nama Perusahaan Supplier</th>
                  <th className="p-3">PIC &amp; Kontak</th>
                  <th className="p-3">Lokasi Gudang</th>
                  <th className="p-3 text-center">Lead Time</th>
                  <th className="p-3 text-center">SLA Delivery</th>
                  <th className="p-3">Termin Bayar (TOP)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {suppliers
                  .filter(
                    (s) =>
                      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.picName.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      <td className="p-3">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                          {supplier.code}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {supplier.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{supplier.email}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {supplier.picName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{supplier.phone}</div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{supplier.city}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {supplier.leadTimeDays} Hari
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          ★ {supplier.deliveryRating} / 5.0
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {supplier.paymentTerms}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                          {supplier.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Hapus supplier ${supplier.name}?`)) {
                              setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Hapus Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-TAB 4: MASTER SATUAN (UoM) */}
        {activeSubTab === 'uom' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Kode Satuan</th>
                  <th className="p-3">Nama Baku UoM</th>
                  <th className="p-3">Klasifikasi Tipe</th>
                  <th className="p-3">Deskripsi Standar Penggunaan</th>
                  <th className="p-3 text-center">Penggunaan SKU</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {uoms
                  .filter(
                    (u) =>
                      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.code.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((uom) => {
                    const count = products.filter(
                      (p) => p.unit.toLowerCase() === uom.code.toLowerCase() || p.unit.toLowerCase() === uom.name.toLowerCase()
                    ).length;
                    return (
                      <tr
                        key={uom.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors"
                      >
                        <td className="p-3">
                          <span className="font-mono font-bold px-2.5 py-0.5 rounded bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                            {uom.code}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{uom.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {uom.standardType}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 max-w-sm">
                          {uom.description}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                          {count} Produk
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                            AKTIF
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              if (confirm(`Hapus satuan ${uom.name}?`)) {
                                setUoms((prev) => prev.filter((u) => u.id !== uom.id));
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Hapus Satuan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-TAB 5: MASTER GUDANG & RAK */}
        {activeSubTab === 'warehouses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Kode Gudang</th>
                  <th className="p-3">Nama Fasilitas &amp; Tipe</th>
                  <th className="p-3">Alamat Fisik</th>
                  <th className="p-3 text-right">Kapasitas Maksimal</th>
                  <th className="p-3">Kepala Gudang (PIC)</th>
                  <th className="p-3">Zona / Rak Penempatan</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {warehouses
                  .filter(
                    (w) =>
                      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      w.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      w.picName.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((warehouse) => (
                    <tr
                      key={warehouse.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      <td className="p-3">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                          {warehouse.code}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {warehouse.name}
                        </div>
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          Tipe: {warehouse.type}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs">
                        {warehouse.address}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {warehouse.capacityUnits.toLocaleString()} Unit
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {warehouse.picName}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {warehouse.storageBins.map((bin, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                              {bin}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                          {warehouse.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Hapus data gudang ${warehouse.name}?`)) {
                              setWarehouses((prev) => prev.filter((w) => w.id !== warehouse.id));
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Hapus Gudang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: TAMBAH KATEGORI */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Tambah Master Kategori
                </h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Kode Prefix Kategori (Misal: MEK, SEN, IT)
                </label>
                <input
                  type="text"
                  required
                  placeholder="KODE"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Perangkat Jaringan & Fiber Optik"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Profit Margin (%)
                </label>
                <input
                  type="number"
                  required
                  min="5"
                  max="100"
                  value={categoryForm.targetMarginPct}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, targetMarginPct: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Deskripsi Komponen
                </label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan cakupan barang dalam kategori ini..."
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-sm"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH SUPPLIER */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Tambah Master Supplier / Vendor
                </h3>
              </div>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Kode Vendor
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VEN-XXX-01"
                    value={supplierForm.code}
                    onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Badan Usaha / PT
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PT Supplier Resmi"
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama PIC (Sales/Account Manager)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Kontak PIC"
                    value={supplierForm.picName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, picName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+62 21 xxxx xxxx"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Resmi Perusahaan
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="order@vendor.co.id"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Kota / Wilayah Gudang
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Cikarang, Jawa Barat"
                    value={supplierForm.city}
                    onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Lead Time Pengiriman (Hari)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="60"
                    value={supplierForm.leadTimeDays}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, leadTimeDays: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Syarat Pembayaran (TOP)
                  </label>
                  <select
                    value={supplierForm.paymentTerms}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Net 14 Hari">Net 14 Hari</option>
                    <option value="Net 30 Hari">Net 30 Hari</option>
                    <option value="Net 45 Hari">Net 45 Hari</option>
                    <option value="COD (Cash on Delivery)">COD (Cash on Delivery)</option>
                    <option value="Advance Payment">Advance Payment (DP 100%)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-semibold text-white bg-amber-600 hover:bg-amber-500 cursor-pointer shadow-sm"
                >
                  Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH SATUAN (UoM) */}
      {isUomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-cyan-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Tambah Master Satuan (UoM)
                </h3>
              </div>
              <button
                onClick={() => setIsUomModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUoM} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Kode Satuan (Misal: PCS, ROLL, CAN, MTR)
                </label>
                <input
                  type="text"
                  required
                  placeholder="KODE UOM"
                  value={uomForm.code}
                  onChange={(e) => setUomForm({ ...uomForm, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Baku Satuan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Meter (Panjang Kabel)"
                  value={uomForm.name}
                  onChange={(e) => setUomForm({ ...uomForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tipe Klasifikasi Standar
                </label>
                <select
                  value={uomForm.standardType}
                  onChange={(e) =>
                    setUomForm({
                      ...uomForm,
                      standardType: e.target.value as MasterUoM['standardType'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Count">Count (Kuantitas Hitung / Jumlah Satuan)</option>
                  <option value="Length">Length (Dimensi Panjang / Jarak)</option>
                  <option value="Volume">Volume (Isi / Cairan Lubricant)</option>
                  <option value="Weight">Weight (Berat / Bobot Kg)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Deskripsi Penggunaan
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan standar penggunaan satuan ini..."
                  value={uomForm.description}
                  onChange={(e) => setUomForm({ ...uomForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUomModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-semibold text-white bg-cyan-600 hover:bg-cyan-500 cursor-pointer shadow-sm"
                >
                  Simpan Satuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TAMBAH GUDANG & RAK */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Tambah Master Gudang / Lokasi
                </h3>
              </div>
              <button
                onClick={() => setIsWarehouseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWarehouse} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Kode Gudang
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="GUD-BDG-01"
                    value={warehouseForm.code}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Fasilitas Gudang
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Gudang Regional Jawa Barat"
                    value={warehouseForm.name}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tipe Gudang
                  </label>
                  <select
                    value={warehouseForm.type}
                    onChange={(e) =>
                      setWarehouseForm({
                        ...warehouseForm,
                        type: e.target.value as MasterWarehouse['type'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Central">Central (Gudang Pusat Distribusi)</option>
                    <option value="Hub Regional">Hub Regional (Fulfillment Cabang)</option>
                    <option value="Transit">Transit / Karantina Inspeksi</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Kapasitas Simpan (Unit)
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={warehouseForm.capacityUnits}
                    onChange={(e) =>
                      setWarehouseForm({
                        ...warehouseForm,
                        capacityUnits: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Kepala Gudang / Penanggung Jawab (PIC)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Supervisor Gudang"
                  value={warehouseForm.picName}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, picName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Alamat Lengkap Lokasi Fisik
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Alamat jalan, nomor gudang, kawasan industri..."
                  value={warehouseForm.address}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Daftar Rak / Bin Penempatan (Pisahkan dengan tanda koma)
                </label>
                <input
                  type="text"
                  placeholder="RAK-A1, RAK-B2, ZONE-C"
                  value={warehouseForm.binsInput}
                  onChange={(e) =>
                    setWarehouseForm({ ...warehouseForm, binsInput: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 cursor-pointer shadow-sm"
                >
                  Simpan Gudang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
