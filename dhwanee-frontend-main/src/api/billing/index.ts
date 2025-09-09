import BILLING from "./endpoints";
import {getFromApi, patchApi, postToApi, putToApi} from "src/api";
// import {
//   any,
//   any,
// } from "src/types/billing";
import PaginatedResponse from "src/types/paginated-response";
import dateToIsoString from "src/utils/date-to-string";
import {
  BillType,
  BillTypeAtCreation,
  SalesReturnFromDBType,
  SalesReturnType,
  SalesReturnTypeAtCreation,
} from "src/types/billing";

export const createBill = (token: string, data: BillTypeAtCreation) => {
  return postToApi<{ bill: number }>(BILLING.ALL, token, data);
};
export const updateBill = (
  token: string,
  id: string | number,
  data: Partial<BillType>
) => {
  return putToApi<{ bill: number }>(
    BILLING.ALL + id.toString() + "/",
    token,
    data
  );
};

export const listBills = (
  token: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<any>>(BILLING.ALL, token, {
    limit: limit.toString(),
    offset: offset.toString(),
  });
};

export const searchBills = (
  token: string,
  search: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<any>>(BILLING.SEARCH, token, {
    q: search,
    limit: limit.toString(),
    offset: offset.toString(),
  });
};

export const getOneBill = (token: string, id: number | string) => {
  return getFromApi<BillType>(`${BILLING.ALL}${id}/`, token);
};

export const listBillsByDay = (token: string, from: Date, to: Date) => {
  return getFromApi<BillType[]>(BILLING.BY_DAY, token, {
    from: dateToIsoString(from),
    to: dateToIsoString(to),
  });
};

export const createSalesReturn = (
  token: string,
  data: SalesReturnTypeAtCreation
) => {
  return postToApi<SalesReturnType>(BILLING.RETURNS.ALL, token, data);
};
export const updateSalesReturns = (
  token: string,
  id: string | number,
  data: SalesReturnType
) => {
  return putToApi<SalesReturnType>(
    BILLING.RETURNS.ALL + id.toString() + "/",
    token,
    data
  );
};

export const listSalesReturns = (
  token: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<SalesReturnType>>(
    BILLING.RETURNS.ALL,
    token,
    {
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const searchSalesReturns = (
  token: string,
  search: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<SalesReturnType>>(
    BILLING.RETURNS.SEARCH,
    token,
    {
      q: search,
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const getOneSalesReturns = (token: string, id: number | string) => {
  return getFromApi<SalesReturnFromDBType>(`${BILLING.RETURNS.ALL}${id}/`, token);
};


export const createChallan = (token: string, data: any) => {
  return postToApi<any>(BILLING.CHALLAN.ALL, token, data);
};

export const updateChallan = (
  token: string,
  id: string | number,
  data: any
) => {
  return patchApi<any>(
    BILLING.CHALLAN.ALL + id.toString() + "/",
    token,
    data
  );
};

export const listChallans = (
  token: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<any>>(BILLING.CHALLAN.ALL, token, {
    limit: limit.toString(),
    offset: offset.toString(),
  });
};

export const searchChallans = (
  token: string,
  search: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<any>>(BILLING.CHALLAN.SEARCH, token, {
    q: search,
    limit: limit.toString(),
    offset: offset.toString(),
  });
};

export const getOneChallan = (token: string, id: number | string) => {
  return getFromApi<any>(`${BILLING.CHALLAN.ALL}${id}/`, token);
};

export const convertChallanToInvoice = (
  token: string,
  id: number | string,
  items: number[]
) => {
  return putToApi<{ bill: number }>(
    BILLING.CHALLAN.CONVERT.replace("{{id}}", id.toString()),
    token,
    { items }
  );
};
