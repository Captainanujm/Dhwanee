import { ProductItemType, ProductType } from "src/types/inventory";

export interface SupplierTypeAtCreation {
  name: string;
  number: string;
  address: string;
  gstin: string;
  balance: number;
  state: string;
  branch: number | {name: string, id: number};
}

export interface SupplierType extends SupplierTypeAtCreation {
  id: number;
  agency: number | {name: string, id: number};
}

export interface SupplierBillItemType {
  product: ProductType | null;
  quantity: number | null;
  tax: number | null;
  buying_cgst: number | null;
  buying_igst: number | null;
  buying_sgst: number | null;
  buying_price: number;
}

export interface SupplierLedgerType {
  supplier: number;
  remarks: string;
  balance_before: string;
  balance_after: string;
  amount: string;
  date: string;
  link?: string;
}


export interface SupplierBillExtraExpenseAtCreation {
  description: string;
  amount: number;
  tax_incl: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  total_amount: number;
}

export interface SupplierBillExtraExpense extends SupplierBillExtraExpenseAtCreation {
  id: number;
}

export interface SupplierBillTypeAtCreation {
  number: string;
  date: Date;
  products: (SupplierBillItemType & { product: ProductType })[];
  supplier: number;
  received_status: boolean;
  cash_discount: number;
  cash_discount_type: "percentage" | "amount";
  cgst: number;
  igst: number;
  sgst: number;
  buying_price_gst_incl: boolean;
  extra_expenses: SupplierBillExtraExpenseAtCreation[];
}

export interface SupplierBillType {
  products: number[];
  id: number;
  number: string;
  date: Date;
  supplier: number;
  received_status: boolean;
  cash_discount: number;
  cash_discount_type: "percentage" | "amount";
  cgst: number;
  igst: number;
  sgst: number;
  subtotal: number;
  payable: number;
  buying_price_gst_incl: boolean;
  extra_expenses: SupplierBillExtraExpense[];
}

export interface SupplierBillTypeDeep {
  products: ProductItemType[];
  id: number;
  number: string;
  date: Date;
  supplier: SupplierType;
  received_status: boolean;
  cash_discount: number;
  cash_discount_type: "percentage" | "amount";
  cgst: number;
  igst: number;
  sgst: number;
  subtotal: number;
  payable: number;
  buying_price_gst_incl: boolean;
  ledger: SupplierLedgerType;
  extra_expenses: SupplierBillExtraExpense[];
}

export interface PurchaseReturnTypeAtCreation {
  supplier: number;
  products: number[];
  remarks: string;
}

export interface PurchaseReturnType {
  supplier: SupplierType;
  products: ProductItemType[];
  date: string;
  ledger: SupplierLedgerType;
  remarks: string;
  total: number;
  roundoff: number;
  number: string;
  id: number;
}
