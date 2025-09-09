import { Typography, Stack } from "@mui/material";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { listBillsByDay } from "src/api/billing";

import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

import format from "date-fns/format";
import { endOfDay, startOfDay } from "date-fns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import DataTable from "src/components/data-table";
import roundOff from "src/utils/round-off";
import { ProductType } from "src/types/inventory";

interface BillDetailType {
  number: string;
  date: string;
  customer_name: string;
  customer_address: string;
  customer_gstin: string;
  taxable: number;
  total: number;
  quantity: number;
  local_taxes: { [percentage: string]: number };
  central_taxes: { [percentage: string]: number };
  output_cgst: number;
  output_sgst: number;
  output_igst: number;
}

export default function GSTReport() {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchHeaders, setSearchHeaders] = useState<{
    local: string[];
    central: string[];
  }>({
    local: [],
    central: [],
  });
  const [searchQuery, setSearchQuery] = useState({
    from: new Date(),
    to: new Date(),
  });
  const lastSearchTimeout = useRef<{
    elapsed: boolean;
    timeout: NodeJS.Timeout | null;
  }>({ timeout: null, elapsed: false });

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const refreshBills = useCallback(() => {
    if (!lastSearchTimeout.current.elapsed) {
      if (lastSearchTimeout.current.timeout)
        clearTimeout(lastSearchTimeout.current.timeout);
      lastSearchTimeout.current.timeout = setTimeout(() => {
        lastSearchTimeout.current.timeout = null;
        lastSearchTimeout.current.elapsed = true;
        refreshBills();
      }, 500);
    } else {
      lastSearchTimeout.current.elapsed = false;
      if (tokens) {
        dispatch(showLoader("searching..."));
        listBillsByDay(
          tokens.access,
          startOfDay(searchQuery.from),
          endOfDay(searchQuery.to)
        )
          .then((results) => {
            var sgst: number,
              cgst: number,
              igst: number,
              unit_price_before_tax: number,
              price_before_tax: number;
            const percentage_headers: { local: string[]; central: string[] } = {
              local: [],
              central: [],
            };
            const data: BillDetailType[] = results.map((el) => {
              const bill_data: BillDetailType = {
                number: el.number,
                date: format(new Date(el.date), "dd MMM yy HH:mm"),
                customer_address: el.customer.address,
                customer_gstin: el.customer.gstin || "",
                customer_name: el.customer.name,
                taxable: el.subtotal,
                total: el.total,
                quantity: 0,
                local_taxes: {},
                central_taxes: {},
                output_cgst: 0,
                output_sgst: 0,
                output_igst: 0,
              };
              el.products.forEach((elem) => {
                unit_price_before_tax = roundOff(
                  Number(elem.price) * (100 / (100 + Number(elem.tax)))
                );

                price_before_tax = roundOff(
                  (elem.product as ProductType).is_pieces && !(elem.product as ProductType).bulk
                    ? unit_price_before_tax
                    : unit_price_before_tax * Number(elem.size)
                );

                if ((elem.product as ProductType).bulk) bill_data.quantity += Number(elem.size);
                else bill_data.quantity += 1;

                const tax = roundOff(
                  Number(elem.tax) * 0.01 * price_before_tax
                );
                var percentage = Number(elem.tax).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                if (el.customer.state === "UTTAR PRADESH - 09") {
                  cgst = roundOff(tax / 2);
                  sgst = roundOff(tax - cgst)
                  igst = 0;

                  if (Object.keys(bill_data.local_taxes).includes(percentage)) {
                    bill_data.local_taxes[percentage] += tax;
                  } else {
                    bill_data.local_taxes[percentage] = tax;
                  }
                  bill_data.output_cgst += cgst;
                  bill_data.output_sgst += sgst;
                  if (!percentage_headers.local.includes(percentage))
                    percentage_headers.local.push(percentage);
                } else {
                  cgst = sgst = 0;
                  igst = tax;
                  if (
                    Object.keys(bill_data.central_taxes).includes(percentage)
                  ) {
                    bill_data.local_taxes[percentage] += igst;
                  } else {
                    bill_data.local_taxes[percentage] = igst;
                  }
                  bill_data.output_igst += igst;

                  if (!percentage_headers.central.includes(percentage))
                    percentage_headers.central.push(percentage);
                }
              });

              return bill_data;
            });
            setSearchHeaders(percentage_headers);
            setSearchResults(
              data.map((el) => {
                var res: (string|number)[] = [
                  el.date,
                  el.customer_name,
                  el.customer_address,
                  "Sales",
                  el.number,
                  el.number,
                  el.customer_gstin,
                  el.quantity.toString(),
                  el.taxable,
                  el.total,
                ];
                percentage_headers.local.forEach((tax) => {
                  if (Object.keys(el.local_taxes).includes(tax))
                    res.push(
                      el.local_taxes[tax].toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    );
                  else res.push("");
                });
                res = res.concat([
                  el.output_cgst.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                  el.output_sgst.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                ]);

                percentage_headers.central.forEach((tax) => {
                  if (Object.keys(el.central_taxes).includes(tax))
                    res.push(
                      el.central_taxes[tax].toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    );
                  else res.push("");
                });
                res.push(
                  el.output_igst.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                );
                console.log(el);
                return res;
              })
            );
          })
          .catch(() => {
            dispatch(
              showSnackbar({
                text: "some error occurred while trying to load the results",
              })
            );
          })
          .finally(() => dispatch(hideLoader()));
      }
    }
  }, [searchQuery, tokens, dispatch, lastSearchTimeout]);

  useEffect(() => {
    refreshBills();
  }, [refreshBills]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        GST Report
      </Typography>
      <Stack direction="row" gap={3}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="From Date"
            value={searchQuery.from}
            format="dd MMM yy"
            onChange={(newValue) =>
              newValue && setSearchQuery({ ...searchQuery, from: newValue })
            }
          />
          <DatePicker
            label="To Date"
            value={searchQuery.to}
            format="dd MMM yy"
            onChange={(newValue) =>
              newValue && setSearchQuery({ ...searchQuery, to: newValue })
            }
          />
        </LocalizationProvider>
      </Stack>
      <DataTable
        header={[
          "date",
          "customer name",
          "customer address",
          "voucher type",
          "voucher number",
          "voucher ref number",
          "gstin",
          "quantity",
          "taxable value",
          "total value",
          // "round off",
        ]
          .concat(searchHeaders.local.map((el) => `Sales local ${el}%`))
          .concat(["output cgst", "output sgst"])
          .concat(searchHeaders.central.map((el) => `Sales central ${el}%`))
          .concat(["output igst"])}
        rows={searchResults}
      />
    </>
  );
}
