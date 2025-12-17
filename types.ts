
export type Page = 'dashboard' | 'inventory' | 'orders' | 'customers' | 'intelligence' | 'settings' | 'finance' | 'tracking' | 'calendar' | 'marketing' | 'analytics' | 'replenishment' | 'suppliers' | 'integrations' | 'calculator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
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
  boxCount?: number; // Added for manual persistence
  unitWeight?: number;
  logistics?: { 
    method: 'Air' | 'Sea'; 
    carrier: string; 
    trackingNo: string; 
    unitFreightCost: number; 
    totalFreightCost?: number; // Added for manual total override
    billingWeight?: number; // Added for manual billing weight override
    targetWarehouse: string 
  };
  economics?: { platformFeePercent: number; creatorFeePercent: number; fixedCost: number; lastLegShipping: number; adCost: number; refundRatePercent?: number };
  deletedAt?: string;
  // New fields
  image?: string; // Kept for backward compatibility (primary image)
  images?: string[]; // New: Multiple images
  lingXingId?: string;
  notes?: string;
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

export interface SalesData {
  name: string;
  value: number;
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
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Exception';
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

export interface InboundShipmentItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  boxes: number;
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

export type InfluencerStatus = 'To Contact' | 'Sample Sent' | 'Video Live' | 'Completed';

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: 'TikTok' | 'Instagram' | 'YouTube';
  followers: number;
  country: string;
  status: InfluencerStatus;
  sampleProductSku?: string;
  sampleDate?: string;
  sampleCost?: number;
  generatedSales?: number;
  roi?: number;
  tags?: string[];
  videoUrl?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  active: boolean;
  trigger: string;
  conditions: { field: string; operator: string; value: any }[];
  action: { type: string; value: any };
  executions: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  status: 'draft' | 'ordered' | 'shipped' | 'received' | 'cancelled';
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
  createdDate: string;
  expectedDate?: string;
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

export interface Integration {
  id: string;
  platform: 'TikTok' | 'Amazon' | 'Shopify' | 'eBay' | 'WooCommerce' | 'Walmart';
  name: string;
  region: string;
  status: 'connected' | 'error' | 'syncing' | 'disconnected';
  lastSync: string;
}
