import type { Order, InventoryItem, Invoice, Payment } from '@/types';

export const mockOrders: Order[] = [
  {
    id: '1', order_id: 'WH-1001', client_id: '3', client_name: 'Acme Corp',
    status: 'completed', received_date: '2026-04-08', boxes_received: true,
    box_dimensions: '12x10x8 in', box_weight: 15.5, created_at: '2026-04-08T10:00:00Z',
    updated_at: '2026-04-09T14:00:00Z',
    skus: [
      { id: 's1', order_id: 'WH-1001', product_name: 'Widget A', quantity: 100, fnsku_labeling: true, box_handling: true, polybagging: false },
      { id: 's2', order_id: 'WH-1001', product_name: 'Gadget B', quantity: 50, fnsku_labeling: true, box_handling: true, polybagging: true },
    ]
  },
  {
    id: '2', order_id: 'WH-1002', client_id: '3', client_name: 'Acme Corp',
    status: 'processing', received_date: '2026-04-09', boxes_received: true,
    box_dimensions: null, box_weight: null, created_at: '2026-04-09T08:00:00Z',
    updated_at: '2026-04-09T08:00:00Z',
    skus: [
      { id: 's3', order_id: 'WH-1002', product_name: 'Sensor C', quantity: 200, fnsku_labeling: true, box_handling: false, polybagging: true },
    ]
  },
  {
    id: '3', order_id: 'WH-1003', client_id: '3', client_name: 'Acme Corp',
    status: 'pending', received_date: null, boxes_received: false,
    box_dimensions: null, box_weight: null, created_at: '2026-04-10T06:00:00Z',
    updated_at: '2026-04-10T06:00:00Z',
    skus: [
      { id: 's4', order_id: 'WH-1003', product_name: 'Module D', quantity: 75, fnsku_labeling: false, box_handling: true, polybagging: false },
    ]
  },
];

export const mockInventory: InventoryItem[] = [
  { id: '1', client_id: '3', sku_name: 'Widget A', quantity: 450, status: 'in_stock', location: 'A-12', updated_at: '2026-04-09T14:00:00Z' },
  { id: '2', client_id: '3', sku_name: 'Gadget B', quantity: 23, status: 'low_stock', location: 'B-03', updated_at: '2026-04-09T14:00:00Z' },
  { id: '3', client_id: '3', sku_name: 'Sensor C', quantity: 200, status: 'in_stock', location: 'C-07', updated_at: '2026-04-09T08:00:00Z' },
  { id: '4', client_id: '3', sku_name: 'Module D', quantity: 0, status: 'out_of_stock', location: 'D-01', updated_at: '2026-04-10T06:00:00Z' },
];

export const mockInvoices: Invoice[] = [
  {
    id: '1', invoice_number: 'INV-001', order_id: 'WH-1001', client_id: '3', client_name: 'Acme Corp',
    amount: 385.00, status: 'paid', due_date: '2026-04-22', created_at: '2026-04-08T10:00:00Z',
    line_items: [
      { id: 'l1', description: 'FNSKU Labeling - Widget A (100 units)', quantity: 100, unit_price: 0.50, total: 50 },
      { id: 'l2', description: 'Box Handling - Widget A', quantity: 100, unit_price: 1.00, total: 100 },
      { id: 'l3', description: 'FNSKU Labeling - Gadget B (50 units)', quantity: 50, unit_price: 0.50, total: 25 },
      { id: 'l4', description: 'Box Handling - Gadget B', quantity: 50, unit_price: 1.00, total: 50 },
      { id: 'l5', description: 'Polybagging - Gadget B', quantity: 50, unit_price: 0.75, total: 37.50 },
      { id: 'l6', description: 'Storage Fee', quantity: 150, unit_price: 0.15, total: 22.50 },
    ]
  },
  {
    id: '2', invoice_number: 'INV-002', order_id: 'WH-1002', client_id: '3', client_name: 'Acme Corp',
    amount: 250.00, status: 'pending', due_date: '2026-04-23', created_at: '2026-04-09T08:00:00Z',
    line_items: [
      { id: 'l7', description: 'FNSKU Labeling - Sensor C (200 units)', quantity: 200, unit_price: 0.50, total: 100 },
      { id: 'l8', description: 'Polybagging - Sensor C', quantity: 200, unit_price: 0.75, total: 150 },
    ]
  },
];

export const mockPayments: Payment[] = [
  { id: '1', invoice_id: '1', invoice_number: 'INV-001', amount: 385.00, status: 'paid', payment_method: 'Bank Transfer', paid_at: '2026-04-10T09:00:00Z', created_at: '2026-04-10T09:00:00Z' },
  { id: '2', invoice_id: '2', invoice_number: 'INV-002', amount: 250.00, status: 'pending', payment_method: 'Pending', paid_at: null, created_at: '2026-04-09T08:00:00Z' },
];

let orderCounter = 1003;
export function generateOrderId() {
  orderCounter++;
  return `WH-${orderCounter}`;
}
