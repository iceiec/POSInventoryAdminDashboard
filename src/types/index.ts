export interface Item {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  description?: string;
  price: number;
  cost: number;
  stock: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  onSale: boolean;
  compositeItem: boolean;
  trackStock: boolean;
  color: string;
  shape: string;
  variants: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  color: string;
  itemCount: number;
  activeModifiers: number;
  createdAt: string;
  updatedAt: string;
}

export interface Modifier {
  _id: string;
  name: string;
  price: number;
  appliesTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface Discount {
  _id: string;
  name: string;
  type: "percentage" | "amount";
  value: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface SaleItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  cost: number;
}

export interface Sale {
  _id: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  discountLabel?: string;
  total: number;
  paymentMethod: "cash" | "card" | "wallet";
  amountReceived?: number;
  change?: number;
  customerName?: string;
  createdAt: string;
}

export interface MetricData {
  grossSales: number;
  refunds: number;
  discounts: number;
  netSales: number;
  grossProfit: number;
}

export interface MetricChange {
  grossSales: number;
  refunds: number;
  discounts: number;
  netSales: number;
  grossProfit: number;
}

export interface SalesTrendPoint {
  date: string;
  sales: number;
  profit: number;
}

export interface CategorySalesPoint {
  name: string;
  value: number;
  color: string;
}

export interface PaymentSalesPoint {
  name: string;
  value: number;
  color: string;
}

export interface ReceiptPoint {
  date: string;
  count: number;
  total: number;
}

export interface DiscountUsagePoint {
  name: string;
  usage: number;
  total: number;
}

export interface TopItemPoint {
  name: string;
  sold: number;
  revenue: number;
}

export interface Analytics {
  metrics: MetricData;
  metricsChange: MetricChange;
  salesTrend: SalesTrendPoint[];
  salesByCategory: CategorySalesPoint[];
  salesByPayment: PaymentSalesPoint[];
  receiptData: ReceiptPoint[];
  discountData: DiscountUsagePoint[];
  topItems: TopItemPoint[];
}

export interface ApiError {
  message: string;
  status?: number;
}

export type ItemCreateInput = Omit<Item, "_id" | "stock" | "status" | "createdAt" | "updatedAt">;
export type CategoryCreateInput = Pick<Category, "name" | "color">;
export type ModifierCreateInput = Pick<Modifier, "name" | "price" | "appliesTo">;
export type DiscountCreateInput = Pick<Discount, "name" | "type" | "value">;
