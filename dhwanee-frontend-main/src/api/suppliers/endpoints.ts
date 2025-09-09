import API_HOST from "src/api/api-host";
const SUPPLIER_ENDPOINTS = {
  ALL: API_HOST + "suppliers/",
  SEARCH: API_HOST + "suppliers/search/",
  LEDGER: API_HOST + "suppliers/{{id}}/ledger/",
  PRINT_LEDGER: API_HOST + "suppliers/{{id}}/ledger-pdf/",
  CHECK_PRODUCT_SUPPLIER: API_HOST + "suppliers/{{id}}/check-product-supplier/",
  ADD_PAYMENT: API_HOST + "suppliers/{{id}}/payment/",
  INVOICE: {
    ALL: API_HOST + "suppliers/invoice/",
    CREATE: API_HOST + "suppliers/invoice/generate/",
    LIST_BY_SUPPLIER: API_HOST + "suppliers/invoice/by-supplier/",
    MARK_RECEIVED: API_HOST + "suppliers/invoice/{{id}}/mark-received/",
  },
  PURCHASE_RETURNS: {
    ALL: API_HOST + "suppliers/purchase-return/",
    CREATE: API_HOST + "suppliers/purchase-return/",
    SEARCH: API_HOST + "suppliers/purchase-return/search/",
  },
};
export default SUPPLIER_ENDPOINTS;
