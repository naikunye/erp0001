
export type Page = 'dashboard' | 'inventory' | 'customers' | 'intelligence' | 'settings' | 'finance' | 'tracking' | 'calendar' | 'marketing' | 'analytics' | 'replenishment' | 'suppliers' | 'calculator' | 'profile' | 'tasks' | 'ai-command' | 'logistics-hub';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  assignee: string;
  dueDate: string;
  relatedSku?: string;
  category: 'logistics' | 'marketing' | 'procurement' | 'finance';
  dependsOn?: string[]; // Array of Task IDs that must be completed first
}

export type ProductStatus = 'active' | 'draft' | 'archived' | 'out_of_stock' | 'low_stock';
export type ProductLifecycle = 'New' | 'Growing' | 'Stable' | 'Clearance';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  inventoryBreakdown?: { warehouseId: string; quantity: number; reserved: number; inbound: number }[];
  price: number;
  status: ProductStatus;
  lastUpdated: string;
  dailyBurnRate?: number;
  lifecycle?: ProductLifecycle;
  supplier?: string;
  supplierId?: string;
  supplierContact?: string;
  costPrice?: number;
  leadTime?: number;
  safetyStockDays?: number;
  dimensions?: { l: number; w: number; h: number };
  itemsPerBox?: number;
  boxCount?: number;
  unitWeight?: number;
  warehouseAgeDays?: number; // 库龄
  logistics?: { 
    method: 'Air' | 'Sea'; 
    carrier: string; 
    trackingNo: string; 
    unitFreightCost: number; 
    totalFreightCost?: number;
    billingWeight?: number;
    unitBillingWeight?: number;
    consumablesFee?: number;
    customsFee?: number;
    portFee?: number;
    targetWarehouse: string 
  };
  economics?: { 
    platformFeePercent: number; 
    creatorFeePercent: number; 
    fixedCost: number; 
    lastLegShipping: number; 
    adCost: number; 
    refundRatePercent?: number;
    storageFeeMonthly?: number; // 月度仓储费
  };
  deletedAt?: string;
  image?: string;
  images?: string[];
  lingXingId?: string;
  notes?: string;
}

/* Added ReplenishmentItem for Inventory and Replenishment pages */
export interface ReplenishmentItem extends Product {
  dailyBurnRate: number;
  daysRemaining: number;
  safetyStock: number;
  reorderPoint: number;
  totalInvestment: number;
  freightCost: number;
  goodsCost: number;
  revenue30d: number;
  growth: number;
  profit: number;
  totalPotentialProfit: number;
  margin: number;
  totalWeight: number;
  boxes: number;
}

export interface AiInsight {
  id: string;
  type: 'risk' | 'opportunity' | 'action';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  executed?: boolean;
}

export interface InboundShipmentItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  boxes: number;
  unitPrice: number;
  hscode?: string;
}

export interface InboundShipment {
  id: string;
  name: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: 'Draft' | 'Working' | 'Shipped' | 'Receiving' | 'Closed';
  items: InboundShipmentItem[];
  totalWeight: number;
  totalVolume: number;
  carrier?: string;
  trackingNumber?: string;
  createdDate: string;
  shippedDate?: string;
  eta?: string;
  documents?: {
    ci_url?: string;
    pl_url?: string;
  };
}

export interface OrderLineItem {
  productId: string;
  sku: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'paid' | 'unpaid' | 'refunded';

export interface Order {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: OrderStatus;
  itemsCount: number;
  lineItems?: OrderLineItem[];
  paymentStatus?: PaymentStatus;
  shippingMethod?: string;
  trackingNumber?: string;
  automationTags?: string[];
  deletedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  level: 'Standard' | 'VIP' | 'Partner' | 'Blocked';
  source: string;
  totalSpend: number;
  ordersCount: number;
  status: 'Active' | 'Inactive';
  lastOrderDate: string;
  notes?: string;
  avatarColor?: string;
}

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'Bank' | 'PayPal' | 'CreditCard' | 'AliPay' | 'WeChat' | 'Payoneer' | 'PingPong' | 'Stripe' | 'Other';
export type TransactionCategory = 'Revenue' | 'COGS' | 'Logistics' | 'Marketing' | 'Software' | 'Office' | 'Payroll' | 'Other';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: 'USD' | 'CNY' | 'EUR';
  description: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: PaymentMethod;
  tags?: string[];
  relatedOrderId?: string;
  relatedPOId?: string;
}

export interface ShipmentEvent {
  date: string;
  time: string;
  location: string;
  description: string;
  status: 'Normal' | 'Exception' | 'Delivered' | 'InTransit';
}

export interface Shipment {
  id: string;
  trackingNo: string;
  carrier: string;
  status: '待处理' | '运输中' | '已送达' | '异常';
  origin?: string;
  destination?: string;
  estimatedDelivery?: string;
  productName?: string;
  lastUpdate?: string;
  events: ShipmentEvent[];
  shipDate?: string;
  notes?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  type: 'Local' | 'FBA' | '3PL';
  region: 'CN' | 'US' | 'EU' | 'Other';
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  paymentTerms: string;
  status: 'Active' | 'Inactive';
  leadTime: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export type EventType = 'logistics' | 'marketing' | 'finance' | 'product' | 'stockout';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  description?: string;
  autoGenerated?: boolean;
  sku?: string;
}

/* Added SalesData for Dashboard and Charts */
export interface SalesData {
  name: string;
  value: number;
}

/* Added AdCampaign for Marketing and Finance */
export interface AdCampaign {
  id: string;
  name: string;
  platform: string;
  status: 'Active' | 'Paused' | 'Ended';
  budget: number;
  spend: number;
  sales: number;
  acos: number;
  roas: number;
  clicks: number;
  impressions: number;
  ctr: number;
  cpc: number;
}

/* Added Influencer for Marketing */
export interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: 'TikTok' | 'Instagram' | 'YouTube';
  followers: number;
  country: string;
  status: 'To Contact' | 'Sample Sent' | 'Video Live' | 'Completed';
  sampleProductSku?: string;
  sampleDate?: string;
  sampleCost?: number;
  generatedSales?: number;
  roi?: number;
  videoUrl?: string;
  tags: string[];
}

/* Added AuditLog for Context */
export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

/* Added ExportTask for Context */
export interface ExportTask {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'failed';
  progress: number;
}

/* Added Integration for Integrations Page */
export interface Integration {
  id: string;
  platform: 'Amazon' | 'TikTok' | 'Shopify' | 'eBay' | 'WooCommerce' | 'Walmart';
  name: string;
  region: string;
  status: 'connected' | 'error' | 'syncing';
  lastSync: string;
}
