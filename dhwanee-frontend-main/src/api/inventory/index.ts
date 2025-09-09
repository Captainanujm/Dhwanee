import INVENTORY from "./endpoints";
import {getFromApi, postToApi, putToApi} from "src/api";
import {
  CategoryType,
  CategoryTypeAtCreation,
  ProductItemType,
  ProductType,
  ProductTypeAtCreation,
  SubCategoryType,
  SubCategoryTypeAtCreation,
} from "src/types/inventory";
import PaginatedResponse from "src/types/paginated-response";

export const createCategory = (token: string, data: CategoryTypeAtCreation) => {
  return postToApi<CategoryType>(INVENTORY.CATEGORIES.ALL, token, data);
};

export const listCategory = (
  token: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<CategoryType>>(
    INVENTORY.CATEGORIES.ALL,
    token,
    {
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const searchCategories = (
  token: string,
  search: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<CategoryType>>(
    INVENTORY.CATEGORIES.SEARCH,
    token,
    {
      q: search,
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const getOneCategory = (token: string, id: number | string) => {
  return getFromApi<CategoryType>(`${INVENTORY.CATEGORIES.ALL}${id}/`, token);
};

export const createSubCategory = (
  token: string,
  data: SubCategoryTypeAtCreation
) => {
  return postToApi<SubCategoryType>(
    INVENTORY.SUBCATEGORIES.ALL,
    token,
    data
  );
};

export const getSubCategoriesByCategory = (
  token: string,
  category_id: number | string,
  page?: number,
  rows_per_page?: number
) => {
  const limit = rows_per_page || 15;
  const offset = ((page || 1) - 1) * limit;
  return getFromApi<
    PaginatedResponse<SubCategoryType & { product_set: number[] }>
  >(INVENTORY.SUBCATEGORIES.BY_CATEGORY, token, {
    id: category_id.toString(),
    limit: limit.toString(),
    offset: offset.toString(),
  });
};

export const searchSubCategoriesByCategory = (
  token: string,
  q: string,
  category_id: number | string,
  page?: number,
  rows_per_page?: number
) => {
  const limit = rows_per_page || 15;
  const offset = ((page || 1) - 1) * limit;
  return getFromApi<PaginatedResponse<SubCategoryType>>(
    INVENTORY.SUBCATEGORIES.SEARCH_BY_CATEGORY,
    token,
    {
      q,
      id: category_id.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const searchSubCategories = (
  token: string,
  q: string,
  page?: number,
  rows_per_page?: number
) => {
  const limit = rows_per_page || 15;
  const offset = ((page || 1) - 1) * limit;
  return getFromApi<PaginatedResponse<SubCategoryType>>(
    INVENTORY.SUBCATEGORIES.SEARCH,
    token,
    {
      q,
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const createProduct = (token: string, data: ProductTypeAtCreation) => {
  return postToApi<ProductType>(INVENTORY.PRODUCTS.ALL, token, data);
};

export const editProduct = (
  token: string,
  id: number | string,
  data: Partial<ProductTypeAtCreation>
) => {
  return putToApi<ProductType>(
    `${INVENTORY.PRODUCTS.ALL}${id}/`,
    token,
    data
  );
};

export const listProduct = (
  token: string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<ProductType>>(
    INVENTORY.PRODUCTS.ALL,
    token,
    {
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const searchProducts = (
  token: string,
  search: string,
  page: number,
  rows_per_page: number,
  finished?: boolean,
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  var params: {[k: string]: string} = {
    q: search,
    limit: limit.toString(),
    offset: offset.toString(),
  };
  if (finished !== undefined) {
    params.finished = finished.toString()
  }
  return getFromApi<PaginatedResponse<ProductType>>(
    INVENTORY.PRODUCTS.SEARCH,
    token,
    params
  );
};

export const searchProductByUUID = (
  token: string,
  search: string,
  page: number,
  rows_per_page: number,
  finished?: boolean,
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  var params: {[k: string]:string} = 
  {
    q: search,
    limit: limit.toString(),
    offset: offset.toString(),
  };
  if (finished) {
    params.finished = finished.toString()
  }
  return getFromApi<PaginatedResponse<ProductItemType>>(
    INVENTORY.PRODUCTS.SEARCH_BY_UUID,
    token,
    params
  );
};

export const getOneProduct = (token: string, id: number | string) => {
  return getFromApi<ProductType>(`${INVENTORY.PRODUCTS.ALL}${id}/`, token);
};

export const createInitialStock = (token: string, data: any) => {
  return postToApi<any>(
    INVENTORY.PRODUCTS.INITIAL_STOCK.CREATE,
    token,
    data
  );
};

export const getProductItemsByProduct = (
  token: string,
  filters: {
    id: string;
    all?: string;
    unsold?: string;
  },
  page?: number,
  rows_per_page?: number
) => {
  const limit = rows_per_page || 15;
  const offset = ((page || 1) - 1) * limit;
  return getFromApi<PaginatedResponse<ProductItemType>>(
    INVENTORY.PRODUCTS.ITEMS.BY_PRODUCT,
    token,
    {
      ...filters,
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const searchProductItemsByProduct = (
  token: string,
  q: string,
  product_id: number | string,
  page?: number,
  rows_per_page?: number
) => {
  const limit = rows_per_page || 15;
  const offset = ((page || 1) - 1) * limit;
  return getFromApi<PaginatedResponse<ProductItemType>>(
    INVENTORY.PRODUCTS.ITEMS.SEARCH_BY_PRODUCT,
    token,
    {
      q,
      id: product_id.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

export const getProductsByCategory = (
  token: string,
  category_id: number | string
) => {
  return getFromApi<
    Array<{ id: number; name: string; current_stock: number }>
  >(INVENTORY.CATEGORIES.GET_PRODUCTS, token, {
    id: category_id.toString(),
  });
};

export const getProductLedger = (
  token: string,
  id: number | string,
  page: number,
  rows_per_page: number
) => {
  const limit = rows_per_page;
  const offset = (page - 1) * rows_per_page;
  return getFromApi<PaginatedResponse<any>>(
    `${INVENTORY.PRODUCTS.LEDGER.replace("{{id}}", id.toString())}`,
    token,
    {
      limit: limit.toString(),
      offset: offset.toString(),
    }
  );
};

type _filterParams = Partial<{
  name: string;
  brand: number[];
  category: number[];
  subcategory: number[];
  min_price: number;
  max_price: number;
  all: string;
  paginated: {
    page: number;
    rows_per_page: number;
  };
}>

export const filterProducts = (
  token: string,
  searchParams: _filterParams
) => {
  var params: {[index: string]: string} = {};
  Object.keys(searchParams).forEach((el) => {
    if (el==='paginated') {
      params.limit = searchParams[el as 'paginated']?.rows_per_page.toString() || '1';
      params.offset = (((searchParams[el as 'paginated']?.page || 1) - 1) * (searchParams[el as 'paginated']?.rows_per_page || 10)).toString();
    }
    else if (typeof searchParams[el as keyof _filterParams] === 'object') params[el] = (searchParams[el as keyof _filterParams] as number[]).join(',')
    else if (typeof searchParams[el as keyof _filterParams] === 'number') params[el] = (searchParams[el as keyof _filterParams] as number).toString()
    else params[el] = (searchParams[el as keyof _filterParams] as string)
  })
  return getFromApi<PaginatedResponse<ProductType>>(
    INVENTORY.PRODUCTS.FILTER,
    token,
    params
  );
};


export const updateProductRate = (token: string, id: number|string, new_rate: number) => {
  return postToApi<any>(
    INVENTORY.PRODUCTS.RATE_EDIT.replace("{{id}}", id.toString()),
    token,
    {rate: new_rate}
  );
};

export const addProductItemsToStock = (token: string, id:number|string, data: {packet_size?:number, num_packets: number, price:number}) => {
  return postToApi<any>(
    INVENTORY.PRODUCTS.ADD_TO_STOCK.replace("{{id}}", id.toString()),
    token,
    data
  );
}
