export type UserRole = 'admin' | 'warehouse_staff' | 'client';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Order {
  id: string;
  order_id: string; // WH-XXXX
  client_id: string;
  client_name: string;
  status: 'pending' | 'received' | 'processing' | 'completed';
  received_date: string | null;
  boxes_received: boolean;
  box_dimensions: string | null;
  box_weight: number | null;
  created_at: string;
  updated_at: string;
  skus: OrderSKU[];
}

export interface OrderSKU {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  fnsku_labeling: boolean;
  box_handling: boolean;
  polybagging: boolean;
}

export interface InventoryItem {
  id: string;
  client_id: string;
  sku_name: string;
  quantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  location: string | null;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  client_id: string;
  client_name: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  created_at: string;
  line_items: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  invoice_number: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  payment_method: string;
  paid_at: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
  options?: ChatOption[];
  inputType?: 'text' | 'date' | 'file' | 'select';
}

export interface ChatOption {
  label: string;
  value: string;
}

export type ChatState =
  | 'welcome'
  | 'ask_boxes_received'
  | 'ask_received_date'
  | 'ask_client_name'
  | 'ask_sku_name'
  | 'ask_fnsku'
  | 'ask_box_handling'
  | 'ask_polybagging'
  | 'ask_quantity'
  | 'ask_another_sku'
  | 'confirm_order'
  | 'order_created'
  | 'pending_order';

export interface ChatSessionData {
  state: ChatState;
  boxesReceived: boolean;
  receivedDate: string;
  clientName: string;
  skus: Partial<OrderSKU>[];
  currentSku: Partial<OrderSKU>;
}

export interface PricingSettings {
  fnsku_fee: number;
  box_handling_fee: number;
  polybagging_fee: number;
  storage_fee_per_unit: number;
}
