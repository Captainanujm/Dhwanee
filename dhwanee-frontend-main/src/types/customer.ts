import { AgencyType, BranchType } from "./store";

export interface CustomerTypeAtCreation {
  name: string;
  number: string;
  address: string;
  shipping_address: string;
  gstin: string;
  balance: number;
  state: string;
  markdown: number;
  branch: number | BranchType;
}

export interface CustomerType extends CustomerTypeAtCreation {
  id: number;
  agency: number | AgencyType;
}

export interface CustomerLedgerType {
  customer: number;
  remarks: string;
  balance_before: string;
  balance_after: string;
  amount: string;
  date: string;
  link?: string;
}
