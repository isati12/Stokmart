export interface DemandPeriod {
  period: number; // e.g. Day 1, 2, ... or Week 1, 2, ...
  label: string; // "Hari 1", "Hari 2", etc.
  actualDemand: number;
  z_t?: number; // Estimated demand size
  p_t?: number; // Estimated demand probability
  forecast?: number; // TSB forecast = z_t * p_t
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  price: number; // in IDR
  costPrice: number; // Harga modal
  currentStock: number;
  minimumStock: number; // Ambang batas minimum cadangan
  leadTimeDays: number; // Waktu tunggu pengiriman (hari)
  unit: string; // "Unit", "Pcs", "Box", "Set"
  imageUrl: string;
  images?: string[]; // Multiple sample photo URLs / base64 data URLs for SKU gallery & landing page
  supplier: {
    name: string;
    contact: string;
    deliveryRating: number; // 1-5
  };
  demandHistory: number[]; // Demand per period for the last N periods (e.g. 20-30 days)
  specs: Record<string, string>;
  isFeatured?: boolean;
  rating: number;
  soldCount: number;
}

export interface TSBSettings {
  alpha: number; // Smoothing factor for demand size (0.01 - 0.5)
  beta: number; // Smoothing factor for demand probability (0.01 - 0.5)
  serviceLevel: number; // 0.90, 0.95, 0.98, 0.99
}

export interface TSBAnalysisResult {
  productId: string;
  alpha: number;
  beta: number;
  periods: DemandPeriod[];
  lastZ: number; // Latest demand size estimate
  lastP: number; // Latest demand probability estimate
  forecastPerDay: number; // y_hat = lastZ * lastP
  leadTimeDays: number;
  demandDuringLeadTime: number; // Forecast * Lead Time
  variance: number;
  standardDeviation: number;
  safetyStock: number;
  reorderPoint: number; // ROP = DemandDuringLeadTime + SafetyStock
  orderUpToLevel: number; // S level
  recommendedRestockQty: number; // max(0, S - currentStock)
  stockStatus: 'OUT_OF_STOCK' | 'CRITICAL' | 'WARNING' | 'OPTIMAL' | 'OVERSTOCK';
  daysOfInventoryLeft: number; // Current stock / ForecastPerDay
  totalPeriodsWithDemand: number;
  demandFrequencyRatio: number; // periods with demand / total periods
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CourierOption {
  id: 'jne' | 'jnt' | 'lalamove' | 'grab' | 'gojek';
  name: string;
  service: string;
  eta: string;
  cost: number;
  badge: string;
  type: 'regular' | 'express' | 'instant' | 'cargo';
}

export interface BankAccount {
  bank: 'BCA' | 'Mandiri' | 'BNI' | 'BRI' | 'BSI';
  accountName: string;
  accountNumber: string;
  branch: string;
  logoColor: string;
}

export interface TrackingStep {
  timestamp: string;
  status: string;
  description: string;
  location?: string;
  isCompleted: boolean;
  isCurrent?: boolean;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  trackingCode: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    price: number;
    quantity: number;
  }[];
  subtotalAmount: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: 'qris' | 'bank_transfer' | 'po_corporate';
  selectedBank?: 'BCA' | 'Mandiri' | 'BNI' | 'BRI' | 'BSI' | string;
  selectedCourier: CourierOption;
  shippingAwbNumber?: string;
  status: 'WAITING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentConfirmedAt?: string;
  paymentConfirmedBy?: string;
  paymentProofUrl?: string;
  trackingHistory?: TrackingStep[];
  notes?: string;
}

export interface RestockOrder {
  id: string;
  poNumber: string;
  createdAt: string;
  productId: string;
  productName: string;
  sku: string;
  supplierName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  leadTimeDays: number;
  expectedArrivalDate: string;
  status: 'ORDERED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  notes?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'SALE' | 'RESTOCK_ORDER' | 'STOCK_RECEIVED' | 'STOCK_ADJUSTMENT' | 'PARAM_UPDATE';
  title: string;
  description: string;
  productId?: string;
  productName?: string;
  quantityChange?: number;
  user?: string;
  evidencePhotos?: string[];
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'warehouse_manager' | 'customer';
  avatar: string;
}
