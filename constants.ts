
import { Product, Shipment } from './types';

export const MOCK_SHIPMENTS: Shipment[] = [
    {
        id: 'SH-001',
        trackingNo: '1Z882910AA9921',
        carrier: 'UPS Ground',
        status: 'InTransit',
        origin: 'Shenzhen Warehouse',
        destination: 'LAX Gateway (US)',
        productName: 'Cyber Series Smart Watch',
        lastUpdateAt: '2023-11-20 14:30',
        sku: 'CYB-WATCH-01',
        events: [
            { date: '2023-11-20', time: '14:30', location: 'Anchorage, AK', description: 'Arrived at Sorting Facility', status: 'Normal' },
            { date: '2023-11-19', time: '08:15', location: 'Hong Kong International Hub', description: 'Departed Facility', status: 'Normal' },
            { date: '2023-11-18', time: '18:00', location: 'Shenzhen', description: 'Picked up by Courier', status: 'Normal' }
        ]
    },
    {
        id: 'SH-002',
        trackingNo: 'DHL9900112233',
        carrier: 'DHL Express',
        status: 'Exception',
        origin: 'Ningbo Port',
        destination: 'London Gateway (UK)',
        productName: 'Obsidian Keyboard Pro',
        lastUpdateAt: '2023-11-21 10:00',
        sku: 'OBS-KEY-PRO',
        events: [
            { date: '2023-11-21', time: '10:00', location: 'Customs Clearance Hub', description: 'Hold at Customs - Documentation Required', status: 'Exception' },
            { date: '2023-11-15', time: '14:00', location: 'Singapore Transit Center', description: 'In Transit to Destination', status: 'Normal' }
        ]
    }
];

export const MOCK_PRODUCTS: Product[] = [
    { id: '1', name: 'Cyber Series Smart Watch', sku: 'CYB-WATCH-01', stock: 150, costPrice: 45, price: 129 },
    { id: '2', name: 'Obsidian Keyboard Pro', sku: 'OBS-KEY-PRO', stock: 42, costPrice: 65, price: 199 }
];
