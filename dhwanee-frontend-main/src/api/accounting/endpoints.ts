import API_HOST from "src/api/api-host";
export const ACCOUNTING_ENDPOINTS = {
  ACCOUNTS: {
    ALL: API_HOST + "accounting/accounts/",
    SEARCH: API_HOST + "accounting/accounts/search/",
    TRXNS: API_HOST + "accounting/accounts/transactions/",
    CREATE_TRXN: API_HOST + "accounting/accounts/create-transaction/",
    DELETE_TRXN: API_HOST + "accounting/accounts/{{id}}/delete-transaction/",
    LEDGER: API_HOST + "accounting/accounts/{{id}}/ledger/"
  },
  METHODS: {
    ALL: API_HOST + "accounting/methods/",
    SEARCH: API_HOST + "accounting/methods/search/",
    LEDGER: API_HOST + "accounting/methods/{{id}}/ledger/"
  },
  LABELS: {
    ALL: API_HOST + "accounting/labels/",
    SEARCH: API_HOST + "accounting/labels/search/",
    LEDGER: API_HOST + "accounting/labels/{{id}}/ledger/"
  }
}

export default ACCOUNTING_ENDPOINTS;
