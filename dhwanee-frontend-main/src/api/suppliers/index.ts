import SUPPLIERS from "./endpoints";
import {getFromApi, postToApi, patchApi} from "src/api";
import {
  SupplierBillType,
  SupplierBillTypeAtCreation,
  SupplierBillTypeDeep,
  SupplierType,
  SupplierTypeAtCreation,
  PurchaseReturnType,
  PurchaseReturnTypeAtCreation,
} from "src/types/suppliers";
import PaginatedResponse from "src/types/paginated-response";
import dateToIsoString from "src/utils/date-to-string";
import { TransactionAtCreation } from "src/types/accounting";

export const createSupplier = (token: string, data: SupplierTypeAtCreation) => {
  return postToApi<SupplierType>(SUPPLIERS.ALL, token, data);
};

export const editSupplier = (token: string, data: Partial<SupplierType>, id: number|string) => {
  return patchApi<SupplierType>(SUPPLIERS.ALL + id.toString()+'/', token, data);
};

export const listSupplier = (
  token: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<SupplierType>>(SUPPLIERS.ALL, token, {
    limit: limit.toString(),
    offset: offset.toString(),
  });
};

export const searchSuppliers = (
  token: string,
  search: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<SupplierType>>(
    SUPPLIERS.SEARCH,
    token,
    {
      q: search,
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const getOneSupplier = (token: string, id: number | string) => {
  return getFromApi<SupplierType>(`${SUPPLIERS.ALL}${id}/`, token);
};

export const getSupplierLedger = (
  token: string,
  id: number | string,
  page: number,
  rows_per_page: number,
  from?: Date,
  to?: Date
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  var q: { [index: string]: string } = {
    limit: limit.toString(),
    offset: offset.toString(),
  };
  if (from) q.from = dateToIsoString(from);
  if (to) q.to = dateToIsoString(to);
  return getFromApi<PaginatedResponse<any>>(
    `${SUPPLIERS.LEDGER.replace("{{id}}", id.toString())}`,
    token,
    q
  );
};

export const createSupplierBill = (
  token: string,
  bill: SupplierBillTypeAtCreation
) => {
  var data: any = { ...bill };
  data.date = dateToIsoString(data.date);
  data.products = bill.products.map((elem) => ({
    ...elem,
    id: elem.product.id,
  }));
  return postToApi<any>(SUPPLIERS.INVOICE.CREATE, token, data);
};

export const listSupplierBills = (
  token: string,
  id: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<SupplierBillType>>(
    SUPPLIERS.INVOICE.LIST_BY_SUPPLIER,
    token,
    {
      limit: limit.toString(),
      offset: offset.toString(),
      q: id,
    }
  );
};

export const getOneSupplierBill = (token: string, id: number | string) => {
  return getFromApi<SupplierBillTypeDeep>(
    `${SUPPLIERS.INVOICE.ALL}${id}/`,
    token
  );
};

export const markBillAsReceived = (token: string, id: number | string) => {
  return postToApi<{ message: string }>(
    SUPPLIERS.INVOICE.MARK_RECEIVED.replace("{{id}}", id.toString()),
    token
  );
};

export const createPurchaseReturn = (
  token: string,
  bill: PurchaseReturnTypeAtCreation
) => {
  return postToApi<any>(SUPPLIERS.PURCHASE_RETURNS.CREATE, token, bill);
};

export const listPurchaseReturns = (
  token: string,
  id: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<PurchaseReturnType>>(
    SUPPLIERS.PURCHASE_RETURNS.ALL,
    token,
    {
      limit: limit.toString(),
      offset: offset.toString(),
      q: id,
    }
  );
};

export const getOnePurchaseReturn = (token: string, id: number | string) => {
  return getFromApi<PurchaseReturnType>(
    `${SUPPLIERS.PURCHASE_RETURNS.ALL}${id}/`,
    token
  );
};


export const checkProductBelongsToSupplier = (token: string, supplier_id: number | string, product_id: number | string) => {
  return getFromApi<{is_same: boolean; bill?: string}>(SUPPLIERS.CHECK_PRODUCT_SUPPLIER.replace('{{id}}', supplier_id.toString()), token, {product: product_id.toString()});
};


export const createTransactionToSupplier = (
  token: string,
  id: number|string,
  trxn: TransactionAtCreation
) => {
  return postToApi<SupplierType>(SUPPLIERS.ADD_PAYMENT.replace("{{id}}", id.toString()), token, trxn);
};

