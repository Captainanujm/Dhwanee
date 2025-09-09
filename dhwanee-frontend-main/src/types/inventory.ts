import { AgencyType, BranchType } from "./store";

export interface CategoryTypeAtCreation {
  branch: number | BranchType;
  name: string;
}
export interface CategoryType extends CategoryTypeAtCreation {
  agency: number | AgencyType;
  branch: number | BranchType;
  id: number;
}
export interface SubCategoryTypeAtCreation {
  branch: number | BranchType;
  name: string;
  category: string | number;
}
export interface SubCategoryType {
  agency: number | AgencyType;
  branch: number | BranchType;
  id: number;
  name: string;
  category: CategoryType;
}

export interface RecipeIngredientType {
  product: ProductType;
  percentage: number;
}

export interface ProductTypeAtCreation {
  branch: number | BranchType;
  name: string;
  category: number | CategoryType;
  subcategory: number | SubCategoryType;
  hsn: string;
  default_selling_price: number;
  default_tax: number;
  bulk: boolean;
  is_pieces: boolean;
  finished: boolean;
  recipe: RecipeIngredientType[];
}

export interface ProductType extends ProductTypeAtCreation {
  agency: number | AgencyType;
  id: number;
  current_stock: number;
}

export interface ProductItemType {
  id: number;
  product: number | ProductType;
  parent?: number | ProductItemType;
  uuid: string;
  status: "SOLD" | "UNSOLD" | "AWAITED" | "RETURNED";
  size?: number;
  original_size: number;
  price: number;
  discount: number;
  tax: number;
  cost: number;
}

export interface ProductLedgerType {
  id: number;
  date: string;
  remarks: string;
  amount: number;
  bal_before: number;
  bal_after: number;
  link: string;
}
