import { AccountLedgerType } from "./accounting";
import { CustomerLedgerType, CustomerType } from "./customer";
import { ProductItemType } from "./inventory";
import { AgencyType, BranchType } from "./store";

export interface SalesReturnTypeAtCreation {
  bill: number;
  products: number[];
}

export interface SalesReturnType {
  id: number;
  timestamp: string;
  number: string;
  bill: number;
  products: ProductItemType[];
}
export interface BillTypeAtCreation {
  date: string;
  customer: number;
  po_number: string;
  products: any[];
  payments: any[];
  use_previous_balance: boolean;
}

export interface BillType {
  number: string;
  date: string;
  customer: CustomerType;
  po_number: string;
  products: ProductItemType[];
  subtotal: number;
  total: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundoff: number;
  payable: number;
  payments: AccountLedgerType[];
  ledger: CustomerLedgerType[];
  use_previous_balance: boolean;
  agency: number | AgencyType;
  branch: number | BranchType;
  id: number;
}


export interface SalesReturnFromDBType {
  id: number;
  date: string;
  number: string;
  bill: BillType;
  products: ProductItemType[];
  customer: CustomerType;
  ledger: CustomerLedgerType;
  total: number;
}
