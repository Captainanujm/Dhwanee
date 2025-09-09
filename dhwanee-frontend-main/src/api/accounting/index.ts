import ACCOUNTING from "./endpoints";
import { deleteApi, getFromApi, postToApi } from "src/api";
import {
  AccountType,
  AccountTypeAtCreation,
  PaymentMethodLedgerType,
  PaymentMethodType,
  PaymentMethodTypeAtCreation,
  PaymentLabelType,
  PaymentLabelLedgerType,
  PaymentLabelTypeAtCreation,
  AccountLedgerType,
  TransactionAtCreation,
} from "src/types/accounting";
import PaginatedResponse from "src/types/paginated-response";

export const createAccount = (token: string, data: AccountTypeAtCreation) => {
  return postToApi<AccountType>(ACCOUNTING.ACCOUNTS.ALL, token, data);
};

export const listAccount = (
  token: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<AccountType>>(
    ACCOUNTING.ACCOUNTS.ALL,
    token,
    {
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const searchAccounts = (
  token: string,
  search: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<AccountType>>(
    ACCOUNTING.ACCOUNTS.SEARCH,
    token,
    {
      q: search,
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const getOneAccount = (token: string, id: number | string) => {
  return getFromApi<AccountType>(`${ACCOUNTING.ACCOUNTS.ALL}${id}/`, token);
};

export const getAccountLedger = (
  token: string,
  id: number | string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<any>>(
    `${ACCOUNTING.ACCOUNTS.LEDGER.replace("{{id}}", id.toString())}`,
    token,
    {
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const createPaymentMethod = (
  token: string,
  data: PaymentMethodTypeAtCreation
) => {
  return postToApi<PaymentMethodType>(ACCOUNTING.METHODS.ALL, token, data);
};

export const listPaymentMethod = (
  token: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<PaymentMethodType>>(
    ACCOUNTING.METHODS.ALL,
    token,
    {
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const searchPaymentMethods = (
  token: string,
  search: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<PaymentMethodType>>(
    ACCOUNTING.METHODS.SEARCH,
    token,
    {
      q: search,
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const getOnePaymentMethod = (token: string, id: number | string) => {
  return getFromApi<PaymentMethodType>(
    `${ACCOUNTING.METHODS.ALL}${id}/`,
    token
  );
};

export const getPaymentMethodLedger = (
  token: string,
  id: number | string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<PaymentMethodLedgerType>>(
    `${ACCOUNTING.METHODS.LEDGER.replace("{{id}}", id.toString())}`,
    token,
    {
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const createLabel = (
  token: string,
  data: PaymentLabelTypeAtCreation
) => {
  return postToApi<PaymentLabelType>(ACCOUNTING.LABELS.ALL, token, data);
};

export const listLabel = (
  token: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<PaymentLabelType>>(
    ACCOUNTING.LABELS.ALL,
    token,
    {
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const searchLabels = (
  token: string,
  search: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<PaymentLabelType>>(
    ACCOUNTING.LABELS.SEARCH,
    token,
    {
      q: search,
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const getOneLabel = (token: string, id: number | string) => {
  return getFromApi<PaymentLabelType>(`${ACCOUNTING.LABELS.ALL}${id}/`, token);
};

export const getLabelLedger = (
  token: string,
  id: number | string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<PaymentLabelLedgerType>>(
    `${ACCOUNTING.LABELS.LEDGER.replace("{{id}}", id.toString())}`,
    token,
    {
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};
type _filterParams = Partial<{
  name: string;
  account: number[];
  method: number[];
  label: number[];
  from_date: number;
  to_date: number;
  all: string;
  paginated: {
    page: number;
    rows_per_page: number;
  };
}>;

export const filterTransactions = (
  token: string,
  searchParams: _filterParams
) => {
  var params: { [index: string]: string } = {};
  Object.keys(searchParams).forEach((el) => {
    if (el === "paginated") {
      params.limit =
        searchParams[el as "paginated"]?.rows_per_page.toString() || "1";
      params.offset = (
        ((searchParams[el as "paginated"]?.page || 1) - 1) *
        (searchParams[el as "paginated"]?.rows_per_page || 10)
      ).toString();
    } else if (typeof searchParams[el as keyof _filterParams] === "object")
      params[el] = (searchParams[el as keyof _filterParams] as number[]).join(
        ","
      );
    else if (typeof searchParams[el as keyof _filterParams] === "number")
      params[el] = (
        searchParams[el as keyof _filterParams] as number
      ).toString();
    else params[el] = searchParams[el as keyof _filterParams] as string;
  });
  return getFromApi<PaginatedResponse<AccountLedgerType>>(
    ACCOUNTING.ACCOUNTS.TRXNS,
    token,
    params
  );
};

export const createTransaction = (
  token: string,
  trxn: TransactionAtCreation
) => {
  return postToApi<any>(ACCOUNTING.ACCOUNTS.CREATE_TRXN, token, trxn);
};

export const deleteTransaction = (token: string, id: string | number) => {
  return deleteApi<any>(
    ACCOUNTING.ACCOUNTS.DELETE_TRXN.replaceAll("{{id}}", id.toString()),
    token
  );
};
