import API_HOST from "src/api/api-host";

export const CUSTOMERS_ENDPOINTS = {
  ALL: API_HOST + "customers/",
  SEARCH: API_HOST + "customers/search/",
  LEDGER: API_HOST + "customers/{{id}}/ledger/",
  ADD_PAYMENT: API_HOST + "customers/{{id}}/payment/"
};

export default CUSTOMERS_ENDPOINTS;
