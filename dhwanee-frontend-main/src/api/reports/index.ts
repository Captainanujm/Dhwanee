import { getFromApi } from "../";
import REPORTS_ENDPOINTS from "./endpoints";

export const getBillsOverview = (token: string, fromDate: string, toDate: string, filters?:{[index: string]: string}) => {
  return getFromApi(REPORTS_ENDPOINTS.BILLS_OVERVIEW, token, {
    from: fromDate,
    to: toDate,
    ...filters
  });
};
