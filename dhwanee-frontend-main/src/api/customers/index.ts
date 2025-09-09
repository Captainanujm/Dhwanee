import CUSTOMERS from "./endpoints";
import {getFromApi, patchApi, postToApi} from "src/api";
import { TransactionAtCreation } from "src/types/accounting";
import { CustomerType, CustomerTypeAtCreation } from "src/types/customer";
import PaginatedResponse from "src/types/paginated-response";

export const createCustomer = (token: string, data: CustomerTypeAtCreation) => {
  return postToApi<CustomerType>(CUSTOMERS.ALL, token, data);
};

export const editCustomer = (token: string, id: string|number, data: Partial<CustomerType>) => {
  return patchApi<CustomerType>(`${CUSTOMERS.ALL}${id}/`, token, data);
};

export const listCustomer = (
  token: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<CustomerType>>(CUSTOMERS.ALL, token, {
    limit: limit.toString(),
    offset: offset.toString(),
  });
};

export const searchCustomers = (
  token: string,
  search: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<CustomerType>>(
    CUSTOMERS.SEARCH,
    token,
    {
      q: search,
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const getOneCustomer = (token: string, id: number | string) => {
  return getFromApi<CustomerType>(`${CUSTOMERS.ALL}${id}/`, token);
};

export const getCustomerLedger = (
  token: string,
  id: number | string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<any>>(
    `${CUSTOMERS.LEDGER.replace("{{id}}", id.toString())}`,
    token,
    {
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const createTransactionToCustomer = (
  token: string,
  id: number|string,
  trxn: TransactionAtCreation
) => {
  return postToApi<CustomerType>(CUSTOMERS.ADD_PAYMENT.replace("{{id}}", id.toString()), token, trxn);
};

