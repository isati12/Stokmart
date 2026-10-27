import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Search,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Package,
  Boxes,
  TrendingUp,
  Truck,
  DollarSign,
  Layers,
  Sparkles,
  Eye,
  FileText,
  Clock,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatRupiah, formatDec } from '../../utils/tsbAlgorithm';

export type ReportType = 'inventory_valuation' | 'tsb_recommendations' | 'purchase_orders' | 'sales_history';

export const ReportsTab: React.FC = () => {
  const {
    products,
    allTSBAnalyses,
    restockOrders,
    customerOrders,
    currentDay,
    currentUser,
    theme,
  } = useInventory();

  // State
  const [activeReport, setActiveReport] = useState<ReportType>('inventory_valuation');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [signatoryName, setSignatoryName] = useState<string>('Dr. Ir. Hendra Prasetyo, M.Sc.');
  const [preparedByName, setPreparedByName] = useState<string>(currentUser?.name || 'Staff Inventaris Gudang');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [docRefNumber] = useState<string>(() => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `DOC/NET-LOG/2026/RPT-${rand}`;
  });
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Current formatted date
  const currentDateFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const currentTimeFormatted = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WIB`;
  }, []);

  // 1. Data for Inventory Valuation Report
  const filteredValuationData = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
        const analysis = allTSBAnalyses.get(p.id);
        const matchesStatus =
          selectedStatus === 'ALL' || (analysis && analysis.stockStatus === selectedStatus);
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .map((p) => {
        const analysis = allTSBAnalyses.get(p.id);
        const totalCostVal = p.currentStock * p.costPrice;
        const totalRetailVal = p.currentStock * p.price;
        const potentialProfit = totalRetailVal - totalCostVal;
        const marginPct = p.costPrice > 0 ? ((p.price - p.costPrice) / p.costPrice) * 100 : 0;
        return {
          ...p,
          analysis,
          totalCostVal,
          totalRetailVal,
          potentialProfit,
          marginPct,
        };
      });
  }, [products, allTSBAnalyses, searchQuery, selectedCategory, selectedStatus]);

  // Valuation Summary Totals
  const valuationSummary = useMemo(() => {
    const totalItems = filteredValuationData.length;
    const totalPhysicalUnits = filteredValuationData.reduce((acc, curr) => acc + curr.currentStock, 0);
    const totalAssetValuation = filteredValuationData.reduce((acc, curr) => acc + curr.totalCostVal, 0);
    const totalRetailPotential = filteredValuationData.reduce((acc, curr) => acc + curr.totalRetailVal, 0);
    const criticalItems = filteredValuationData.filter(
      (p) => p.analysis?.stockStatus === 'CRITICAL' || p.analysis?.stockStatus === 'OUT_OF_STOCK'
    ).length;
    return {
      totalItems,
      totalPhysicalUnits,
      totalAssetValuation,
      totalRetailPotential,
      criticalItems,
    };
  }, [filteredValuationData]);

  // 2. Data for TSB Restock Recommendations Report
  const filteredTsbData = useMemo(() => {
    return products
      .map((p) => {
        const analysis = allTSBAnalyses.get(p.id);
        const suggestedQty = analysis ? analysis.recommendedRestockQty : 0;
        const estimatedBudget = suggestedQty * p.costPrice;
        return {
          ...p,
          analysis,
          suggestedQty,
          estimatedBudget,
        };
      })
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
        const matchesStatus =
          selectedStatus === 'ALL' ||
          (selectedStatus === 'NEED_RESTOCK'
            ? p.suggestedQty > 0
            : p.analysis?.stockStatus === selectedStatus);
        return matchesSearch && matchesCategory && matchesStatus;
      });
  }, [products, allTSBAnalyses, searchQuery, selectedCategory, selectedStatus]);

  // TSB Summary Totals
  const tsbSummary = useMemo(() => {
    const totalAnalyzed = filteredTsbData.length;
    const needRestockCount = filteredTsbData.filter((p) => p.suggestedQty > 0).length;
    const totalUnitsToOrder = filteredTsbData.reduce((acc, curr) => acc + curr.suggestedQty, 0);
    const totalEstimatedBudget = filteredTsbData.reduce((acc, curr) => acc + curr.estimatedBudget, 0);
    return {
      totalAnalyzed,
      needRestockCount,
      totalUnitsToOrder,
      totalEstimatedBudget,
    };
  }, [filteredTsbData]);

  // 3. Data for Purchase Orders Report
  const filteredPoData = useMemo(() => {
    return restockOrders.filter((po) => {
      const matchesSearch =
        po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === 'ALL' || po.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [restockOrders, searchQuery, selectedStatus]);

  // PO Summary Totals
  const poSummary = useMemo(() => {
    const totalOrders = filteredPoData.length;
    const inTransit = filteredPoData.filter((p) => p.status === 'IN_TRANSIT').length;
    const received = filteredPoData.filter((p) => p.status === 'RECEIVED').length;
    const totalPoValue = filteredPoData.reduce((acc, curr) => acc + curr.totalCost, 0);
    return {
      totalOrders,
      inTransit,
      received,
      totalPoValue,
    };
  }, [filteredPoData]);

  // 4. Data for Sales History Report
  const filteredSalesData = useMemo(() => {
    return customerOrders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = selectedStatus === 'ALL' || order.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [customerOrders, searchQuery, selectedStatus]);

  // Sales Summary Totals
  const salesSummary = useMemo(() => {
    const totalTx = filteredSalesData.length;
    const totalUnitsSold = filteredSalesData.reduce(
      (acc, curr) => acc + curr.items.reduce((sum, item) => sum + item.quantity, 0),
      0
    );
    const totalGrossRevenue = filteredSalesData.reduce((acc, curr) => acc + curr.totalAmount, 0);
    return {
      totalTx,
      totalUnitsSold,
      totalGrossRevenue,
    };
  }, [filteredSalesData]);

  // ==========================================
  // EXCEL EXPORT FUNCTION (Styled XML/HTML .xls)
  // ==========================================
  const handleExportExcel = () => {
    let reportTitle = '';
    let tableHeadersHtml = '';
    let tableRowsHtml = '';
    let summaryHtml = '';

    const timestamp = new Date().toISOString().slice(0, 10);
    let fileName = `NetSolusions_Laporan_${timestamp}.xls`;

    if (activeReport === 'inventory_valuation') {
      reportTitle = 'LAPORAN AUDIT POSISI STOK & VALUASI INVENTARIS FISIK';
      fileName = `NetSolusions_Valuasi_Stok_${timestamp}.xls`;
      summaryHtml = `
        <tr><td colspan="9" style="background:#f8fafc; font-weight:bold; font-size:11pt; padding:6px;">RINGKASAN EKSEKUTIF VALUASI:</td></tr>
        <tr><td colspan="4" style="background:#ffffff;">Total SKU Terdaftar: <b>${valuationSummary.totalItems}</b></td><td colspan="5" style="background:#ffffff;">Total Unit Fisik: <b>${valuationSummary.totalPhysicalUnits} Unit</b></td></tr>
        <tr><td colspan="4" style="background:#ffffff;">Total Nilai Valuasi Modal (Asset): <b>${formatRupiah(valuationSummary.totalAssetValuation)}</b></td><td colspan="5" style="background:#ffffff;">Total Potensi Nilai Jual: <b>${formatRupiah(valuationSummary.totalRetailPotential)}</b></td></tr>
        <tr><td colspan="9" style="height:12px;"></td></tr>
      `;
      tableHeadersHtml = `
        <tr style="background:#1e293b; color:#ffffff; font-weight:bold; text-align:center;">
          <th style="border:1px solid #94a3b8; padding:8px;">No</th>
          <th style="border:1px solid #94a3b8; padding:8px;">Kode SKU</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:left;">Nama Barang & Spesifikasi</th>
          <th style="border:1px solid #94a3b8; padding:8px;">Kategori</th>
          <th style="border:1px solid #94a3b8; padding:8px;">Satuan</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Stok Fisik</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Harga Modal (Rp)</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Total Nilai Aset (Rp)</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Harga Jual (Rp)</th>
          <th style="border:1px solid #94a3b8; padding:8px;">Status Stok</th>
        </tr>
      `;
      tableRowsHtml = filteredValuationData
        .map(
          (p, idx) => `
        <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align:center;">
          <td style="border:1px solid #cbd5e1; padding:6px;">${idx + 1}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">${p.sku}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:left;">${p.name}</td>
          <td style="border:1px solid #cbd5e1; padding:6px;">${p.category}</td>
          <td style="border:1px solid #cbd5e1; padding:6px;">${p.unit}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right; font-weight:bold;">${p.currentStock}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right;">${formatRupiah(p.costPrice)}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right; font-weight:bold; color:#0f766e;">${formatRupiah(p.totalCostVal)}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right;">${formatRupiah(p.price)}</td>
          <td style="border:1px solid #cbd5e1; padding:6px;">${p.analysis?.stockStatus || 'OPTIMAL'}</td>
        </tr>
      `
        )
        .join('');
      tableRowsHtml += `
        <tr style="background:#e2e8f0; font-weight:bold; border-top:2px solid #0f172a;">
          <td colspan="5" style="border:1px solid #94a3b8; padding:8px; text-align:right;">TOTAL KESELURUHAN:</td>
          <td style="border:1px solid #94a3b8; padding:8px; text-align:right;">${valuationSummary.totalPhysicalUnits}</td>
          <td style="border:1px solid #94a3b8; padding:8px;">-</td>
          <td style="border:1px solid #94a3b8; padding:8px; text-align:right; color:#0f766e;">${formatRupiah(valuationSummary.totalAssetValuation)}</td>
          <td style="border:1px solid #94a3b8; padding:8px; text-align:right;">${formatRupiah(valuationSummary.totalRetailPotential)}</td>
          <td style="border:1px solid #94a3b8; padding:8px;">-</td>
        </tr>
      `;
    } else if (activeReport === 'tsb_recommendations') {
      reportTitle = 'LAPORAN REKOMENDASI RESTOK & PERAMALAN ALGORITMA TSB (ROP & SAFETY STOCK)';
      fileName = `NetSolusions_Rekomendasi_TSB_${timestamp}.xls`;
      summaryHtml = `
        <tr><td colspan="10" style="background:#f8fafc; font-weight:bold; font-size:11pt; padding:6px;">RINGKASAN REKOMENDASI PENGADAAN TSB:</td></tr>
        <tr><td colspan="5" style="background:#ffffff;">Total SKU Dianalisis: <b>${tsbSummary.totalAnalyzed}</b></td><td colspan="5" style="background:#ffffff;">SKU Perlu Restok Segera: <b>${tsbSummary.needRestockCount} Item</b></td></tr>
        <tr><td colspan="5" style="background:#ffffff;">Total Unit Saran Order: <b>${tsbSummary.totalUnitsToOrder} Unit</b></td><td colspan="5" style="background:#ffffff;">Estimasi Anggaran Dibutuhkan: <b>${formatRupiah(tsbSummary.totalEstimatedBudget)}</b></td></tr>
        <tr><td colspan="10" style="height:12px;"></td></tr>
      `;
      tableHeadersHtml = `
        <tr style="background:#1e293b; color:#ffffff; font-weight:bold; text-align:center;">
          <th style="border:1px solid #94a3b8; padding:8px;">No</th>
          <th style="border:1px solid #94a3b8; padding:8px;">SKU</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:left;">Nama Barang</th>
          <th style="border:1px solid #94a3b8; padding:8px;">Lead Time (Hari)</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Forecast / Hari (ŷ_t)</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Safety Stock (SS)</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Reorder Point (ROP)</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Stok Saat Ini</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Saran Order (Unit)</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Estimasi Biaya PO (Rp)</th>
          <th style="border:1px solid #94a3b8; padding:8px;">Status Stok</th>
        </tr>
      `;
      tableRowsHtml = filteredTsbData
        .map(
          (p, idx) => `
        <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align:center;">
          <td style="border:1px solid #cbd5e1; padding:6px;">${idx + 1}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">${p.sku}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:left;">${p.name}</td>
          <td style="border:1px solid #cbd5e1; padding:6px;">${p.leadTimeDays} Hari</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right;">${formatDec(p.analysis?.forecastPerDay || 0, 3)}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right;">${formatDec(p.analysis?.safetyStock || 0, 1)}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right; font-weight:bold;">${formatDec(p.analysis?.reorderPoint || 0, 1)}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right; font-weight:bold;">${p.currentStock}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right; font-weight:bold; color:${p.suggestedQty > 0 ? '#b91c1c' : '#047857'};">${p.suggestedQty}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right; font-weight:bold;">${formatRupiah(p.estimatedBudget)}</td>
          <td style="border:1px solid #cbd5e1; padding:6px;">${p.analysis?.stockStatus || 'NORMAL'}</td>
        </tr>
      `
        )
        .join('');
      tableRowsHtml += `
        <tr style="background:#e2e8f0; font-weight:bold; border-top:2px solid #0f172a;">
          <td colspan="8" style="border:1px solid #94a3b8; padding:8px; text-align:right;">TOTAL KEBUTUHAN PENGADAAN:</td>
          <td style="border:1px solid #94a3b8; padding:8px; text-align:right; color:#b91c1c;">${tsbSummary.totalUnitsToOrder} Unit</td>
          <td style="border:1px solid #94a3b8; padding:8px; text-align:right; color:#b91c1c;">${formatRupiah(tsbSummary.totalEstimatedBudget)}</td>
          <td style="border:1px solid #94a3b8; padding:8px;">-</td>
        </tr>
      `;
    } else if (activeReport === 'purchase_orders') {
      reportTitle = 'LAPORAN RIWAYAT PENGADAAN BARANG & PURCHASE ORDER (PO)';
      fileName = `NetSolusions_Purchase_Orders_${timestamp}.xls`;
      summaryHtml = `
        <tr><td colspan="9" style="background:#f8fafc; font-weight:bold; font-size:11pt; padding:6px;">RINGKASAN PURCHASE ORDER:</td></tr>
        <tr><td colspan="4" style="background:#ffffff;">Total PO Terbit: <b>${poSummary.totalOrders} Dokumen</b></td><td colspan="5" style="background:#ffffff;">Total Nilai PO: <b>${formatRupiah(poSummary.totalPoValue)}</b></td></tr>
        <tr><td colspan="4" style="background:#ffffff;">PO Dalam Perjalanan: <b>${poSummary.inTransit}</b></td><td colspan="5" style="background:#ffffff;">PO Telah Diterima Gudang: <b>${poSummary.received}</b></td></tr>
        <tr><td colspan="9" style="height:12px;"></td></tr>
      `;
      tableHeadersHtml = `
        <tr style="background:#1e293b; color:#ffffff; font-weight:bold; text-align:center;">
          <th style="border:1px solid #94a3b8; padding:8px;">No</th>
          <th style="border:1px solid #94a3b8; padding:8px;">Nomor PO</th>
          <th style="border:1px solid #94a3b8; padding:8px;">Tanggal PO</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:left;">Nama Barang & SKU</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:left;">Nama Supplier</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Kuantitas</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Harga Satuan (Rp)</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Total Biaya (Rp)</th>
          <th style="border:1px solid #94a3b8; padding:8px;">Estimasi Tiba</th>
          <th style="border:1px solid #94a3b8; padding:8px;">Status PO</th>
        </tr>
      `;
      tableRowsHtml = filteredPoData
        .map(
          (po, idx) => `
        <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align:center;">
          <td style="border:1px solid #cbd5e1; padding:6px;">${idx + 1}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">${po.poNumber}</td>
          <td style="border:1px solid #cbd5e1; padding:6px;">${po.createdAt}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:left;">${po.productName} <br><small style="color:#64748b;">${po.sku}</small></td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:left;">${po.supplierName}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right; font-weight:bold;">${po.quantity}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right;">${formatRupiah(po.unitCost)}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right; font-weight:bold;">${formatRupiah(po.totalCost)}</td>
          <td style="border:1px solid #cbd5e1; padding:6px;">${po.expectedArrivalDate}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">${po.status}</td>
        </tr>
      `
        )
        .join('');
      tableRowsHtml += `
        <tr style="background:#e2e8f0; font-weight:bold; border-top:2px solid #0f172a;">
          <td colspan="7" style="border:1px solid #94a3b8; padding:8px; text-align:right;">TOTAL KESELURUHAN PO:</td>
          <td style="border:1px solid #94a3b8; padding:8px; text-align:right; color:#0f766e;">${formatRupiah(poSummary.totalPoValue)}</td>
          <td colspan="2" style="border:1px solid #94a3b8; padding:8px;">-</td>
        </tr>
      `;
    } else {
      reportTitle = 'LAPORAN TRANSAKSI PENJUALAN & PERGERAKAN DEMAND';
      fileName = `NetSolusions_Sales_Demand_${timestamp}.xls`;
      summaryHtml = `
        <tr><td colspan="8" style="background:#f8fafc; font-weight:bold; font-size:11pt; padding:6px;">RINGKASAN PENJUALAN:</td></tr>
        <tr><td colspan="4" style="background:#ffffff;">Total Transaksi: <b>${salesSummary.totalTx}</b></td><td colspan="4" style="background:#ffffff;">Total Unit Terjual: <b>${salesSummary.totalUnitsSold} Unit</b></td></tr>
        <tr><td colspan="8" style="background:#ffffff;">Total Nilai Omset Penjualan: <b>${formatRupiah(salesSummary.totalGrossRevenue)}</b></td></tr>
        <tr><td colspan="8" style="height:12px;"></td></tr>
      `;
      tableHeadersHtml = `
        <tr style="background:#1e293b; color:#ffffff; font-weight:bold; text-align:center;">
          <th style="border:1px solid #94a3b8; padding:8px;">No</th>
          <th style="border:1px solid #94a3b8; padding:8px;">No. Invoice</th>
          <th style="border:1px solid #94a3b8; padding:8px;">Tanggal Transaksi</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:left;">Pelanggan / Klien</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:left;">Item Barang Dibeli</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Total Item</th>
          <th style="border:1px solid #94a3b8; padding:8px; text-align:right;">Nilai Transaksi (Rp)</th>
          <th style="border:1px solid #94a3b8; padding:8px;">Metode Pembayaran</th>
          <th style="border:1px solid #94a3b8; padding:8px;">Status</th>
        </tr>
      `;
      tableRowsHtml = filteredSalesData
        .map(
          (order, idx) => `
        <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align:center;">
          <td style="border:1px solid #cbd5e1; padding:6px;">${idx + 1}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">${order.orderNumber}</td>
          <td style="border:1px solid #cbd5e1; padding:6px;">${order.createdAt}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:left;">${order.customerName}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:left;">
            ${order.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', ')}
          </td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right;">${order.items.reduce((s, i) => s + i.quantity, 0)}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; text-align:right; font-weight:bold;">${formatRupiah(order.totalAmount)}</td>
          <td style="border:1px solid #cbd5e1; padding:6px;">${order.paymentMethod.toUpperCase()}</td>
          <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">${order.status}</td>
        </tr>
      `
        )
        .join('');
      tableRowsHtml += `
        <tr style="background:#e2e8f0; font-weight:bold; border-top:2px solid #0f172a;">
          <td colspan="6" style="border:1px solid #94a3b8; padding:8px; text-align:right;">TOTAL PENDAPATAN:</td>
          <td style="border:1px solid #94a3b8; padding:8px; text-align:right; color:#0f766e;">${formatRupiah(salesSummary.totalGrossRevenue)}</td>
          <td colspan="2" style="border:1px solid #94a3b8; padding:8px;">-</td>
        </tr>
      `;
    }

    const fullHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Laporan NetSolusions</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { font-size: 10pt; vertical-align: middle; }
        </style>
      </head>
      <body>
        <table>
          <!-- KOP SURAT EXCEL -->
          <tr>
            <td colspan="10" style="background:#0f172a; color:#ffffff; font-size:16pt; font-weight:bold; padding:12px; text-align:center;">
              PT NETSOLUSIONS SOLUSI TEKNOLOGI
            </td>
          </tr>
          <tr>
            <td colspan="10" style="background:#1e293b; color:#94a3b8; font-size:10pt; text-align:center; padding:4px;">
              Enterprise Inventory & Supply Chain Intelligence Suite | ISO 9001:2015 Certified
            </td>
          </tr>
          <tr>
            <td colspan="10" style="background:#1e293b; color:#cbd5e1; font-size:9pt; text-align:center; padding-bottom:8px;">
              Gedung Cyber Tower Lt. 12, Jl. TB Simatupang No. 88, Jakarta Selatan 12430 | Telp: (021) 789-2045 | Email: logistics@netsolusions.co.id
            </td>
          </tr>
          <tr><td colspan="10" style="border-bottom:3px solid #0f172a; height:6px;"></td></tr>
          <tr><td colspan="10" style="height:12px;"></td></tr>

          <!-- DOKUMEN METADATA -->
          <tr>
            <td colspan="10" style="font-size:13pt; font-weight:bold; color:#0f172a; text-align:center; padding:6px;">
              ${reportTitle}
            </td>
          </tr>
          <tr>
            <td colspan="5" style="font-size:9pt; color:#475569;">No. Dokumen: <b>${docRefNumber}</b></td>
            <td colspan="5" style="font-size:9pt; color:#475569; text-align:right;">Tanggal Terbit: <b>${currentDateFormatted} - ${currentTimeFormatted}</b></td>
          </tr>
          <tr>
            <td colspan="5" style="font-size:9pt; color:#475569;">Dicetak Oleh: <b>${preparedByName}</b></td>
            <td colspan="5" style="font-size:9pt; color:#475569; text-align:right;">Siklus Simulasi: <b>Hari ke-${currentDay}</b></td>
          </tr>
          <tr><td colspan="10" style="height:14px;"></td></tr>

          <!-- EXECUTIVE SUMMARY -->
          ${summaryHtml}

          <!-- DATA TABLE -->
          ${tableHeadersHtml}
          ${tableRowsHtml}

          <!-- LEMBAR PENGESAHAN -->
          <tr><td colspan="10" style="height:24px;"></td></tr>
          <tr>
            <td colspan="3" style="text-align:center; font-weight:bold; font-size:10pt;">Dibuat Oleh:</td>
            <td colspan="4" style="text-align:center; font-weight:bold; font-size:10pt;">Diperiksa Oleh:</td>
            <td colspan="3" style="text-align:center; font-weight:bold; font-size:10pt;">Disetujui & Disahkan:</td>
          </tr>
          <tr>
            <td colspan="3" style="height:50px;"></td>
            <td colspan="4" style="height:50px; text-align:center; color:#059669; font-size:8pt; vertical-align:middle;">[TERVERIFIKASI SISTEM NETSOLUSIONS]</td>
            <td colspan="3" style="height:50px;"></td>
          </tr>
          <tr>
            <td colspan="3" style="text-align:center; font-weight:bold; text-decoration:underline;">${preparedByName}</td>
            <td colspan="4" style="text-align:center; font-weight:bold; text-decoration:underline;">Bambang Wicaksono, S.T.</td>
            <td colspan="3" style="text-align:center; font-weight:bold; text-decoration:underline;">${signatoryName}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align:center; font-size:8pt; color:#64748b;">Warehouse Inventory Officer</td>
            <td colspan="4" style="text-align:center; font-size:8pt; color:#64748b;">Warehouse Operations Lead</td>
            <td colspan="3" style="text-align:center; font-size:8pt; color:#64748b;">Direktur Rantai Pasok & Logistik</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', fullHtml], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // DIRECT PDF DOWNLOAD GENERATOR (jsPDF)
  // ==========================================
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
      const margin = 14;

      // 1. KOP SURAT RESMI (OFFICIAL LETTERHEAD)
      // Emblem Box (Teal-Emerald corporate badge)
      doc.setFillColor(15, 118, 110); // emerald-700
      doc.roundedRect(margin, 10, 15, 15, 2, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('NS', margin + 7.5, 19.5, { align: 'center' });

      // Company Name
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('PT NETSOLUSIONS SOLUSI TEKNOLOGI', margin + 19, 15);

      // Subtitle & Certification
      doc.setTextColor(13, 148, 136); // teal-600
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(
        'ENTERPRISE INVENTORY & SUPPLY CHAIN INTELLIGENCE SUITE | ISO 9001:2015 CERTIFIED',
        margin + 19,
        19.5
      );

      // Address & Contacts
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(
        'Gedung Cyber Tower Lt. 12, Jl. TB Simatupang No. 88, Jakarta Selatan 12430 | Telp: (021) 789-2045 | Email: logistics@netsolusions.co.id',
        margin + 19,
        23.5
      );

      // Right Side Header Metadata
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(docRefNumber, pageWidth - margin, 14, { align: 'right' });

      doc.setFillColor(254, 243, 199); // amber-100
      doc.setDrawColor(245, 158, 11); // amber-500
      doc.roundedRect(pageWidth - margin - 35, 16.5, 35, 5, 1, 1, 'FD');
      doc.setTextColor(180, 83, 9); // amber-700
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text('AUDIT ARSIP RESMI', pageWidth - margin - 17.5, 20, { align: 'center' });

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text(`Siklus: Hari ke-${currentDay}`, pageWidth - margin, 24.5, { align: 'right' });

      // Double divider line
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.7);
      doc.line(margin, 27, pageWidth - margin, 27);
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.2);
      doc.line(margin, 28, pageWidth - margin, 28);

      // 2. DOCUMENT TITLE & META
      let title = '';
      let fileName = '';
      let summaryCards: Array<{ label: string; val: string; isHighlight?: boolean }> = [];
      let head: string[][] = [];
      let body: (string | number)[][] = [];
      let foot: string[][] = [];
      let columnStyles: Record<number, { halign?: 'left' | 'center' | 'right'; cellWidth?: number }> = {};

      if (activeReport === 'inventory_valuation') {
        title = 'LAPORAN AUDIT POSISI STOK & VALUASI FISIK INVENTARIS';
        fileName = `NetSolusions_Valuasi_Stok_${timestamp}.pdf`;
        summaryCards = [
          { label: 'TOTAL SKU TERDAFTAR', val: `${valuationSummary.totalItems} Item` },
          { label: 'TOTAL UNIT FISIK', val: `${valuationSummary.totalPhysicalUnits.toLocaleString('id-ID')} Unit` },
          { label: 'VALUASI MODAL ASET', val: formatRupiah(valuationSummary.totalAssetValuation), isHighlight: true },
          { label: 'POTENSI NILAI JUAL', val: formatRupiah(valuationSummary.totalRetailPotential) },
        ];
        head = [
          [
            'No',
            'Kode SKU',
            'Nama Barang & Spesifikasi',
            'Kategori',
            'Satuan',
            'Stok Fisik',
            'Harga Modal',
            'Total Nilai Aset',
            'Harga Jual',
            'Status Stok',
          ],
        ];
        body = filteredValuationData.map((p, idx) => [
          idx + 1,
          p.sku,
          p.name,
          p.category,
          p.unit,
          p.currentStock.toLocaleString('id-ID'),
          formatRupiah(p.costPrice),
          formatRupiah(p.totalCostVal),
          formatRupiah(p.price),
          p.analysis?.stockStatus || 'OPTIMAL',
        ]);
        foot = [
          [
            '',
            '',
            'TOTAL KESELURUHAN:',
            '',
            '',
            `${valuationSummary.totalPhysicalUnits.toLocaleString('id-ID')}`,
            '-',
            formatRupiah(valuationSummary.totalAssetValuation),
            formatRupiah(valuationSummary.totalRetailPotential),
            '-',
          ],
        ];
        columnStyles = {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'center', cellWidth: 26 },
          2: { halign: 'left', cellWidth: 55 },
          3: { halign: 'center', cellWidth: 28 },
          4: { halign: 'center', cellWidth: 16 },
          5: { halign: 'right', cellWidth: 20 },
          6: { halign: 'right', cellWidth: 32 },
          7: { halign: 'right', cellWidth: 36 },
          8: { halign: 'right', cellWidth: 32 },
          9: { halign: 'center', cellWidth: 22 },
        };
      } else if (activeReport === 'tsb_recommendations') {
        title = 'LAPORAN REKOMENDASI RESTOK & PERAMALAN ALGORITMA TSB (ROP & SAFETY STOCK)';
        fileName = `NetSolusions_Rekomendasi_TSB_${timestamp}.pdf`;
        summaryCards = [
          { label: 'TOTAL SKU DIANALISIS', val: `${tsbSummary.totalAnalyzed} Item` },
          { label: 'SKU BUTUH RESTOK', val: `${tsbSummary.needRestockCount} Item`, isHighlight: true },
          { label: 'TOTAL SARAN ORDER', val: `${tsbSummary.totalUnitsToOrder.toLocaleString('id-ID')} Unit` },
          { label: 'ESTIMASI ANGGARAN PO', val: formatRupiah(tsbSummary.totalEstimatedBudget), isHighlight: true },
        ];
        head = [
          [
            'No',
            'SKU',
            'Nama Barang',
            'Lead Time',
            'Demand/Hari',
            'Safety Stock',
            'Reorder Pt',
            'Stok Fisik',
            'Saran Order',
            'Estimasi PO',
            'Status Stok',
          ],
        ];
        body = filteredTsbData.map((p, idx) => [
          idx + 1,
          p.sku,
          p.name,
          `${p.leadTimeDays} Hari`,
          formatDec(p.analysis?.forecastPerDay || 0, 3),
          formatDec(p.analysis?.safetyStock || 0, 1),
          formatDec(p.analysis?.reorderPoint || 0, 1),
          p.currentStock.toLocaleString('id-ID'),
          p.suggestedQty > 0 ? `${p.suggestedQty} Unit` : '0',
          formatRupiah(p.estimatedBudget),
          p.analysis?.stockStatus || 'NORMAL',
        ]);
        foot = [
          [
            '',
            '',
            'TOTAL KEBUTUHAN PENGADAAN:',
            '',
            '',
            '',
            '',
            '',
            `${tsbSummary.totalUnitsToOrder.toLocaleString('id-ID')} Unit`,
            formatRupiah(tsbSummary.totalEstimatedBudget),
            '-',
          ],
        ];
        columnStyles = {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'center', cellWidth: 25 },
          2: { halign: 'left', cellWidth: 50 },
          3: { halign: 'center', cellWidth: 20 },
          4: { halign: 'right', cellWidth: 23 },
          5: { halign: 'right', cellWidth: 22 },
          6: { halign: 'right', cellWidth: 22 },
          7: { halign: 'right', cellWidth: 20 },
          8: { halign: 'right', cellWidth: 25 },
          9: { halign: 'right', cellWidth: 34 },
          10: { halign: 'center', cellWidth: 24 },
        };
      } else if (activeReport === 'purchase_orders') {
        title = 'LAPORAN REALISASI PURCHASE ORDER (PO) & REKAP SUPPLIER';
        fileName = `NetSolusions_Purchase_Orders_${timestamp}.pdf`;
        summaryCards = [
          { label: 'TOTAL PO TERBIT', val: `${poSummary.totalOrders} Dokumen` },
          { label: 'TOTAL NILAI BELANJA', val: formatRupiah(poSummary.totalPoValue), isHighlight: true },
          { label: 'PO DALAM PERJALANAN', val: `${poSummary.inTransit} Order` },
          { label: 'PO SELESAI / DITERIMA', val: `${poSummary.received} Order` },
        ];
        head = [
          [
            'No',
            'Nomor PO',
            'Tanggal PO',
            'Nama Barang & SKU',
            'Nama Supplier',
            'Qty',
            'Harga Satuan',
            'Total Nilai PO',
            'Estimasi Tiba',
            'Status PO',
          ],
        ];
        body = filteredPoData.map((po, idx) => [
          idx + 1,
          po.poNumber,
          po.createdAt,
          `${po.productName} (${po.sku})`,
          po.supplierName,
          po.quantity.toLocaleString('id-ID'),
          formatRupiah(po.unitCost),
          formatRupiah(po.totalCost),
          po.expectedArrivalDate,
          po.status,
        ]);
        foot = [
          [
            '',
            '',
            'TOTAL KESELURUHAN PO:',
            '',
            '',
            '',
            '',
            formatRupiah(poSummary.totalPoValue),
            '',
            '-',
          ],
        ];
        columnStyles = {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'center', cellWidth: 32 },
          2: { halign: 'center', cellWidth: 22 },
          3: { halign: 'left', cellWidth: 55 },
          4: { halign: 'left', cellWidth: 35 },
          5: { halign: 'right', cellWidth: 18 },
          6: { halign: 'right', cellWidth: 30 },
          7: { halign: 'right', cellWidth: 34 },
          8: { halign: 'center', cellWidth: 22 },
          9: { halign: 'center', cellWidth: 20 },
        };
      } else {
        title = 'LAPORAN TRANSAKSI PENJUALAN & PERGERAKAN DEMAND OUTBOUND';
        fileName = `NetSolusions_Sales_Demand_${timestamp}.pdf`;
        summaryCards = [
          { label: 'TOTAL TRANSAKSI', val: `${salesSummary.totalTx} Transaksi` },
          { label: 'TOTAL UNIT TERJUAL', val: `${salesSummary.totalUnitsSold.toLocaleString('id-ID')} Unit` },
          { label: 'TOTAL NILAI OMSET', val: formatRupiah(salesSummary.totalGrossRevenue), isHighlight: true },
          { label: 'STATUS PEMBAYARAN', val: '100% Terverifikasi' },
        ];
        head = [
          [
            'No',
            'No. Invoice',
            'Tanggal Transaksi',
            'Pelanggan / Klien',
            'Item Barang',
            'Total Qty',
            'Nilai Transaksi',
            'Metode Bayar',
            'Status',
          ],
        ];
        body = filteredSalesData.map((s, idx) => [
          idx + 1,
          s.orderNumber,
          s.createdAt,
          s.customerName,
          s.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', '),
          s.items.reduce((acc, curr) => acc + curr.quantity, 0).toLocaleString('id-ID'),
          formatRupiah(s.totalAmount),
          s.paymentMethod.toUpperCase(),
          s.status,
        ]);
        foot = [
          [
            '',
            '',
            'TOTAL PENDAPATAN:',
            '',
            '',
            `${salesSummary.totalUnitsSold.toLocaleString('id-ID')} Unit`,
            formatRupiah(salesSummary.totalGrossRevenue),
            '',
            '-',
          ],
        ];
        columnStyles = {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'center', cellWidth: 32 },
          2: { halign: 'center', cellWidth: 24 },
          3: { halign: 'left', cellWidth: 42 },
          4: { halign: 'left', cellWidth: 65 },
          5: { halign: 'right', cellWidth: 20 },
          6: { halign: 'right', cellWidth: 36 },
          7: { halign: 'center', cellWidth: 22 },
          8: { halign: 'center', cellWidth: 20 },
        };
      }

      // Render Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(title, pageWidth / 2, 34, { align: 'center' });

      // Render Metadata subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Dokumen: ${docRefNumber}   •   Terbit: ${currentDateFormatted}, ${currentTimeFormatted}   •   Penyusun: ${preparedByName}   •   Filter: ${selectedStatus === 'ALL' ? 'Semua' : selectedStatus}`,
        pageWidth / 2,
        38.5,
        { align: 'center' }
      );

      // Render 4 Summary Cards
      const cardWidth = (pageWidth - margin * 2 - 9) / 4;
      const cardY = 41;
      const cardHeight = 11;
      summaryCards.forEach((c, idx) => {
        const cardX = margin + idx * (cardWidth + 3);
        if (c.isHighlight) {
          doc.setFillColor(240, 253, 250); // teal-50
          doc.setDrawColor(45, 212, 191); // teal-400
        } else {
          doc.setFillColor(248, 250, 252); // slate-50
          doc.setDrawColor(226, 232, 240); // slate-200
        }
        doc.setLineWidth(0.3);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text(c.label, cardX + 3, cardY + 4);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        if (c.isHighlight) {
          doc.setTextColor(15, 118, 110);
        } else {
          doc.setTextColor(15, 23, 42);
        }
        doc.text(c.val, cardX + 3, cardY + 8.5);
      });

      // 3. DATA TABLE VIA AUTOTABLE
      autoTable(doc, {
        startY: 55,
        margin: { left: margin, right: margin, top: margin, bottom: 22 },
        head: head,
        body: body,
        foot: foot,
        theme: 'striped',
        styles: {
          font: 'helvetica',
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          lineColor: [203, 213, 225],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [15, 23, 42], // slate-900
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center',
          minCellHeight: 6,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        footStyles: {
          fillColor: [226, 232, 240], // slate-200
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        columnStyles: columnStyles,
        didDrawPage: (data) => {
          // Footer for every page
          const str = `Halaman ${data.pageNumber} | Dokumen Resmi NetSolusions ERP`;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184);
          doc.text(
            'PT NetSolusions Solusi Teknologi • Kerahasiaan Dokumen Internal Dilindungi ISO 9001:2015',
            margin,
            pageHeight - 8
          );
          doc.text(str, pageWidth - margin, pageHeight - 8, { align: 'right' });
        },
      });

      // 4. SIGNATURE BLOCK (LEMBAR PENGESAHAN)
      // Check available space on last page
      const lastTable = (doc as any).lastAutoTable;
      let finalY = lastTable ? lastTable.finalY : 120;
      if (finalY > pageHeight - 48) {
        doc.addPage();
        finalY = 25;
      } else {
        finalY += 8;
      }

      const sigWidth = (pageWidth - margin * 2) / 3;
      const col1X = margin + sigWidth / 2;
      const col2X = margin + sigWidth + sigWidth / 2;
      const col3X = margin + sigWidth * 2 + sigWidth / 2;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('Dibuat Oleh:', col1X, finalY, { align: 'center' });
      doc.text('Diperiksa & Diaudit:', col2X, finalY, { align: 'center' });
      doc.text('Disetujui & Disahkan:', col3X, finalY, { align: 'center' });

      // Verification Stamp in Column 2
      doc.setFillColor(236, 253, 245); // emerald-50
      doc.setDrawColor(16, 185, 129); // emerald-500
      doc.roundedRect(col2X - 25, finalY + 4, 50, 8, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(5, 150, 105);
      doc.text('TERVERIFIKASI SISTEM DIGITAL', col2X, finalY + 9, { align: 'center' });

      // Signatory Names
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(preparedByName, col1X, finalY + 22, { align: 'center' });
      doc.line(col1X - 25, finalY + 23, col1X + 25, finalY + 23);

      doc.text('Bambang Wicaksono, S.T.', col2X, finalY + 22, { align: 'center' });
      doc.line(col2X - 25, finalY + 23, col2X + 25, finalY + 23);

      doc.text(signatoryName, col3X, finalY + 22, { align: 'center' });
      doc.line(col3X - 25, finalY + 23, col3X + 25, finalY + 23);

      // Signatory Roles
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Warehouse Inventory Officer', col1X, finalY + 26.5, { align: 'center' });
      doc.text('Warehouse Operations Lead', col2X, finalY + 26.5, { align: 'center' });
      doc.text('Direktur Rantai Pasok & Logistik', col3X, finalY + 26.5, { align: 'center' });

      // DIRECT FILE DOWNLOAD TRIGGER
      doc.save(fileName);
    } catch (err) {
      console.error('Gagal generate PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Browser Print Dialog Fallback
  const handlePrintDialog = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Print Specific CSS Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible;
          }
          #printable-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 16px 24px;
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-break-inside-avoid {
            page-break-inside: avoid;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }
          thead th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 700 !important;
          }
          .print-header-brand {
            border-bottom: 3px double #0f172a !important;
          }
        }
      `}</style>

      {/* Screen Header Banner */}
      <div className="no-print bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Modul Ekspor Resmi
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Kop Surat NetSolusions
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Pusat Laporan & Ekspor Dokumen
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Cetak dan unduh laporan inventaris berkop surat resmi PT NetSolusions Solusi Teknologi dalam format Microsoft Excel (.xls) dan PDF dengan penandatanganan legalitas.
            </p>
          </div>

          {/* Quick Global Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPreviewModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold border border-slate-700 hover:border-slate-600 transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>Pratinjau Layar Penuh</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/30 transition flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel (.xls)</span>
            </button>

            {/* Direct PDF Download button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className={`px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-indigo-900/30 transition flex items-center gap-2 cursor-pointer ${
                isExportingPdf ? 'opacity-80 cursor-not-allowed' : ''
              }`}
            >
              {isExportingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isExportingPdf ? 'Membuat PDF...' : 'Download PDF (.pdf)'}</span>
            </button>

            {/* Print Dialog option */}
            <button
              onClick={handlePrintDialog}
              title="Cetak langsung ke mesin printer / dialog cetak sistem"
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="no-print flex flex-wrap gap-2 p-1.5 bg-slate-900/90 dark:bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm">
        <button
          onClick={() => setActiveReport('inventory_valuation')}
          className={`flex-1 min-w-[200px] px-4 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2.5 cursor-pointer ${
            activeReport === 'inventory_valuation'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Valuasi & Posisi Stok Fisik</span>
        </button>

        <button
          onClick={() => setActiveReport('tsb_recommendations')}
          className={`flex-1 min-w-[200px] px-4 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2.5 cursor-pointer ${
            activeReport === 'tsb_recommendations'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Rekomendasi Restok TSB & ROP</span>
        </button>

        <button
          onClick={() => setActiveReport('purchase_orders')}
          className={`flex-1 min-w-[200px] px-4 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2.5 cursor-pointer ${
            activeReport === 'purchase_orders'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Purchase Order & Supplier</span>
        </button>

        <button
          onClick={() => setActiveReport('sales_history')}
          className={`flex-1 min-w-[200px] px-4 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2.5 cursor-pointer ${
            activeReport === 'sales_history'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Penjualan & Demand Outbound</span>
        </button>
      </div>

      {/* Filter and Signature Controls */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari SKU, nama produk, nomor PO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Dynamic Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category filter */}
            {(activeReport === 'inventory_valuation' || activeReport === 'tsb_recommendations') && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Semua Status</option>
              {activeReport === 'inventory_valuation' && (
                <>
                  <option value="CRITICAL">Kritis / Habis (CRITICAL)</option>
                  <option value="WARNING">Peringatan (WARNING)</option>
                  <option value="OPTIMAL">Optimal (OPTIMAL)</option>
                  <option value="OVERSTOCK">Kelebihan (OVERSTOCK)</option>
                </>
              )}
              {activeReport === 'tsb_recommendations' && (
                <>
                  <option value="NEED_RESTOCK">Hanya Yang Butuh Restok (Qty &gt; 0)</option>
                  <option value="CRITICAL">Status Kritis</option>
                  <option value="WARNING">Status Warning</option>
                </>
              )}
              {activeReport === 'purchase_orders' && (
                <>
                  <option value="ORDERED">ORDERED (Baru Dipesan)</option>
                  <option value="IN_TRANSIT">IN_TRANSIT (Dalam Perjalanan)</option>
                  <option value="RECEIVED">RECEIVED (Telah Diterima)</option>
                </>
              )}
              {activeReport === 'sales_history' && (
                <>
                  <option value="PAID">PAID</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </>
              )}
            </select>

            {/* Reset Filter Button */}
            {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedStatus('ALL');
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Legal Signatories Configuration Toggle */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">Penandatangan Laporan:</span>
            <div className="flex items-center gap-2">
              <span>Disahkan Oleh:</span>
              <input
                type="text"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 w-56"
                placeholder="Nama Direktur Logistik"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span>Dibuat Oleh:</span>
            <input
              type="text"
              value={preparedByName}
              onChange={(e) => setPreparedByName(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 w-48"
              placeholder="Nama Staff Gudang"
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PRINTABLE REPORT PREVIEW CONTAINER                        */}
      {/* This renders the actual corporate paper document on-screen */}
      {/* and is targeted directly by @media print.                 */}
      {/* ========================================================= */}
      <div
        id="printable-report-area"
        ref={printAreaRef}
        className="bg-white text-slate-900 rounded-2xl p-6 sm:p-10 border border-slate-300 shadow-2xl space-y-6"
      >
        {/* 1. KOP SURAT RESMI (OFFICIAL LETTERHEAD) */}
        <div className="border-b-4 border-double border-slate-900 pb-5">
          <div className="flex items-center justify-between gap-6">
            {/* Logo and Brand Info */}
            <div className="flex items-center gap-4">
              {/* High-res SVG Corporate Emblem */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-700 flex items-center justify-center shadow-lg p-2 shrink-0">
                <Boxes className="w-10 h-10 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-slate-950 uppercase font-sans">
                    PT NETSOLUSIONS SOLUSI TEKNOLOGI
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ISO 9001:2015
                  </span>
                </div>
                <p className="text-xs font-bold text-indigo-900 tracking-wide uppercase mt-0.5">
                  Divisi Manajemen Rantai Pasok & Sistem Inventaris Cerdas (TSB Analytics)
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                  Gedung Cyber Tower Lt. 12, Jl. TB Simatupang No. 88, Cilandak, Jakarta Selatan 12430
                  <br />
                  Telepon: (021) 789-2045 | Faksimili: (021) 789-2046 | Surel: logistics@netsolusions.co.id | Portal: www.netsolusions.co.id
                </p>
              </div>
            </div>

            {/* Document QR / Reference Stamp */}
            <div className="hidden sm:flex flex-col items-end text-right border-l-2 border-slate-200 pl-4 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Registrasi Arsip
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                {docRefNumber}
              </span>
              <div className="mt-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                INTERNAL AUDIT ONLY
              </div>
              <span className="text-[10px] text-slate-500 mt-1">
                Siklus: Hari ke-{currentDay}
              </span>
            </div>
          </div>
        </div>

        {/* 2. DOKUMEN METADATA & TITLE */}
        <div className="text-center space-y-1.5 py-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase">
            {activeReport === 'inventory_valuation' && 'LAPORAN AUDIT POSISI STOK & VALUASI FISIK INVENTARIS'}
            {activeReport === 'tsb_recommendations' && 'LAPORAN REKOMENDASI RESTOK & ANALISIS ALGORITMA TSB'}
            {activeReport === 'purchase_orders' && 'LAPORAN REALISASI PURCHASE ORDER (PO) & REKAP SUPPLIER'}
            {activeReport === 'sales_history' && 'LAPORAN RIWAYAT PENJUALAN & PERGERAKAN DEMAND OUTBOUND'}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-slate-600 font-medium">
            <span>
              Nomor Dokumen: <b className="font-mono text-slate-900">{docRefNumber}</b>
            </span>
            <span>•</span>
            <span>
              Waktu Cetak: <b className="text-slate-900">{currentDateFormatted}, {currentTimeFormatted}</b>
            </span>
            <span>•</span>
            <span>
              Penyusun: <b className="text-slate-900">{preparedByName}</b>
            </span>
            <span>•</span>
            <span>
              Status Filter: <b className="text-slate-900">{selectedStatus === 'ALL' ? 'Semua Status' : selectedStatus}</b>
            </span>
          </div>
        </div>

        {/* 3. EXECUTIVE KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print-break-inside-avoid">
          {activeReport === 'inventory_valuation' && (
            <>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Total SKU Terdata
                </span>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {valuationSummary.totalItems} <span className="text-xs font-normal text-slate-500">Item</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Total Unit Fisik
                </span>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {valuationSummary.totalPhysicalUnits.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Unit</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                  Total Valuasi Modal (Asset)
                </span>
                <p className="text-xl font-black text-emerald-700 mt-1">
                  {formatRupiah(valuationSummary.totalAssetValuation)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50">
                <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wide">
                  Potensi Nilai Jual
                </span>
                <p className="text-xl font-black text-indigo-700 mt-1">
                  {formatRupiah(valuationSummary.totalRetailPotential)}
                </p>
              </div>
            </>
          )}

          {activeReport === 'tsb_recommendations' && (
            <>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  SKU Dianalisis TSB
                </span>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {tsbSummary.totalAnalyzed} <span className="text-xs font-normal text-slate-500">SKU</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide">
                  SKU Perlu Restok (ROP)
                </span>
                <p className="text-xl font-black text-rose-700 mt-1">
                  {tsbSummary.needRestockCount} <span className="text-xs font-normal text-rose-600">Item</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                  Total Unit Disarankan
                </span>
                <p className="text-xl font-black text-amber-700 mt-1">
                  {tsbSummary.totalUnitsToOrder.toLocaleString('id-ID')} <span className="text-xs font-normal text-amber-600">Unit</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50">
                <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wide">
                  Estimasi Anggaran PO
                </span>
                <p className="text-xl font-black text-indigo-700 mt-1">
                  {formatRupiah(tsbSummary.totalEstimatedBudget)}
                </p>
              </div>
            </>
          )}

          {activeReport === 'purchase_orders' && (
            <>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Total PO Terbit
                </span>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {poSummary.totalOrders} <span className="text-xs font-normal text-slate-500">PO</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                  PO Dalam Perjalanan
                </span>
                <p className="text-xl font-black text-amber-700 mt-1">
                  {poSummary.inTransit} <span className="text-xs font-normal text-amber-600">PO</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                  PO Selesai Diterima
                </span>
                <p className="text-xl font-black text-emerald-700 mt-1">
                  {poSummary.received} <span className="text-xs font-normal text-emerald-600">PO</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50">
                <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wide">
                  Total Nilai Pengadaan
                </span>
                <p className="text-xl font-black text-indigo-700 mt-1">
                  {formatRupiah(poSummary.totalPoValue)}
                </p>
              </div>
            </>
          )}

          {activeReport === 'sales_history' && (
            <>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Total Transaksi
                </span>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {salesSummary.totalTx} <span className="text-xs font-normal text-slate-500">Tx</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Total Unit Keluar
                </span>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {salesSummary.totalUnitsSold.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Unit</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 col-span-2">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                  Total Akumulasi Omset Penjualan
                </span>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {formatRupiah(salesSummary.totalGrossRevenue)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* 4. DATA TABLE SECTION */}
        <div className="overflow-x-auto border border-slate-300 rounded-xl print-break-inside-avoid">
          {/* TAB 1: INVENTORY VALUATION TABLE */}
          {activeReport === 'inventory_valuation' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-2.5 px-3 text-center border-r border-slate-700 w-10">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-700 w-24">SKU</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Nama Barang & Spesifikasi</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Kategori</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-700 w-16">Satuan</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700 w-20">Stok</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700">Harga Modal</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700">Total Valuasi (Modal)</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700">Harga Jual</th>
                  <th className="py-2.5 px-3 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredValuationData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 italic">
                      Tidak ada data inventaris yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredValuationData.map((p, idx) => (
                    <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 border-r border-slate-200">
                        {p.sku}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                        {p.name}
                        <div className="text-[10px] text-slate-500 font-normal">
                          {p.supplier?.name} | Lead: {p.leadTimeDays} Hari
                        </div>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                        {p.category}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-600">
                        {p.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 border-r border-slate-200">
                        {p.currentStock}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-slate-200">
                        {formatRupiah(p.costPrice)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-800 border-r border-slate-200">
                        {formatRupiah(p.totalCostVal)}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-slate-200">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.analysis?.stockStatus === 'CRITICAL' || p.analysis?.stockStatus === 'OUT_OF_STOCK'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : p.analysis?.stockStatus === 'WARNING'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {p.analysis?.stockStatus || 'OPTIMAL'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold text-slate-900">
                  <td colSpan={5} className="py-2.5 px-3 text-right border-r border-slate-300 uppercase">
                    Total Akumulasi:
                  </td>
                  <td className="py-2.5 px-3 text-right border-r border-slate-300">
                    {valuationSummary.totalPhysicalUnits.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300">-</td>
                  <td className="py-2.5 px-3 text-right border-r border-slate-300 text-emerald-900 font-black">
                    {formatRupiah(valuationSummary.totalAssetValuation)}
                  </td>
                  <td className="py-2.5 px-3 text-right border-r border-slate-300 text-indigo-900 font-black">
                    {formatRupiah(valuationSummary.totalRetailPotential)}
                  </td>
                  <td className="py-2.5 px-3 text-center">-</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* TAB 2: TSB RECOMMENDATIONS TABLE */}
          {activeReport === 'tsb_recommendations' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-2.5 px-3 text-center border-r border-slate-700 w-10">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-700 w-24">SKU</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Nama Barang</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-700 w-20">Lead Time</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700">Forecast ŷ_t</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700">Safety Stock</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700">ROP</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700">Stok Fisik</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700 bg-amber-950/80">Saran Order</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700">Est. Biaya PO</th>
                  <th className="py-2.5 px-3 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredTsbData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-500 italic">
                      Tidak ada data rekomendasi yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredTsbData.map((p, idx) => (
                    <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 border-r border-slate-200">
                        {p.sku}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                        {p.name}
                        <div className="text-[10px] text-slate-500 font-normal">
                          α: {p.analysis?.alpha} | β: {p.analysis?.beta}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-700">
                        {p.leadTimeDays} Hari
                      </td>
                      <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">
                        {formatDec(p.analysis?.forecastPerDay || 0, 3)}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">
                        {formatDec(p.analysis?.safetyStock || 0, 1)}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-slate-200 font-mono font-bold text-slate-900">
                        {formatDec(p.analysis?.reorderPoint || 0, 1)}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-slate-200 font-bold">
                        {p.currentStock}
                      </td>
                      <td
                        className={`py-2 px-3 text-right border-r border-slate-200 font-black ${
                          p.suggestedQty > 0 ? 'text-rose-700 bg-rose-50/50' : 'text-slate-500'
                        }`}
                      >
                        {p.suggestedQty > 0 ? `${p.suggestedQty} ${p.unit}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-slate-200 font-bold text-slate-900">
                        {p.suggestedQty > 0 ? formatRupiah(p.estimatedBudget) : '-'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.analysis?.stockStatus === 'CRITICAL' || p.analysis?.stockStatus === 'OUT_OF_STOCK'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : p.analysis?.stockStatus === 'WARNING'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {p.analysis?.stockStatus || 'OPTIMAL'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold text-slate-900">
                  <td colSpan={8} className="py-2.5 px-3 text-right border-r border-slate-300 uppercase">
                    Total Kebutuhan Restok:
                  </td>
                  <td className="py-2.5 px-3 text-right border-r border-slate-300 text-rose-700 font-black">
                    {tsbSummary.totalUnitsToOrder.toLocaleString('id-ID')} Unit
                  </td>
                  <td className="py-2.5 px-3 text-right border-r border-slate-300 text-indigo-900 font-black">
                    {formatRupiah(tsbSummary.totalEstimatedBudget)}
                  </td>
                  <td className="py-2.5 px-3 text-center">-</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* TAB 3: PURCHASE ORDERS TABLE */}
          {activeReport === 'purchase_orders' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-2.5 px-3 text-center border-r border-slate-700 w-10">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-700 w-28">Nomor PO</th>
                  <th className="py-2.5 px-3 border-r border-slate-700 w-24">Tanggal</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Nama Barang & SKU</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Nama Supplier</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700 w-16">Qty</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700">Harga Satuan</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700">Total Biaya PO</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-700 w-24">Est. Tiba</th>
                  <th className="py-2.5 px-3 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredPoData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 italic">
                      Tidak ada data purchase order yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredPoData.map((po, idx) => (
                    <tr key={po.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 border-r border-slate-200">
                        {po.poNumber}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-600">
                        {po.createdAt}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                        {po.productName}
                        <div className="text-[10px] text-slate-500 font-mono">{po.sku}</div>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                        {po.supplierName}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 border-r border-slate-200">
                        {po.quantity}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-slate-200">
                        {formatRupiah(po.unitCost)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-800 border-r border-slate-200">
                        {formatRupiah(po.totalCost)}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-600">
                        {po.expectedArrivalDate}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            po.status === 'RECEIVED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : po.status === 'IN_TRANSIT'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold text-slate-900">
                  <td colSpan={7} className="py-2.5 px-3 text-right border-r border-slate-300 uppercase">
                    Total Nilai PO:
                  </td>
                  <td className="py-2.5 px-3 text-right border-r border-slate-300 text-emerald-900 font-black">
                    {formatRupiah(poSummary.totalPoValue)}
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-center">-</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* TAB 4: SALES HISTORY TABLE */}
          {activeReport === 'sales_history' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-2.5 px-3 text-center border-r border-slate-700 w-10">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-700 w-28">No. Invoice</th>
                  <th className="py-2.5 px-3 border-r border-slate-700 w-24">Tanggal</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Nama Klien / Dept</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Rincian Item</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700 w-16">Total Qty</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-700">Nilai Transaksi</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-700 w-24">Metode Bayar</th>
                  <th className="py-2.5 px-3 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredSalesData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                      Tidak ada data transaksi penjualan yang tercatat.
                    </td>
                  </tr>
                ) : (
                  filteredSalesData.map((order, idx) => {
                    const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <tr key={order.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 border-r border-slate-200">
                          {order.orderNumber}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-600">
                          {order.createdAt}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                          {order.customerName}
                          <div className="text-[10px] text-slate-500 font-normal">
                            {order.customerEmail || order.customerPhone}
                          </div>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                          {order.items.map((i, iIdx) => (
                            <span key={iIdx} className="inline-block mr-2">
                              {i.productName} ({i.quantity}x)
                            </span>
                          ))}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 border-r border-slate-200">
                          {totalQty}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-800 border-r border-slate-200">
                          {formatRupiah(order.totalAmount)}
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-200 uppercase text-slate-600 text-[10px] font-semibold">
                          {order.paymentMethod}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold text-slate-900">
                  <td colSpan={6} className="py-2.5 px-3 text-right border-r border-slate-300 uppercase">
                    Total Nilai Penjualan:
                  </td>
                  <td className="py-2.5 px-3 text-right border-r border-slate-300 text-emerald-900 font-black">
                    {formatRupiah(salesSummary.totalGrossRevenue)}
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-center">-</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* 5. LEMBAR PENGESAHAN & TANDA TANGAN RESMI (SIGNATURE BLOCK) */}
        <div className="pt-6 border-t border-slate-300 print-break-inside-avoid">
          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            {/* Preparer */}
            <div className="space-y-1">
              <p className="font-bold text-slate-700">Disusun & Diinput Oleh:</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[10px] text-slate-400 italic">Tanda tangan petugas</span>
              </div>
              <p className="font-bold text-slate-950 underline text-sm">{preparedByName}</p>
              <p className="text-[10px] text-slate-500">Warehouse Inventory Officer</p>
            </div>

            {/* Verifier with Digital Stamp */}
            <div className="space-y-1 relative">
              <p className="font-bold text-slate-700">Diperiksa & Diverifikasi:</p>
              <div className="h-20 flex items-center justify-center relative">
                {/* Official NetSolusions Verification Stamp */}
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-600/80 flex flex-col items-center justify-center p-1 text-emerald-700 rotate-[-8deg] pointer-events-none select-none bg-emerald-50/20">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-[7px] font-black uppercase tracking-tighter text-center">
                    PT NETSOLUSIONS
                  </span>
                  <span className="text-[6px] font-bold text-emerald-800">
                    VERIFIED & AUDITED
                  </span>
                  <span className="text-[6px] text-slate-500">
                    {currentDateFormatted.slice(0, 10)}
                  </span>
                </div>
              </div>
              <p className="font-bold text-slate-950 underline text-sm">Bambang Wicaksono, S.T.</p>
              <p className="text-[10px] text-slate-500">Warehouse Operations Lead</p>
            </div>

            {/* Authorizer */}
            <div className="space-y-1">
              <p className="font-bold text-slate-700">Disetujui & Disahkan:</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[10px] text-slate-400 italic">Tanda tangan direksi</span>
              </div>
              <p className="font-bold text-slate-950 underline text-sm">{signatoryName}</p>
              <p className="text-[10px] text-slate-500">Direktur Rantai Pasok & Logistik</p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500">
            <span>Dokumen sah yang diterbitkan oleh Sistem Enterprise NetSolusions TSB Pro.</span>
            <span>Halaman 1 dari 1 (Generated Automatically)</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FULL SCREEN MODAL PREVIEW                                 */}
      {/* ========================================================= */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Pratinjau Dokumen Cetak NetSolusions
                  </h3>
                  <p className="text-xs text-slate-400">
                    Format resmi siap cetak (Kop Surat, Logo, KPI, dan Lembar Pengesahan)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className={`px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow ${
                    isExportingPdf ? 'opacity-80 cursor-not-allowed' : ''
                  }`}
                >
                  {isExportingPdf ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isExportingPdf ? 'Membuat PDF...' : 'Download PDF (.pdf)'}</span>
                </button>
                <button
                  onClick={handlePrintDialog}
                  title="Buka dialog cetak printer"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body with Scrollable White Paper */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 flex justify-center">
              <div className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-slate-300">
                <p className="text-xs text-slate-500 text-center mb-4 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200">
                  Tips: Klik <b>Download PDF (.pdf)</b> untuk mengunduh langsung dokumen resmi beresolusi tinggi, atau klik <b>Download Excel</b> untuk analisis spreadsheet.
                </p>

                {/* Kop Surat in Modal */}
                <div className="border-b-4 border-double border-slate-900 pb-4 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-700 flex items-center justify-center p-2 shrink-0">
                        <Boxes className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-950 uppercase">
                          PT NETSOLUSIONS SOLUSI TEKNOLOGI
                        </h4>
                        <p className="text-[10px] font-bold text-indigo-900 uppercase">
                          Divisi Rantai Pasok, Logistik & Inventaris Terpadu (TSB Analytics)
                        </p>
                        <p className="text-[9px] text-slate-600">
                          Gedung Cyber Tower Lt. 12, Jl. TB Simatupang No. 88, Jakarta Selatan 12430 | Telp: (021) 789-2045
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-600">
                      <p className="font-mono font-bold text-slate-900">{docRefNumber}</p>
                      <p>{currentDateFormatted}</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-center text-sm font-black text-slate-950 uppercase mb-4">
                  {activeReport === 'inventory_valuation' && 'LAPORAN AUDIT POSISI STOK & VALUASI FISIK INVENTARIS'}
                  {activeReport === 'tsb_recommendations' && 'LAPORAN REKOMENDASI RESTOK & ANALISIS ALGORITMA TSB'}
                  {activeReport === 'purchase_orders' && 'LAPORAN REALISASI PURCHASE ORDER (PO) & REKAP SUPPLIER'}
                  {activeReport === 'sales_history' && 'LAPORAN RIWAYAT PENJUALAN & PERGERAKAN DEMAND OUTBOUND'}
                </h3>

                {/* Preview Summary */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Dokumen:</span>
                    <p className="font-semibold text-slate-900">{docRefNumber}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Petugas:</span>
                    <p className="font-semibold text-slate-900">{preparedByName}</p>
                  </div>
                </div>

                {/* Brief Data list */}
                <p className="text-xs text-slate-600 mb-2 font-bold">
                  Total Baris Data: {activeReport === 'inventory_valuation' ? filteredValuationData.length : activeReport === 'tsb_recommendations' ? filteredTsbData.length : activeReport === 'purchase_orders' ? filteredPoData.length : filteredSalesData.length} entri ditemukan.
                </p>

                <div className="pt-6 border-t border-slate-300 mt-6 grid grid-cols-3 gap-4 text-center text-[10px]">
                  <div>
                    <p className="font-bold">Dibuat Oleh:</p>
                    <div className="h-12" />
                    <p className="font-bold underline">{preparedByName}</p>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-700">Digital Audited:</p>
                    <div className="h-12 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="font-bold underline">Bambang Wicaksono, S.T.</p>
                  </div>
                  <div>
                    <p className="font-bold">Disetujui Oleh:</p>
                    <div className="h-12" />
                    <p className="font-bold underline">{signatoryName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
