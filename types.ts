
export type Page = 'dashboard' | 'inventory' | 'orders' | 'customers' | 'intelligence' | 'settings' | 'finance' | 'tracking' | 'calendar' | 'marketing' | 'analytics' | 'replenishment' | 'suppliers' | 'inbound' | 'integrations';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff';
  avatar?: string;
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

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  level: 'Standard' | 'VIP' | 'Partner' | 'Blocked';
  source: string;
  totalSpend: number;
  ordersCount: number;
  status: 'Active' | 'Inactive';
  lastOrderDate: string;
  notes?: string;
  avatarColor?: string;
}

export interface Integration {
    id: string;
    platform: 'Amazon' | 'TikTok' | 'Shopify' | 'WooCommerce' | 'eBay';
    name: string;
    region?: string;
    status: 'connected' | 'disconnected' | 'error' | 'syncing';
    lastSync: string;
    icon?: string;
}

export interface Warehouse {
    id: string;
    name: string;
    type: 'FBA' | 'Local' | '3PL';
    region: string;
    capacity?: number;
    bins?: WarehouseBin[]; // NEW
}

// NEW: Warehouse Bin Logic
export interface WarehouseBin {
    id: string;
    code: string; // e.g., A-01-01
    zone: 'A' | 'B' | 'C' | 'Receiving' | 'Packing';
    status: 'Empty' | 'Partial' | 'Full' | 'Blocked';
    items: { sku: string; qty: number }[];
}

export interface InventoryRecord {
    warehouseId: string;
    quantity: number;
    reserved: number; 
    inbound: number; 
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  image?: string; // NEW: Product Image
  tags?: string[]; 
  category: string;
  stock: number; 
  inventoryBreakdown: InventoryRecord[]; 
  price: number;
  status: 'active' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
  deletedAt?: string; 
  dailyBurnRate?: number; 
  lifecycle?: 'New' | 'Growing' | 'Stable' | 'Clearance';
  supplier?: string; 
  supplierId?: string; 
  supplierContact?: string;
  costPrice?: number;
  leadTime?: number; 
  safetyStockDays?: number;
  dimensions?: { l: number; w: number; h: number }; 
  itemsPerBox?: number;
  unitWeight?: number; 
  logistics?: {
    method: 'Air' | 'Sea';
    carrier: string;
    trackingNo: string;
    unitFreightCost: number;
    targetWarehouse: string;
  };
  economics?: {
    platformFeePercent: number;
    creatorFeePercent: number;
    fixedCost: number;
    lastLegShipping: number;
    adCost: number;
    refundRatePercent?: number; 
    competitorUrl?: string;
  };
  binLocation?: string; // NEW
}

export interface OrderLineItem {
    productId: string;
    sku: string;
    quantity: number;
    price: number;
}

export interface Order {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  itemsCount: number; 
  lineItems?: OrderLineItem[]; 
  paymentStatus?: 'paid' | 'unpaid';
  shippingMethod?: string;
  trackingNumber?: string;
  automationTags?: string[]; // NEW
  deletedAt?: string;
}

export interface PurchaseOrder {
    id: string;
    supplier: string;
    supplierId?: string;
    date: string;
    expectedArrival: string;
    status: 'draft' | 'ordered' | 'received' | 'cancelled';
    totalAmount: number;
    targetWarehouseId: string; 
    items: {
        productId: string;
        sku: string;
        name: string;
        quantity: number;
        unitCost: number;
    }[];
    notes?: string;
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
    platform: 'Amazon' | 'TikTok' | 'Meta';
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
    objective?: 'Sales' | 'Traffic' | 'Awareness'; 
    bidStrategy?: 'Auto' | 'MaxConversion' | 'TargetROAS'; 
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
    email?: string;
    tags?: string[];
    
    // Sample Info
    sampleProductSku?: string;
    sampleDate?: string;
    sampleCost?: number; 
    
    // Performance
    videoUrl?: string;
    videoViews?: number;
    generatedSales?: number; 
    roi?: number; 
}

export interface ReplenishmentItem extends Omit<Product, 'status'> {
  status: 'OOS' | 'Urgent' | 'OK';
  dailyBurnRate: number; 
  daysRemaining: number;
  safetyStock: number;
  suggestedReorder: number;
  supplierLeadTime: number; 
  targetWarehouseId?: string; 
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  lowStockAlerts: number;
}

export interface SalesData {
  name: string;
  value: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export type PaymentMethod = 'Bank' | 'PayPal' | 'Payoneer' | 'AliPay' | 'WeChat' | 'CreditCard' | 'Cash' | 'LianLian' | 'PingPong';

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: 'Revenue' | 'COGS' | 'Logistics' | 'Marketing' | 'Software' | 'Office' | 'Payroll' | 'Other';
  amount: number;
  currency: 'USD' | 'CNY';
  description: string;
  status: 'completed' | 'pending';
  paymentMethod?: PaymentMethod;
  attachment?: string;
  tags?: string[]; // Ensure this exists
  relatedOrderId?: string; 
  relatedPOId?: string; 
}

export interface LogisticsEvent {
  date: string;
  time: string;
  location: string;
  description: string;
  status: 'Normal' | 'Exception' | 'Delivered' | 'InTransit';
}

export interface Shipment {
  id: string;
  trackingNo: string;
  carrier: 'DHL' | 'FedEx' | 'UPS' | 'USPS' | 'Matson' | 'Cosco' | 'Other';
  status: 'In Transit' | 'Delivered' | 'Exception' | 'Pending';
  origin: string;
  destination: string;
  estimatedDelivery: string;
  events: LogisticsEvent[];
  productName?: string;
  lastUpdate: string;
}

export type EventType = 'logistics' | 'marketing' | 'finance' | 'product' | 'holiday' | 'stockout';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; 
  type: EventType;
  description?: string;
  autoGenerated?: boolean;
  sku?: string;
}

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
}

// NEW: Automation Rule
export interface AutomationRule {
    id: string;
    name: string;
    active: boolean;
    trigger: 'Order Created' | 'Order Paid';
    conditions: { field: string; operator: '>' | '<' | '==' | 'contains'; value: any }[];
    action: { type: 'Add Tag' | 'Set Status' | 'Send Email'; value: string };
    executions: number;
}
