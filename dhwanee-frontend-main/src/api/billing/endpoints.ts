import API_HOST from "src/api/api-host";

export const BILLING_ENDPOINTS = {
  ALL: API_HOST + "billing/",
  SEARCH: API_HOST + "billing/search/",
  BY_DAY: API_HOST + "billing/by-day/",
  RETURNS: {
    ALL: API_HOST + "billing/returns/",
    SEARCH: API_HOST + "billing/returns/search/",
  },
  CHALLAN: {
    ALL: API_HOST + "billing/challan/",
    SEARCH: API_HOST + "billing/challan/search/",
    CONVERT: API_HOST + "billing/challan/{{id}}/convert/",
  }
};

export default BILLING_ENDPOINTS;
