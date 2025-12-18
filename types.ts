
export type Page = 'dashboard' | 'inventory' | 'customers' | 'intelligence' | 'settings' | 'finance' | 'tracking' | 'calendar' | 'marketing' | 'analytics' | 'replenishment' | 'suppliers' | 'calculator' | 'profile' | 'tasks';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'export';
  entityType: 'product' | 'order' | 'finance' | 'system';
  entityId?: string;
  details: string;
}

export interface ExportTask {
  id: string;
  fileName: string;
  progress: number;
  status: 'processing' | 'completed' | 'failed';
  timestamp: string;
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
  };
  deletedAt?: string;
  image?: string;
  images?: string[];
  lingXingId?: string;
  notes?: string;
  history?: AuditLog[];
}

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
  margin?: number;
  totalWeight: number;
  boxes: number;
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
  events: { date: string; time: string; location: string; description: string; status: string }[];
  shipDate?: string;
  notes?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface Integration {
  id: string;
  platform: 'TikTok' | 'Amazon' | 'Shopify' | 'eBay' | 'WooCommerce' | 'Walmart';
  name: string;
  region: string;
  status: 'connected' | 'error' | 'syncing' | 'disconnected';
  lastSync: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'logistics' | 'marketing' | 'finance' | 'product' | 'stockout';
  description?: string;
  autoGenerated?: boolean;
  sku?: string;
}

/* Added missing Warehouse interface */
export interface Warehouse {
  id: string;
  name: string;
  type: 'Local' | 'FBA' | '3PL';
  region: string;
}

/* Added missing Supplier interface */
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

/* Added missing SalesData interface */
export interface SalesData {
  name: string;
  value: number;
}

/* Added missing EventType type */
export type EventType = 'logistics' | 'marketing' | 'finance' | 'product' | 'stockout';

/* Added missing InfluencerStatus type */
export type InfluencerStatus = 'To Contact' | 'Sample Sent' | 'Video Live' | 'Completed';

export interface InboundShipment {
  id: string;
  name: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: 'Draft' | 'Working' | 'Shipped' | 'Receiving' | 'Closed';
  items: { productId: string; sku: string; name: string; quantity: number; boxes: number }[];
  totalWeight: number;
  totalVolume: number;
  createdDate: string;
  /* Added missing properties used in mock data */
  carrier?: string;
  trackingNumber?: string;
  shippedDate?: string;
  eta?: string;
}

export interface AdCampaign {
  id: string;
  name: string;
  platform: 'TikTok' | 'Amazon' | 'Meta' | 'Google';
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
  tags?: string[];
  videoUrl?: string;
}
