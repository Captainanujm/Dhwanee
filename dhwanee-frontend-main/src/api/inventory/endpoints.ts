import API_HOST from "src/api/api-host";

export const INVENTORY_ENDPOINTS = {
  CATEGORIES: {
    ALL: API_HOST + "products/categories/",
    SEARCH: API_HOST + "products/categories/search/",
    GET_PRODUCTS: API_HOST + "products/categories/get-products/",
  },
  SUBCATEGORIES: {
    ALL: API_HOST + "products/subcategories/",
    SEARCH: API_HOST + "products/subcategories/search/",
    BY_CATEGORY: API_HOST + "products/subcategories/by-category/",
    SEARCH_BY_CATEGORY: API_HOST + "products/subcategories/search-by-category/",
  },
  PRODUCTS: {
    ALL: API_HOST + "products/",
    SEARCH: API_HOST + "products/search/",
    FILTER: API_HOST + "products/filter/",
    LEDGER: API_HOST + "products/{{id}}/ledger/",
    RATE_EDIT: API_HOST + "products/{{id}}/rate-edit/",
    ADD_TO_STOCK: API_HOST + "products/{{id}}/add-to-stock/",
    SEARCH_BY_UUID: API_HOST + "products/search-by-uuid/",
    PRINT_LABELS: API_HOST + "products/print-labels/",
    INITIAL_STOCK: {
      ALL: API_HOST + "suppliers/initial-stock/generate/",
      CREATE: API_HOST + "suppliers/initial-stock/generate/",
    },
    ITEMS: {
      ALL: API_HOST + "products/product-items/",
      SEARCH: API_HOST + "products/product-items/search/",
      BY_PRODUCT: API_HOST + "products/product-items/by-product/",
      SEARCH_BY_PRODUCT: API_HOST + "products/product-items/search-by-product/",
    },
  },
};

export default INVENTORY_ENDPOINTS;
