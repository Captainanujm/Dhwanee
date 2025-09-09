import { AgencyType, BranchType } from "./store";

export interface AccountTypeAtCreation {
  name: string;
  balance: number;
  branch: number | BranchType;
}

export interface AccountType extends AccountTypeAtCreation {
  id: number;
  agency: number | AgencyType;
}

export interface AccountLedgerType {
  id: number;
  account: AccountType;
  method?: PaymentMethodType;
  labels: PaymentLabelType[];
  amount: number;
  date: string;
  remarks: string;
  balance_before: number;
  balance_after: number;
  link?: string;
}

export type PaymentMethodLedgerType = AccountLedgerType;
export type PaymentLabelLedgerType = AccountLedgerType;

export interface PaymentMethodTypeAtCreation {
  name: string;
  account: number | AccountType;
  branch: number | BranchType;
}

export interface PaymentMethodType extends PaymentMethodTypeAtCreation {
  id: number;
  agency: number | AgencyType;
}

export interface PaymentLabelTypeAtCreation {
  name: string;
  branch: number | BranchType;
}

export interface PaymentLabelType extends PaymentLabelTypeAtCreation {
  id: number;
  agency: number | AgencyType;
}

export interface TransactionAtCreation {
    account: number;
    method: number;
    labels: number[];
    amount: number;
    date: string;
    remarks: string;
  }
