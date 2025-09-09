import { Typography, Stack } from "@mui/material";
import { useState, useEffect, useCallback, useRef, ReactNode } from "react";
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
import { searchPaymentMethods } from "src/api/accounting";
import { PaymentMethodType } from "src/types/accounting";
import { ProductType } from "src/types/inventory";

export default function OldBills() {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState({
    from: new Date(),
    to: new Date(),
  });
  const [taxinfo, setTaxinfo] = useState<{
    [perc: string]: { cgst: number; sgst: number; igst: number };
  }>({});
  const lastSearchTimeout = useRef<{
    elapsed: boolean;
    timeout: NodeJS.Timeout | null;
  }>({ timeout: null, elapsed: false });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodType[]>([]);

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
            const totals = {
              taxable: 0,
              tax: 0,
              total: 0,
              upi: 0,
              bank: 0,
              cheque: 0,
              cash: 0,
              card: 0,
            };
            const pm_totals: {
              [id: number | string]: { name: string; total: number };
            } = {};
            paymentMethods.forEach((e) => {
              pm_totals[e.id] = { name: e.name, total: 0 };
            });
            var tax_info: {
              [perc: string]: { cgst: number; sgst: number; igst: number };
            } = {
              Total: { cgst: 0, sgst: 0, igst: 0 },
            };
            var sgst: number,
              cgst: number,
              igst: number,
              unit_price_before_tax: number,
              price_before_tax: number;
            var res: ReactNode[] = results.map((el) => {
              const payments: { [method_id: number]: number } = {};

              el.products.forEach((elem) => {
                unit_price_before_tax = roundOff(
                  Number(elem.price) * (100 / (100 + Number(elem.tax)))
                );

                price_before_tax = roundOff(
                  (elem.product as ProductType).is_pieces &&
                    !(elem.product as ProductType).bulk
                    ? unit_price_before_tax
                    : unit_price_before_tax * Number(elem.size)
                );

                const tax = roundOff(
                  Number(elem.tax) * 0.01 * price_before_tax
                );
                var percentage = "";
                if (el.customer.state === "UTTAR PRADESH - 09") {
                  cgst = sgst = roundOff(tax / 2);
                  igst = 0;
                  percentage = (Number(elem.tax) / 2).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                } else {
                  cgst = sgst = 0;
                  igst = tax;
                  percentage = Number(elem.tax).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                }
                tax_info.Total.cgst += cgst;
                tax_info.Total.sgst += sgst;
                tax_info.Total.igst += igst;
                if (Object.keys(tax_info).includes(percentage)) {
                  tax_info[percentage].cgst += cgst;
                  tax_info[percentage].sgst += sgst;
                } else {
                  tax_info[percentage] = { cgst: cgst, sgst: sgst, igst: 0 };
                }
                if (Object.keys(tax_info).includes(percentage)) {
                  tax_info[percentage].igst += igst;
                } else {
                  tax_info[percentage] = { igst: igst, sgst: 0, cgst: 0 };
                }
              });

              el.payments.forEach((py) => {
                if (py.method) {
                  payments[py.method.id] = py.amount;
                  pm_totals[py.method.id].total += Number(py.amount);
                }
              });
              totals.taxable += Number(el.subtotal);
              totals.tax += Number(el.cgst) + Number(el.sgst) + Number(el.igst);
              totals.total += Number(el.payable);
              console.log(
                "bill no",
                el.number,
                "cgst=",
                el.cgst,
                "sgst=",
                el.sgst,
                "igst=",
                el.igst,
                "total=",
                totals.tax
              );
              return [
                format(new Date(el.date), "dd MMM HH:mm"),
                el.customer.name,
                el.customer.number,
                el.number,
                el.subtotal,
                (
                  Number(el.cgst) +
                  Number(el.sgst) +
                  Number(el.igst)
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
                el.payable,
              ].concat(paymentMethods.map((py) => payments[py.id] || "-"));
            });
            res = res.concat([
              [
                "",
                "",
                <b>Totals</b>,
                "",
                totals.taxable.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
                totals.tax.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
                totals.total.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
              ].concat(
                paymentMethods.map((e) =>
                  pm_totals[e.id].total.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                )
              ),
            ]);
            setTaxinfo(tax_info);
            setSearchResults(res);
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
  }, [searchQuery, tokens, dispatch, lastSearchTimeout, paymentMethods]);

  useEffect(() => {
    refreshBills();
  }, [refreshBills]);

  useEffect(() => {
    if (tokens) {
      searchPaymentMethods(tokens.access, "", 1, 100).then((results) => {
        setPaymentMethods(results.results);
      });
    }
  }, [tokens]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        Day Wise Report
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
      <Typography sx={{ my: 1 }} variant="h6">
        Tax Information
      </Typography>
      <DataTable
        header={["%", "CGST", "SGST", "IGST"]}
        rows={Object.keys(taxinfo)
          .reverse()
          .map((elem) => [
            elem,
            taxinfo[elem].cgst.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            taxinfo[elem].sgst.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            taxinfo[elem].igst.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          ])}
      />
      <Typography sx={{ my: 1 }} variant="h6">
        Bill Information
      </Typography>
      <DataTable
        header={[
          "date",
          "customer name",
          "customer number",
          "bill number",
          "taxable value",
          "tax",
          "total value",
        ].concat(paymentMethods.map(e => e.name))}
        rows={searchResults}
      />
    </>
  );
}
