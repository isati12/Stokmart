import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Product,
  CartItem,
  CustomerOrder,
  RestockOrder,
  ActivityLog,
  UserSession,
  TSBSettings,
  TSBAnalysisResult,
  CourierOption,
} from '../types/inventory';
import { INITIAL_PRODUCTS } from '../data/mockProducts';
import { calculateTSB } from '../utils/tsbAlgorithm';
import { COURIER_OPTIONS } from '../data/logisticsAndBanking';

interface InventoryContextType {
  products: Product[];
  cart: CartItem[];
  customerOrders: CustomerOrder[];
  restockOrders: RestockOrder[];
  activityLogs: ActivityLog[];
  currentUser: UserSession | null;
  tsbSettings: TSBSettings;
  currentDay: number;
  activeView: 'storefront' | 'admin';
  selectedProductId: string | null;
  isLoginModalOpen: boolean;
  isCartOpen: boolean;
  isTrackingModalOpen: boolean;
  trackingSearchQuery: string;

  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;

  // Setters & Navigation
  setActiveView: (view: 'storefront' | 'admin') => void;
  setSelectedProductId: (id: string | null) => void;
  setIsLoginModalOpen: (open: boolean) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsTrackingModalOpen: (open: boolean) => void;
  setTrackingSearchQuery: (query: string) => void;
  openTrackingForOrder: (query: string) => void;

  // Auth
  login: (email: string, role?: 'admin' | 'warehouse_manager') => boolean;
  logout: () => void;

  // Cart & Sales
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: (
    customerDetails: {
      name: string;
      email: string;
      phone: string;
      address: string;
      paymentMethod: 'qris' | 'bank_transfer' | 'po_corporate';
      selectedBank?: string;
      courier: CourierOption;
      notes?: string;
      paymentProofUrl?: string;
    }
  ) => Promise<{ success: boolean; order?: CustomerOrder }>;

  // Payment Confirmation & Order Workflow
  confirmPayment: (orderId: string, awbNumber?: string, notes?: string) => void;
  updateOrderStatus: (orderId: string, status: CustomerOrder['status'], notes?: string) => void;

  // Restock & PO
  createRestockOrder: (
    productId: string,
    quantity: number,
    notes?: string
  ) => RestockOrder;
  receiveRestockOrder: (orderId: string) => void;
  cancelRestockOrder: (orderId: string) => void;

  // Product CRUD & Stock Opname
  adjustProductStock: (productId: string, newStock: number, reason: string, evidencePhotos?: string[]) => void;
  addNewProduct: (product: Omit<Product, 'id' | 'soldCount' | 'rating'>) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;

  // TSB Engine & Simulation
  updateTSBSettings: (settings: Partial<TSBSettings>) => void;
  getTSBAnalysis: (productId: string) => TSBAnalysisResult;
  allTSBAnalyses: Map<string, TSBAnalysisResult>;
  simulateNextDay: () => void;
  resetToSampleData: () => void;
}

const STORAGE_KEYS = {
  PRODUCTS: 'stoksmart_products_v1',
  SETTINGS: 'stoksmart_settings_v1',
  RESTOCKS: 'stoksmart_restocks_v1',
  ORDERS: 'stoksmart_orders_v1',
  LOGS: 'stoksmart_logs_v1',
  DAY: 'stoksmart_day_v1',
  USER: 'stoksmart_user_v1',
  THEME: 'stoksmart_theme_v1',
};

const DEFAULT_SETTINGS: TSBSettings = {
  alpha: 0.2, // smoothing factor for demand size
  beta: 0.15, // smoothing factor for demand probability
  serviceLevel: 0.95, // 95% service level standard
};

const InventoryContext = createContext<InventoryContextType | null>(null);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load products with fallback
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: Product) => {
            const initialMatch = INITIAL_PRODUCTS.find((init) => init.id === p.id || init.sku === p.sku);
            const baseImages =
              p.images && p.images.length > 1
                ? p.images
                : (initialMatch?.images || (p.images && p.images.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : [])));
            return {
              ...p,
              images: baseImages,
              imageUrl: baseImages[0] || p.imageUrl,
            };
          });
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_PRODUCTS;
  });

  const [tsbSettings, setTsbSettings] = useState<TSBSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [restockOrders, setRestockOrders] = useState<RestockOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RESTOCKS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'PO-2026-001',
        poNumber: 'PO-IND-8821',
        createdAt: '2026-10-21 09:30',
        productId: 'prod-005',
        productName: 'Silinder Pneumatik Festo DSNU-25-100-PPV-A Double Acting',
        sku: 'CYL-FESTO-DSNU-25',
        supplierName: 'CV Prima Pneumatics',
        quantity: 12,
        unitCost: 620000,
        totalCost: 7440000,
        leadTimeDays: 5,
        expectedArrivalDate: '2026-10-26',
        status: 'IN_TRANSIT',
        notes: 'Restok darurat via TSB Trigger (Stok Habis)',
      },
    ];
  });

  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'ORD-9901',
        orderNumber: 'INV-20261024-4019',
        trackingCode: 'TRK-NETS-78210',
        createdAt: 'Hari ini, 09:15 WIB',
        customerName: 'Budi Santoso (PT Steel Works)',
        customerEmail: 'purchasing@steelworks.co.id',
        customerPhone: '081234567890',
        customerAddress: 'Kawasan Industri MM2100 Blok C-4, Cikarang Barat, Bekasi',
        items: [
          {
            productId: 'prod-001',
            productName: 'Bearing Bola Deep Groove SKF 6205-2RSH Presisi',
            sku: 'BRG-6205-2RS-SKF',
            price: 185000,
            quantity: 2,
          },
        ],
        subtotalAmount: 370000,
        shippingCost: 18000,
        totalAmount: 388000,
        paymentMethod: 'bank_transfer',
        selectedBank: 'BCA',
        selectedCourier: COURIER_OPTIONS[0], // JNE Express
        status: 'WAITING_PAYMENT',
        trackingHistory: [
          {
            timestamp: 'Hari ini, 09:15 WIB',
            status: 'Pesanan Dibuat',
            description: 'Pesanan telah masuk ke sistem. Menunggu konfirmasi pembayaran oleh Admin NetSolusions.',
            location: 'Sistem NetSolusions Store',
            isCompleted: true,
            isCurrent: true,
          },
        ],
      },
      {
        id: 'ORD-9882',
        orderNumber: 'INV-20261023-1082',
        trackingCode: 'TRK-NETS-55412',
        createdAt: 'Kemarin, 10:30 WIB',
        customerName: 'Hendro Wijaya (CV Mandiri Presisi)',
        customerEmail: 'hendro@mandiripresisi.co.id',
        customerPhone: '081398765432',
        customerAddress: 'Jl. Rungkut Industri Raya No. 12, Surabaya, Jawa Timur',
        items: [
          {
            productId: 'prod-004',
            productName: 'Inverter VFD Schneider Altivar ATV310 2.2kW 3-Phase',
            sku: 'INV-ATV310-2K2',
            price: 2450000,
            quantity: 1,
          },
        ],
        subtotalAmount: 2450000,
        shippingCost: 19000,
        totalAmount: 2469000,
        paymentMethod: 'qris',
        selectedCourier: COURIER_OPTIONS[1], // J&T Express
        shippingAwbNumber: 'JNT-8829104921',
        paymentConfirmedAt: 'Kemarin, 10:45 WIB',
        paymentConfirmedBy: 'Rian Pratama, S.T.',
        status: 'SHIPPED',
        trackingHistory: [
          {
            timestamp: 'Kemarin, 10:30 WIB',
            status: 'Pesanan Dibuat',
            description: 'Pesanan dibuat oleh pelanggan melalui QRIS Dinamis.',
            location: 'Sistem NetSolusions Store',
            isCompleted: true,
          },
          {
            timestamp: 'Kemarin, 10:45 WIB',
            status: 'Pembayaran Dikonfirmasi',
            description: 'Pembayaran telah diverifikasi oleh Admin (Rian Pratama, S.T.). Tracking pengiriman kurir aktif.',
            location: 'Kantor Keuangan NetSolusions',
            isCompleted: true,
          },
          {
            timestamp: 'Kemarin, 13:00 WIB',
            status: 'Selesai Dikemas di Gudang',
            description: 'Barang telah dicek QC, barcode dipindai, dan dibungkus bubble wrap pallet industrial.',
            location: 'Gudang Pusat Cikarang Blok B-2',
            isCompleted: true,
          },
          {
            timestamp: 'Kemarin, 15:40 WIB',
            status: 'Dalam Pengiriman Kurir J&T',
            description: 'Paket telah di-pickup kurir J&T Express. Resi: JNT-8829104921. Menuju Hub Gateway Surabaya.',
            location: 'Drop Point J&T Cikarang Jababeka',
            isCompleted: true,
            isCurrent: true,
          },
        ],
      },
    ];
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'log-1',
        timestamp: 'Hari ini, 14:15',
        type: 'SALE',
        title: 'Penjualan Storefront Sukses',
        description: 'Pesanan #INV-20261022-01 sebesar Rp 370.000 untuk 2 unit SKF Bearing.',
        quantityChange: -2,
        user: 'Storefront Customer',
      },
      {
        id: 'log-2',
        timestamp: 'Kemarin, 09:30',
        type: 'RESTOCK_ORDER',
        title: 'PO Dibuat Otomatis Berdasarkan TSB',
        description: 'PO #PO-IND-8821 diterbitkan ke CV Prima Pneumatics sebanyak 12 unit Silinder Festo.',
        quantityChange: 12,
        user: 'Sistem TSB / Admin',
      },
    ];
  });

  const [currentDay, setCurrentDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAY);
      if (saved) return Number(saved);
    } catch {
      // fallback
    }
    return 24;
  });

  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeView, setActiveView] = useState<'storefront' | 'admin'>('storefront');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState<boolean>(false);
  const [trackingSearchQuery, setTrackingSearchQuery] = useState<string>('');

  const openTrackingForOrder = (query: string) => {
    setTrackingSearchQuery(query);
    setIsTrackingModalOpen(true);
  };

  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // fallback
    }
    return 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // ignore
    }
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(tsbSettings));
  }, [tsbSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESTOCKS, JSON.stringify(restockOrders));
  }, [restockOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(customerOrders));
  }, [customerOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAY, currentDay.toString());
  }, [currentDay]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  // Pre-calculate all TSB analyses
  const allTSBAnalyses = useMemo(() => {
    const map = new Map<string, TSBAnalysisResult>();
    products.forEach((p) => {
      map.set(p.id, calculateTSB(p, tsbSettings));
    });
    return map;
  }, [products, tsbSettings]);

  const getTSBAnalysis = (productId: string): TSBAnalysisResult => {
    const existing = allTSBAnalyses.get(productId);
    if (existing) return existing;
    const prod = products.find((p) => p.id === productId);
    if (!prod) {
      return calculateTSB(INITIAL_PRODUCTS[0], tsbSettings);
    }
    return calculateTSB(prod, tsbSettings);
  };

  // Auth
  const login = (email: string, role: 'admin' | 'warehouse_manager' = 'admin') => {
    const name = role === 'admin' ? 'Rian Pratama, S.T.' : 'Wahyu Gunawan';
    const user: UserSession = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      avatar: role === 'admin'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    };
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    setActiveView('admin');
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveView('storefront');
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx > -1) {
        const next = [...prev];
        const newQty = Math.min(product.currentStock, next[idx].quantity + quantity);
        next[idx] = { ...next[idx], quantity: newQty };
        return next;
      }
      return [...prev, { product, quantity: Math.min(product.currentStock, quantity) }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxAllowed = item.product.currentStock;
          return { ...item, quantity: Math.min(maxAllowed, quantity) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  // Customer Checkout with Courier & Banking Selection
  const checkout = async (details: {
    name: string;
    email: string;
    phone: string;
    address: string;
    paymentMethod: 'qris' | 'bank_transfer' | 'po_corporate';
    selectedBank?: string;
    courier: CourierOption;
    notes?: string;
    paymentProofUrl?: string;
  }): Promise<{ success: boolean; order?: CustomerOrder }> => {
    if (cart.length === 0) return { success: false };

    // Validate current stock availability
    for (const item of cart) {
      const latestProd = products.find((p) => p.id === item.product.id);
      if (!latestProd || latestProd.currentStock < item.quantity) {
        alert(`Maaf, stok ${item.product.name} tidak mencukupi.`);
        return { success: false };
      }
    }

    const subtotalAmount = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const shippingCost = details.courier.cost;
    const totalAmount = subtotalAmount + shippingCost;
    const now = new Date();
    const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const orderNumber = `INV-${dateCode}-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingCode = `TRK-NETS-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: CustomerOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      trackingCode,
      createdAt: `${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      customerName: details.name,
      customerEmail: details.email,
      customerPhone: details.phone,
      customerAddress: details.address,
      items: cart.map((c) => ({
        productId: c.product.id,
        productName: c.product.name,
        sku: c.product.sku,
        price: c.product.price,
        quantity: c.quantity,
      })),
      subtotalAmount,
      shippingCost,
      totalAmount,
      paymentMethod: details.paymentMethod,
      selectedBank: details.selectedBank,
      selectedCourier: details.courier,
      status: 'WAITING_PAYMENT',
      paymentProofUrl: details.paymentProofUrl,
      notes: details.notes,
      trackingHistory: [
        {
          timestamp: 'Baru saja',
          status: 'Pesanan Dibuat',
          description: `Pesanan dibuat via ${details.paymentMethod === 'bank_transfer' ? `Transfer Bank ${details.selectedBank || 'BCA'}` : details.paymentMethod === 'qris' ? 'QRIS Dinamis' : 'PO Corporate'}. Menunggu verifikasi pembayaran oleh Admin NetSolusions.`,
          location: 'Sistem NetSolusions Store',
          isCompleted: true,
          isCurrent: true,
        },
      ],
    };

    // Deduct stock and increment sold count & append to demandHistory for today
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItem = cart.find((c) => c.product.id === prod.id);
        if (!cartItem) return prod;

        const newStock = Math.max(0, prod.currentStock - cartItem.quantity);
        const newHistory = [...prod.demandHistory];
        if (newHistory.length > 0) {
          newHistory[newHistory.length - 1] += cartItem.quantity;
        }

        return {
          ...prod,
          currentStock: newStock,
          soldCount: prod.soldCount + cartItem.quantity,
          demandHistory: newHistory,
        };
      })
    );

    setCustomerOrders((prev) => [newOrder, ...prev]);

    // Activity log
    const logItemsSummary = cart.map((c) => `${c.quantity}x ${c.product.sku}`).join(', ');
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: 'Baru saja',
      type: 'SALE',
      title: `Pesanan Baru #${orderNumber} (${details.courier.name})`,
      description: `Pelanggan ${details.name} memesan ${logItemsSummary}. Kurir: ${details.courier.name} (Ongkir: Rp ${shippingCost.toLocaleString('id-ID')}). Total: Rp ${totalAmount.toLocaleString('id-ID')}. Status: Menunggu Konfirmasi Pembayaran.`,
      quantityChange: -cart.reduce((a, b) => a + b.quantity, 0),
      user: details.name,
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    clearCart();

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    return { success: true, order: newOrder };
  };

  // Admin confirms payment -> Unlocks live courier tracking
  const confirmPayment = (orderId: string, customAwb?: string, notes?: string) => {
    setCustomerOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        const prefix = (order.selectedCourier?.id || 'NETS').toUpperCase();
        const awbNumber = customAwb?.trim() || `${prefix}-${Math.floor(100000000 + Math.random() * 900000000)}`;
        const now = new Date();
        const timeStr = `${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
        const adminName = currentUser?.name || 'Administrator NetSolusions';

        const updatedHistory = [
          ...(order.trackingHistory || []).map((h) => ({ ...h, isCurrent: false })),
          {
            timestamp: timeStr,
            status: 'Pembayaran Dikonfirmasi',
            description: `Pembayaran sebesar Rp ${order.totalAmount.toLocaleString('id-ID')} telah diverifikasi & disetujui oleh ${adminName}. Live tracking kurir diaktifkan.`,
            location: 'Kantor Keuangan NetSolusions',
            isCompleted: true,
          },
          {
            timestamp: timeStr,
            status: 'Diproses di Gudang Cikarang',
            description: 'Barang sedang dipersiapkan, QC checklist, dan dibungkus packaging industrial aman.',
            location: 'Gudang Pusat Cikarang',
            isCompleted: true,
          },
          {
            timestamp: `Estimasi Tiba: ${order.selectedCourier.eta}`,
            status: `Siap Pickup Kurir ${order.selectedCourier.name}`,
            description: `Paket siap dijemput kurir. Nomor Resi Resmi: ${awbNumber}. Layanan: ${order.selectedCourier.service}.`,
            location: 'Hub Ekspedisi / Pick-Up Point',
            isCompleted: true,
            isCurrent: true,
          },
        ];

        return {
          ...order,
          status: 'PROCESSING' as const,
          paymentConfirmedAt: timeStr,
          paymentConfirmedBy: adminName,
          shippingAwbNumber: awbNumber,
          notes: notes || order.notes,
          trackingHistory: updatedHistory,
        };
      })
    );

    // Add activity log
    const targetOrder = customerOrders.find((o) => o.id === orderId);
    if (targetOrder) {
      const log: ActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: 'Baru saja',
        type: 'STOCK_ADJUSTMENT',
        title: `Pembayaran Dikonfirmasi: #${targetOrder.orderNumber}`,
        description: `Admin mengonfirmasi pembayaran Rp ${targetOrder.totalAmount.toLocaleString('id-ID')} untuk ${targetOrder.customerName}. Kurir: ${targetOrder.selectedCourier?.name || 'Ekspedisi'}. Tracking resmi dibuka.`,
        user: currentUser?.name || 'Administrator',
      };
      setActivityLogs((prev) => [log, ...prev]);
    }

    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.5 },
      });
    } catch {
      // ignore
    }
  };

  // Update order status (SHIPPED, DELIVERED, CANCELLED)
  const updateOrderStatus = (orderId: string, status: CustomerOrder['status'], notes?: string) => {
    setCustomerOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        const now = new Date();
        const timeStr = `${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

        let statusTitle = 'Status Diperbarui';
        let statusDesc = notes || `Status pesanan diubah menjadi ${status}`;

        if (status === 'SHIPPED') {
          statusTitle = `Dalam Pengiriman oleh ${order.selectedCourier.name}`;
          statusDesc = `Paket telah berangkat dari Gudang Cikarang menuju alamat penerima. Resi: ${order.shippingAwbNumber || 'Sedang sinkronisasi'}.`;
        } else if (status === 'DELIVERED') {
          statusTitle = 'Pesanan Terkirim';
          statusDesc = `Paket telah diterima di alamat ${order.customerAddress}. Pengiriman selesai dengan aman.`;
        } else if (status === 'CANCELLED') {
          statusTitle = 'Pesanan Dibatalkan';
          statusDesc = notes || 'Pesanan dibatalkan oleh pihak pengelola.';
        }

        const newHistory = [
          ...(order.trackingHistory || []).map((h) => ({ ...h, isCurrent: false })),
          {
            timestamp: timeStr,
            status: statusTitle,
            description: statusDesc,
            location: status === 'DELIVERED' ? 'Alamat Penerima' : 'Armada Logistik',
            isCompleted: true,
            isCurrent: true,
          },
        ];

        return {
          ...order,
          status,
          notes: notes || order.notes,
          trackingHistory: newHistory,
        };
      })
    );
  };

  // Restock PO
  const createRestockOrder = (
    productId: string,
    quantity: number,
    notes?: string
  ): RestockOrder => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) throw new Error('Produk tidak ditemukan');

    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + prod.leadTimeDays);

    const newPO: RestockOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      supplierName: prod.supplier.name,
      quantity,
      unitCost: prod.costPrice,
      totalCost: prod.costPrice * quantity,
      leadTimeDays: prod.leadTimeDays,
      expectedArrivalDate: arrivalDate.toISOString().split('T')[0],
      status: 'IN_TRANSIT',
      notes: notes || `Rekomendasi Restok Algoritma TSB (Lead time ${prod.leadTimeDays} hari)`,
    };

    setRestockOrders((prev) => [newPO, ...prev]);

    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: 'Baru saja',
      type: 'RESTOCK_ORDER',
      title: `Penerbitan PO #${poNumber}`,
      description: `Pemesanan restok ${quantity} unit ${prod.name} ke ${prod.supplier.name}. Nilai PO: Rp ${(prod.costPrice * quantity).toLocaleString('id-ID')}`,
      productId: prod.id,
      productName: prod.name,
      quantityChange: quantity,
      user: currentUser?.name || 'Admin',
    };
    setActivityLogs((prev) => [log, ...prev]);

    return newPO;
  };

  const receiveRestockOrder = (orderId: string) => {
    const po = restockOrders.find((o) => o.id === orderId);
    if (!po || po.status === 'RECEIVED') return;

    // Tambah stok ke produk
    setProducts((prev) =>
      prev.map((p) => (p.id === po.productId ? { ...p, currentStock: p.currentStock + po.quantity } : p))
    );

    // Update status PO
    setRestockOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'RECEIVED' } : o))
    );

    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: 'Baru saja',
      type: 'STOCK_RECEIVED',
      title: `Penerimaan Barang PO #${po.poNumber}`,
      description: `Gudang telah menerima ${po.quantity} unit ${po.productName}. Stok fisik langsung diperbarui.`,
      productId: po.productId,
      productName: po.productName,
      quantityChange: po.quantity,
      user: currentUser?.name || 'Staff Gudang',
    };
    setActivityLogs((prev) => [log, ...prev]);

    try {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
  };

  const cancelRestockOrder = (orderId: string) => {
    setRestockOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
    );
  };

  // Stock Opname / Manual Adjustment
  // Stock Opname / Manual Adjustment with optional evidence/catalog photos
  const adjustProductStock = (
    productId: string,
    newStock: number,
    reason: string,
    evidencePhotos?: string[]
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const diff = newStock - prod.currentStock;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        let updatedImages = p.images ? [...p.images] : (p.imageUrl ? [p.imageUrl] : []);
        if (evidencePhotos && evidencePhotos.length > 0) {
          evidencePhotos.forEach((img) => {
            if (!updatedImages.includes(img)) {
              updatedImages.push(img);
            }
          });
        }
        return {
          ...p,
          currentStock: Math.max(0, newStock),
          images: updatedImages,
          imageUrl: updatedImages[0] || p.imageUrl,
        };
      })
    );

    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: 'Baru saja',
      type: 'STOCK_ADJUSTMENT',
      title: `Penyesuaian Stok Fisik (${prod.sku})`,
      description: `Stok diubah dari ${prod.currentStock} menjadi ${newStock} unit (${diff >= 0 ? `+${diff}` : diff}). Alasan: ${reason}${
        evidencePhotos && evidencePhotos.length > 0 ? ` (${evidencePhotos.length} foto bukti opname diunggah)` : ''
      }`,
      productId: prod.id,
      productName: prod.name,
      quantityChange: diff,
      user: currentUser?.name || 'Admin',
      evidencePhotos: evidencePhotos && evidencePhotos.length > 0 ? evidencePhotos : undefined,
    };
    setActivityLogs((prev) => [log, ...prev]);
  };

  // Add Product
  const addNewProduct = (data: Omit<Product, 'id' | 'soldCount' | 'rating'>) => {
    const id = `prod-${Date.now()}`;
    const images =
      data.images && data.images.length > 0
        ? data.images
        : (data.imageUrl ? [data.imageUrl] : []);
    const newProd: Product = {
      ...data,
      id,
      images,
      imageUrl: images[0] || data.imageUrl,
      soldCount: 0,
      rating: 5.0,
      demandHistory:
        data.demandHistory && data.demandHistory.length > 0
          ? data.demandHistory
          : [0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 2, 0],
    };
    setProducts((prev) => [newProd, ...prev]);

    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: 'Baru saja',
      type: 'PARAM_UPDATE',
      title: `Produk Baru Didaftarkan`,
      description: `SKU ${newProd.sku} (${newProd.name}) didaftarkan dengan stok awal ${newProd.currentStock} unit (${newProd.images?.length || 1} foto contoh).`,
      productId: id,
      productName: newProd.name,
      user: currentUser?.name || 'Admin',
    };
    setActivityLogs((prev) => [log, ...prev]);
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const merged = { ...p, ...updates };
        if (updates.images && updates.images.length > 0) {
          merged.imageUrl = updates.images[0];
        }
        return merged;
      })
    );
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Settings
  const updateTSBSettings = (newSettings: Partial<TSBSettings>) => {
    setTsbSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      return updated;
    });

    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: 'Baru saja',
      type: 'PARAM_UPDATE',
      title: `Parameter Algoritma TSB Diperbarui`,
      description: `Alpha: ${newSettings.alpha ?? tsbSettings.alpha}, Beta: ${newSettings.beta ?? tsbSettings.beta}, Service Level: ${((newSettings.serviceLevel ?? tsbSettings.serviceLevel) * 100).toFixed(0)}%`,
      user: currentUser?.name || 'Admin',
    };
    setActivityLogs((prev) => [log, ...prev]);
  };

  // Simulate Next Day
  const simulateNextDay = () => {
    const nextDay = currentDay + 1;
    setCurrentDay(nextDay);

    // Update each product's demand history with realistic intermittent demand
    setProducts((prev) =>
      prev.map((p) => {
        // Intermittent nature: 75% chance of 0 demand, 25% chance of sporadic demand (1-4 units)
        const hasDemand = Math.random() < 0.28;
        let todayDemand = 0;
        if (hasDemand) {
          todayDemand = Math.floor(Math.random() * 3) + 1;
        }

        const newStock = Math.max(0, p.currentStock - todayDemand);
        const newHistory = [...p.demandHistory, todayDemand];
        // keep max 30 periods
        if (newHistory.length > 30) {
          newHistory.shift();
        }

        return {
          ...p,
          currentStock: newStock,
          soldCount: p.soldCount + todayDemand,
          demandHistory: newHistory,
        };
      })
    );

    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: `Hari ${nextDay}`,
      type: 'SALE',
      title: `Simulasi Hari ke-${nextDay} Berjalan`,
      description: `Waktu sistem dimajukan 1 hari. Data permintaan intermiten harian diperbarui dan probabilitas p_t TSB otomatis diperbarui.`,
      user: 'Sistem Simulator',
    };
    setActivityLogs((prev) => [log, ...prev]);
  };

  // Reset
  const resetToSampleData = () => {
    setProducts(INITIAL_PRODUCTS);
    setTsbSettings(DEFAULT_SETTINGS);
    setCurrentDay(24);
    localStorage.clear();
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        cart,
        customerOrders,
        restockOrders,
        activityLogs,
        currentUser,
        tsbSettings,
        currentDay,
        activeView,
        selectedProductId,
        isLoginModalOpen,
        isCartOpen,
        isTrackingModalOpen,
        trackingSearchQuery,
        setActiveView,
        setSelectedProductId,
        setIsLoginModalOpen,
        setIsCartOpen,
        setIsTrackingModalOpen,
        setTrackingSearchQuery,
        openTrackingForOrder,
        login,
        logout,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        checkout,
        confirmPayment,
        updateOrderStatus,
        createRestockOrder,
        receiveRestockOrder,
        cancelRestockOrder,
        adjustProductStock,
        addNewProduct,
        updateProduct,
        deleteProduct,
        updateTSBSettings,
        getTSBAnalysis,
        allTSBAnalyses,
        theme,
        toggleTheme,
        setTheme,
        simulateNextDay,
        resetToSampleData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
