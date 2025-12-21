
import { Product, Order, SalesData, Customer, Transaction, Shipment, Warehouse, Supplier, InboundShipment, AdCampaign, Influencer } from './types';

export const APP_NAME = "Tanxing.OS";

export const WAREHOUSES: Warehouse[] = [
    { id: 'WH-CN-01', name: 'Shenzhen Warehouse (Local)', type: 'Local', region: 'CN' },
    { id: 'WH-US-FBA', name: 'Amazon FBA (US-West)', type: 'FBA', region: 'US' },
    { id: 'WH-US-3PL', name: 'New Jersey 3PL', type: '3PL', region: 'US' }
];

export const MOCK_INFLUENCERS: Influencer[] = [
    {
        id: 'INF-001',
        name: 'Jessica Tech',
        handle: '@jessicatech_reviews',
        platform: 'TikTok',
        followers: 125000,
        country: 'US',
        status: 'Video Live',
        sampleProductSku: 'CP-Q1M',
        sampleDate: '2023-10-15',
        sampleCost: 25.50, // Product + Shipping
        generatedSales: 450.00,
        roi: 16.6,
        tags: ['Tech', 'Car Accessories']
    },
    {
        id: 'INF-002',
        name: 'David Unbox',
        handle: '@dave_unboxing',
        platform: 'YouTube',
        followers: 45000,
        country: 'UK',
        status: 'Sample Sent',
        sampleProductSku: 'K7500-G',
        sampleDate: '2023-10-24',
        sampleCost: 35.00,
        generatedSales: 0,
        tags: ['Gaming', 'Keyboard']
    },
    {
        id: 'INF-003',
        name: 'Sarah Vlogs',
        handle: '@sarah_daily',
        platform: 'TikTok',
        followers: 890000,
        country: 'US',
        status: 'To Contact',
        tags: ['Lifestyle', 'Vlog']
    },
    {
        id: 'INF-004',
        name: 'Mike Gadgets',
        handle: '@mike_gadget_lab',
        platform: 'Instagram',
        followers: 67000,
        country: 'DE',
        status: 'Completed',
        sampleProductSku: 'MG-PRO-01',
        sampleDate: '2023-09-20',
        sampleCost: 12.00,
        generatedSales: 1200.00,
        roi: 99.0, // High ROI
        videoUrl: 'https://instagram.com/p/xyz',
        tags: ['Gadgets']
    }
];

export const MOCK_AD_CAMPAIGNS: AdCampaign[] = [
    { id: 'CMP-001', name: 'Summer Vibes - Broad', platform: 'TikTok', status: 'Active', budget: 50, spend: 1250, sales: 4500, acos: 27.7, roas: 3.6, clicks: 850, impressions: 45000, ctr: 1.88, cpc: 1.47 },
    { id: 'CMP-002', name: 'K7500 Keyboard Launch', platform: 'Amazon', status: 'Active', budget: 100, spend: 3200, sales: 12800, acos: 25.0, roas: 4.0, clicks: 1200, impressions: 32000, ctr: 3.75, cpc: 2.66 },
    { id: 'CMP-003', name: 'Retargeting - Cart Abandoners', platform: 'Meta', status: 'Paused', budget: 30, spend: 450, sales: 900, acos: 50.0, roas: 2.0, clicks: 150, impressions: 8000, ctr: 1.87, cpc: 3.00 },
    { id: 'CMP-004', name: 'Exact Match - "Mechanical Keyboard"', platform: 'Amazon', status: 'Active', budget: 80, spend: 1500, sales: 7500, acos: 20.0, roas: 5.0, clicks: 500, impressions: 12000, ctr: 4.16, cpc: 3.00 },
];

export const MOCK_INBOUND_SHIPMENTS: InboundShipment[] = [
    {
        id: 'FBA17G8K9L',
        name: 'Restock Oct 25 - Sea',
        // Fix: Added missing required 'method' property
        method: 'Sea',
        sourceWarehouseId: 'WH-CN-01',
        destinationWarehouseId: 'WH-US-FBA',
        status: 'Shipped', // Working -> Shipped -> In Transit -> Closed
        items: [
            /* Added unitPrice, rowTotalWeight, and freightRate to match InboundShipmentItem type */
            { productId: '2', sku: 'CP-Q1M', name: 'Carplay Q1M', quantity: 200, boxes: 5, unitPrice: 39.60, rowTotalWeight: 40, freightRate: 35 },
            { productId: '3', sku: 'BOX2-NEW', name: 'AI BOX2', quantity: 500, boxes: 25, unitPrice: 68.56, rowTotalWeight: 300, freightRate: 8 },
        ],
        totalWeight: 340,
        totalVolume: 1.2,
        carrier: 'Matson',
        trackingNumber: 'MAT-882910',
        createdDate: '2023-10-20',
        shippedDate: '2023-10-22',
        eta: '2023-11-15'
    },
    {
        id: 'FBA17H2J3M',
        name: 'Urgent Air - K7500',
        // Fix: Added missing required 'method' property
        method: 'Air',
        sourceWarehouseId: 'WH-CN-01',
        destinationWarehouseId: 'WH-US-FBA',
        status: 'Working',
        items: [
            /* Added unitPrice, rowTotalWeight, and freightRate to match InboundShipmentItem type */
            { productId: '4', sku: 'K7500-G', name: 'K7500-B 机械键盘', quantity: 50, boxes: 5, unitPrice: 42.22, rowTotalWeight: 60, freightRate: 40 },
        ],
        totalWeight: 60,
        totalVolume: 0.25,
        createdDate: '2023-10-26'
    }
];

export const MOCK_SUPPLIERS: Supplier[] = [
    {
        id: 'SUP-001',
        name: '深圳科技工厂',
        contactName: 'Mr. Zhang',
        email: 'zhang@sztech.com',
        phone: '+86 138-0000-1111',
        address: 'Baoan District, Shenzhen, CN',
        category: 'Electronics',
        rating: 4.5,
        paymentTerms: '30% Deposit, 70% Ship',
        status: 'Active',
        leadTime: 15
    },
    {
        id: 'SUP-002',
        name: '广州制衣厂',
        contactName: 'Ms. Li',
        email: 'sales@gzgarment.com',
        phone: '+86 139-2222-3333',
        address: 'Baiyun District, Guangzhou, CN',
        category: 'Apparel',
        rating: 4.0,
        paymentTerms: 'Net 30',
        status: 'Active',
        leadTime: 25
    },
    {
        id: 'SUP-003',
        name: '义乌小商品',
        contactName: 'Boss Wang',
        email: 'wang@yiwu.com',
        phone: '+86 137-4444-5555',
        address: 'Yiwu International Trade City',
        category: 'Accessories',
        rating: 3.5,
        paymentTerms: '100% Prepaid',
        status: 'Active',
        leadTime: 7
    },
    {
        id: 'SUP-004',
        name: 'Dongguan Precision Mold',
        contactName: 'Engineer Chen',
        email: 'chen@precision.com',
        phone: '+86 136-6666-7777',
        address: 'Dongguan, CN',
        category: 'Manufacturing',
        rating: 5.0,
        paymentTerms: '50% Deposit',
        status: 'Active',
        leadTime: 45
    }
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'C-001',
    name: 'Sarah Jenkins',
    company: 'BestGadgets LLC',
    email: 'sarah@bestgadgets.com',
    phone: '+1 (555) 123-4567',
    level: 'VIP',
    source: 'Shopify',
    totalSpend: 45200.00,
    ordersCount: 15,
    status: 'Active',
    lastOrderDate: '2023-10-25',
    notes: 'Key wholesale partner for East Coast region.',
    avatarColor: 'bg-purple-500'
  },
  {
    id: 'C-002',
    name: 'Mike Chen',
    company: 'TechFlow Influencers',
    email: 'mike.c@techflow.net',
    phone: '+86 138-0000-0000',
    level: 'Partner',
    source: 'TikTok',
    totalSpend: 8900.50,
    ordersCount: 42,
    status: 'Active',
    lastOrderDate: '2023-10-24',
    notes: 'Top tier affiliate marketer. Sends high volume traffic.',
    avatarColor: 'bg-indigo-500'
  },
  {
    id: 'C-003',
    name: 'Amazon FBA Procurement',
    company: 'Amazon US',
    email: 'fba-inbound@amazon.com',
    phone: 'N/A',
    level: 'Standard',
    source: 'Amazon',
    totalSpend: 125000.00,
    ordersCount: 8,
    status: 'Active',
    lastOrderDate: '2023-10-20',
    notes: 'Automated FBA replenishment account.',
    avatarColor: 'bg-orange-500'
  },
  {
    id: 'C-004',
    name: 'David Smith',
    company: 'Individual',
    email: 'david.smith88@gmail.com',
    phone: '+1 (555) 987-6543',
    level: 'Standard',
    source: 'Shopify',
    totalSpend: 129.99,
    ordersCount: 1,
    status: 'Inactive',
    lastOrderDate: '2023-09-15',
    notes: 'Refund requested on last order.',
    avatarColor: 'bg-slate-500'
  }
];

export const MOCK_PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'MAD ACID 赛博朋克卫衣', 
    sku: 'MA-001', 
    category: '潮流服饰', 
    stock: 42, 
    inventoryBreakdown: [
        { warehouseId: 'WH-CN-01', quantity: 30, reserved: 0, inbound: 100 },
        { warehouseId: 'WH-US-FBA', quantity: 12, reserved: 0, inbound: 50 },
    ],
    price: 16.99, 
    status: 'active', 
    lastUpdated: '2023-10-25',
    dailyBurnRate: 3.5, 
    lifecycle: 'Growing',
    supplier: '广州制衣厂',
    supplierId: 'SUP-002',
    supplierContact: '微信: gz_garment',
    costPrice: 6.50,
    leadTime: 30,
    safetyStockDays: 15,
    dimensions: { l: 40, w: 30, h: 5 },
    itemsPerBox: 50,
    unitWeight: 0.4,
    logistics: { method: 'Air', carrier: 'DHL', trackingNo: 'HK-882910', unitFreightCost: 2.5, targetWarehouse: 'US-WEST-01' },
    economics: { platformFeePercent: 5, creatorFeePercent: 10, fixedCost: 0.5, lastLegShipping: 3.5, adCost: 2.0 }
  },
  { 
    id: '2', 
    name: 'Carplay Q1M 智能车盒', 
    sku: 'CP-Q1M', 
    category: '数码电子', 
    stock: 200,
    inventoryBreakdown: [
        { warehouseId: 'WH-CN-01', quantity: 100, reserved: 5, inbound: 0 },
        { warehouseId: 'WH-US-FBA', quantity: 80, reserved: 10, inbound: 200 },
        { warehouseId: 'WH-US-3PL', quantity: 20, reserved: 0, inbound: 0 },
    ], 
    price: 39.60, 
    status: 'active', 
    lastUpdated: '2023-10-24',
    dailyBurnRate: 12.0, 
    lifecycle: 'Stable',
    supplier: '深圳科技工厂',
    supplierId: 'SUP-001',
    supplierContact: 'email: sales@sztech.com',
    costPrice: 18.00,
    leadTime: 25,
    safetyStockDays: 10,
    dimensions: { l: 15, w: 10, h: 5 },
    itemsPerBox: 40,
    unitWeight: 0.2,
    logistics: { method: 'Air', carrier: 'UPS', trackingNo: 'UPS-99210', unitFreightCost: 1.2, targetWarehouse: 'US-EAST-02' },
    economics: { platformFeePercent: 5, creatorFeePercent: 15, fixedCost: 1.0, lastLegShipping: 4.0, adCost: 5.0 }
  },
  { 
    id: '3', 
    name: 'AI BOX2 (Fan Edition)', 
    sku: 'BOX2-NEW', 
    category: '数码电子', 
    stock: 150,
    inventoryBreakdown: [
        { warehouseId: 'WH-CN-01', quantity: 150, reserved: 0, inbound: 0 },
        { warehouseId: 'WH-US-FBA', quantity: 0, reserved: 0, inbound: 500 },
    ], 
    price: 68.56, 
    status: 'active', 
    lastUpdated: '2023-10-20',
    dailyBurnRate: 8.0, 
    lifecycle: 'New',
    supplier: 'AI 芯片科技',
    supplierId: 'SUP-001',
    supplierContact: '钉钉: 882190',
    costPrice: 32.00,
    leadTime: 35,
    safetyStockDays: 20,
    dimensions: { l: 20, w: 15, h: 8 },
    itemsPerBox: 20,
    unitWeight: 0.6,
    logistics: { method: 'Sea', carrier: 'Matson', trackingNo: 'SEA-22100', unitFreightCost: 0.8, targetWarehouse: 'US-WEST-01' },
    economics: { platformFeePercent: 5, creatorFeePercent: 12, fixedCost: 1.5, lastLegShipping: 4.5, adCost: 8.0 }
  },
  { 
    id: '4', 
    name: 'K7500-B 机械键盘', 
    sku: 'K7500-G', 
    category: '数码电子', 
    stock: 0, 
    inventoryBreakdown: [
        { warehouseId: 'WH-CN-01', quantity: 0, reserved: 0, inbound: 0 },
        { warehouseId: 'WH-US-FBA', quantity: 0, reserved: 0, inbound: 0 },
    ],
    price: 42.22, 
    status: 'out_of_stock', 
    lastUpdated: '2023-10-22',
    dailyBurnRate: 0, 
    lifecycle: 'Clearance',
    supplier: 'Keychron 代工',
    supplierId: 'SUP-004',
    supplierContact: 'email: key@oem.com',
    costPrice: 22.00,
    leadTime: 40,
    safetyStockDays: 0,
    dimensions: { l: 45, w: 20, h: 5 },
    itemsPerBox: 10,
    unitWeight: 1.2,
    logistics: { method: 'Sea', carrier: 'Cosco', trackingNo: 'CO-9921', unitFreightCost: 2.0, targetWarehouse: 'US-WEST-01' },
    economics: { platformFeePercent: 5, creatorFeePercent: 8, fixedCost: 2.0, lastLegShipping: 6.0, adCost: 3.0 }
  },
  { 
    id: '5', 
    name: 'Magsafe 磁吸支架 Pro', 
    sku: 'MG-PRO-01', 
    category: '手机配件', 
    stock: 8, 
    inventoryBreakdown: [
        { warehouseId: 'WH-CN-01', quantity: 5, reserved: 0, inbound: 0 },
        { warehouseId: 'WH-US-FBA', quantity: 3, reserved: 0, inbound: 0 },
    ],
    price: 12.50, 
    status: 'low_stock', 
    lastUpdated: '2023-10-26',
    dailyBurnRate: 2.0,
    lifecycle: 'Stable',
    supplier: '义乌小商品',
    supplierId: 'SUP-003',
    supplierContact: '微信: yiwu_boss',
    costPrice: 2.50,
    leadTime: 15,
    safetyStockDays: 30,
    dimensions: { l: 8, w: 8, h: 2 },
    itemsPerBox: 200,
    unitWeight: 0.05,
    logistics: { method: 'Air', carrier: 'FedEx', trackingNo: 'FX-1120', unitFreightCost: 0.5, targetWarehouse: 'US-EAST-01' },
    economics: { platformFeePercent: 5, creatorFeePercent: 20, fixedCost: 0.2, lastLegShipping: 3.0, adCost: 1.5 }
  },
];

export const MOCK_ORDERS: Order[] = [
  { 
      id: 'PO-2023-8821', 
      customerName: 'Amazon FBA US', 
      date: '2023-10-26', 
      total: 4250, 
      status: 'processing', 
      itemsCount: 120,
      lineItems: [
          { productId: '2', sku: 'CP-Q1M', quantity: 100, price: 39.60 },
          { productId: '5', sku: 'MG-PRO-01', quantity: 20, price: 12.50 }
      ]
  },
  { 
      id: 'PO-2023-8822', 
      customerName: 'Shopify Store', 
      date: '2023-10-26', 
      total: 128.50, 
      status: 'pending', 
      itemsCount: 3,
      lineItems: [
          { productId: '1', sku: 'MA-001', quantity: 3, price: 16.99 }
      ]
  },
  { 
      id: 'PO-2023-8820', 
      customerName: 'TikTok Shop UK', 
      date: '2023-10-25', 
      total: 856.00, 
      status: 'shipped', 
      itemsCount: 25,
      lineItems: [
          { productId: '3', sku: 'BOX2-NEW', quantity: 25, price: 68.56 }
      ]
  },
  { id: 'PO-2023-8819', customerName: 'Walmart DS', date: '2023-10-24', total: 64.00, status: 'delivered', itemsCount: 1 },
  { id: 'PO-2023-8815', customerName: 'TikTok Shop US', date: '2023-10-23', total: 245.00, status: 'pending', itemsCount: 5 },
  { id: 'PO-2023-8812', customerName: 'Independent Site', date: '2023-10-22', total: 1100.00, status: 'processing', itemsCount: 32 },
];

export const SALES_DATA: SalesData[] = [
  { name: '周一', value: 2400 },
  { name: '周二', value: 1398 },
  { name: '周三', value: 9800 },
  { name: '周四', value: 3908 },
  { name: '周五', value: 4800 },
  { name: '周六', value: 3800 },
  { name: '周日', value: 4300 },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TRX-1001', date: '2023-10-26', type: 'income', category: 'Revenue', amount: 4250.00, currency: 'USD', description: 'Amazon Settlement Report #8821', status: 'completed', paymentMethod: 'Payoneer' },
  { id: 'TRX-1002', date: '2023-10-25', type: 'expense', category: 'Logistics', amount: 12000.00, currency: 'CNY', description: 'DHL Air Freight Batch A12', status: 'completed', paymentMethod: 'Bank' },
  { id: 'TRX-1003', date: '2023-10-25', type: 'expense', category: 'COGS', amount: 8500.00, currency: 'CNY', description: 'Supplier Payment - Shenzhen Tech', status: 'completed', paymentMethod: 'AliPay' },
  { id: 'TRX-1004', date: '2023-10-24', type: 'income', category: 'Revenue', amount: 856.00, currency: 'USD', description: 'TikTok Shop Payout', status: 'completed', paymentMethod: 'PingPong' },
  { id: 'TRX-1005', date: '2023-10-24', type: 'expense', category: 'Marketing', amount: 500.00, currency: 'USD', description: 'TikTok Ads Prepaid', status: 'completed', paymentMethod: 'PayPal' },
  { id: 'TRX-1006', date: '2023-10-23', type: 'expense', category: 'Software', amount: 29.00, currency: 'USD', description: 'Shopify Subscription', status: 'completed', paymentMethod: 'CreditCard' },
  { id: 'TRX-1007', date: '2023-10-22', type: 'expense', category: 'Payroll', amount: 15000.00, currency: 'CNY', description: 'Monthly Staff Payroll', status: 'pending', paymentMethod: 'Bank' },
];

export const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: 'SH-001',
    trackingNo: 'HK-882910',
    carrier: 'DHL',
    status: '运输中',
    origin: 'Shenzhen, CN',
    destination: 'Los Angeles, US',
    estimatedDelivery: '2023-10-28',
    productName: 'MAD ACID 赛博朋克卫衣',
    lastUpdate: 'Arrived at Sorting Hub',
    events: [
        { date: '2023-10-26', time: '14:30', location: 'Los Angeles Gateway', description: 'Arrived at Sort Facility', status: 'InTransit' },
        { date: '2023-10-26', time: '08:15', location: 'Hong Kong Hub', description: 'Departed Facility', status: 'InTransit' },
        { date: '2023-10-25', time: '18:00', location: 'Shenzhen', description: 'Picked up by Courier', status: 'Normal' },
    ]
  },
  {
    id: 'SH-002',
    trackingNo: 'SEA-22100',
    carrier: 'Matson',
    status: '异常',
    origin: 'Ningbo, CN',
    destination: 'Long Beach, US',
    estimatedDelivery: '2023-11-05',
    productName: 'AI BOX2 (Fan Edition)',
    lastUpdate: 'Customs Clearance Delay',
    events: [
        { date: '2023-10-25', time: '10:00', location: 'Long Beach Port', description: 'Held at Customs - Doc Required', status: 'Exception' },
        { date: '2023-10-15', time: '14:00', location: 'Pacific Ocean', description: 'In Transit to US', status: 'InTransit' },
        { date: '2023-10-10', time: '09:00', location: 'Ningbo Port', description: 'Vessel Departed', status: 'Normal' },
    ]
  },
  {
    id: 'SH-003',
    trackingNo: 'UPS-99210',
    carrier: 'UPS',
    status: '已送达',
    origin: 'Dongguan, CN',
    destination: 'New York, US',
    estimatedDelivery: '2023-10-24',
    productName: 'Carplay Q1M',
    lastUpdate: 'Delivered to Front Porch',
    events: [
        { date: '2023-10-24', time: '15:20', location: 'New York, NY', description: 'Delivered', status: 'Delivered' },
        { date: '2023-10-24', time: '07:30', location: 'New York, NY', description: 'Out for Delivery', status: 'InTransit' },
        { date: '2023-10-22', time: '22:00', location: 'Louisville, KY', description: 'Departed Hub', status: 'InTransit' },
    ]
  }
];
