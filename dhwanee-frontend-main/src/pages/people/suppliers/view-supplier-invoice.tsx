import {
  Grid,
  TextField,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Card,
  CardContent,
} from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";

import { showSnackbar } from "src/components/snackbar/reducer";

//   import AddStaffModal from "./add-staff-modal";
import DataTable from "src/components/data-table";
import { ProductItemType, ProductType } from "src/types/inventory";
import Div from "src/components/div";
// import dateToIsoString from "src/utils/date-to-string";
import AccentCard from "src/components/accent-card";
import roundOff from "src/utils/round-off";
import { SupplierBillExtraExpense, SupplierType } from "src/types/suppliers";
import { getOneSupplierBill, markBillAsReceived } from "src/api/suppliers";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useParams } from "react-router-dom";
import AlertChip from "src/components/alert-chip";
import { Link } from "react-router-dom";
import INVENTORY from "src/api/inventory/endpoints";
import MD3Button from "src/components/md3-button";

export default function ViewSupplierBill() {
  const [supplier, setSupplier] = useState<SupplierType>();
  const [addedProducts, setAddedProducts] = useState<Array<ProductItemType>>(
    []
  );
  const [totals, setTotals] = useState<{
    subtotal: number;
    taxes: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    roundoff: number;
    payable: number;
    discount: number;
    extra_expenses: number;
  }>({
    subtotal: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    taxes: 0,
    total: 0,
    roundoff: 0,
    payable: 0,
    discount: 0,
    extra_expenses: 0,
  });
  const [billParams, setBillParams] = useState<{
    number: string;
    date: Date;
    cash_discount: number | string;
    cash_discount_type: "percentage" | "amount";
    buying_price_gst_incl: boolean;
    received_status: number;
  }>({
    number: "",
    date: new Date(),
    cash_discount: 0,
    cash_discount_type: "percentage",
    buying_price_gst_incl: true,
    received_status: 1,
  });
  const [extraExpenses, setExtraExpenses] = useState<
    SupplierBillExtraExpense[]
  >([]);

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();
  const { id } = useParams();

  const loadBill = useCallback(() => {
    if (tokens && id) {
      dispatch(showLoader("Loading bill"));
      getOneSupplierBill(tokens.access, id)
        .then((data) => {
          setSupplier(data.supplier);
          setAddedProducts(data.products);
          setBillParams({
            number: data.number,
            date: new Date(data.date),
            cash_discount: data.cash_discount,
            cash_discount_type: data.cash_discount_type,
            buying_price_gst_incl: data.buying_price_gst_incl,
            received_status: data.received_status ? 1 : 0,
          });
          setTotals((_totals) => ({
            ..._totals,
            cgst: Number(data.cgst),
            sgst: Number(data.sgst),
            igst: Number(data.igst),
          }));
          setExtraExpenses(data.extra_expenses);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to load the supplier bill" }))
        )
        .finally(() => dispatch(hideLoader()));
    }
  }, [dispatch, tokens, id]);

  const markBillReceived = useCallback(() => {
    if (tokens && id) {
      dispatch(showLoader("Updating bill status"));
      markBillAsReceived(tokens.access, id)
        .then((data) => {
          loadBill();
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to update the supplier bill" }))
        )
        .finally(() => dispatch(hideLoader()));
    }
  }, [dispatch, tokens, id, loadBill]);

  useEffect(() => {
    let subtotal = 0;
    addedProducts.forEach((el) => {
      subtotal += Number(el.price || 0) * Number(el.size || 1);
    });
    subtotal = roundOff(subtotal);
    const taxes = totals.cgst + totals.sgst + totals.igst;
    const total = subtotal + taxes;
    let payable = total;
    let discount = 0;
    if (billParams.cash_discount !== 0) {
      if (billParams.cash_discount_type === "percentage") {
        discount = payable * Number(billParams.cash_discount) * 0.01;
      } else {
        discount = Number(billParams.cash_discount);
      }
    }
    payable -= discount;

    let extra_expenses_total = 0;
    extraExpenses.forEach((el) => {
      extra_expenses_total += Number(el.total_amount);
    });
    payable += extra_expenses_total;
    let roundoff = roundOff(
      payable % 1 < 0.5 ? -(payable % 1) : 1 - (payable % 1)
    );
    setTotals((_totals) => ({
      ..._totals,
      subtotal,
      total: roundOff(total),
      taxes: roundOff(taxes),
      roundoff: roundoff,
      discount: roundOff(discount),
      payable: payable + roundoff,
      extra_expenses: roundOff(extra_expenses_total),
    }));
  }, [
    addedProducts,
    billParams,
    totals.cgst,
    totals.sgst,
    totals.igst,
    extraExpenses,
  ]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  return (
    <>
      <Typography variant="h6" color="primary">
        Viewing Bill
      </Typography>
      <Typography variant="h1" gutterBottom color="primary">
        {billParams.number}
      </Typography>
      <Grid container>
        <Grid item xs={12} md={8} p={2}>
          <Typography variant="h6" sx={{ my: 2 }}>
            Item Information
          </Typography>
          <DataTable
            header={[
              "id",
              "product",
              "status",
              "buying price",
              "total buying price",
              "quantity",
            ]}
            rows={addedProducts.map((elem, index) => [
              elem.uuid,
              (elem.product as ProductType).name,
              <AlertChip
                //@ts-expect-error
                level={
                  {
                    AWAITED: "warning",
                    UNSOLD: "info",
                    SOLD: "success",
                    RETURNED: "error",
                  }[elem.status]
                }
              >
                {elem.status}
              </AlertChip>,
              "₹" + elem.price,
              "₹" +
                roundOff(
                  Number(elem.price || 0) * Number(elem.size || 1)
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
              elem.size || "",
            ])}
          />
          <Typography variant="h6" sx={{ my: 2 }}>
            Bill Information
          </Typography>
          <Stack direction="row" gap={2} mb={2} flexWrap="wrap">
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Bill Date"
                value={billParams.date}
                format="dd MMM yy"
                disabled
              />
            </LocalizationProvider>
            <TextField
              variant="outlined"
              sx={{ minWidth: "320px" }}
              required
              label="Cash Discount"
              value={
                billParams.cash_discount === 0 ? "" : billParams.cash_discount
              }
              disabled
            />
            <FormControl fullWidth sx={{ maxWidth: "150px" }}>
              <InputLabel id="product-item-rows-select-label">
                Cash Discount Type
              </InputLabel>
              <Select
                labelId="product-item-rows-select-label"
                id="product-item-rows-select"
                value={billParams.cash_discount_type}
                label="Cash Discount Type"
                onChange={(ev) =>
                  setBillParams({
                    ...billParams,
                    cash_discount_type: ev.target.value as
                      | "percentage"
                      | "amount",
                  })
                }
                disabled
              >
                <MenuItem value="percentage">Percentage (%)</MenuItem>
                <MenuItem value="amount">Amount (₹)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Typography variant="h6" sx={{ my: 2 }}>
            Tax Information
          </Typography>
          <Stack direction="row" gap={2} mb={2} flexWrap="wrap">
            <Stack>
              <Div sx={{ my: 1, maxWidth: "400px", width: "400px" }}>
                <Typography variant="button">CGST</Typography>
                <Typography variant="button">₹{totals.cgst}</Typography>
              </Div>
              <Div sx={{ my: 1, maxWidth: "400px", width: "400px" }}>
                <Typography variant="button">SGST</Typography>
                <Typography variant="button">₹{totals.sgst}</Typography>
              </Div>
              <Div sx={{ my: 1, maxWidth: "400px", width: "400px" }}>
                <Typography variant="button">IGST</Typography>
                <Typography variant="button">₹{totals.igst}</Typography>
              </Div>
            </Stack>
          </Stack>
          <Typography variant="h6" sx={{ my: 2 }}>
            Extra Expenses
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={2} mb={2}>
            {extraExpenses.map((exp, ind) => (
              <Card
                sx={{ maxWidth: "400px", width: "30%", minWidth: "250px" }}
                variant="outlined"
              >
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Div>
                    <Typography variant="button">{exp.description}</Typography>
                    <Typography variant="button">₹{exp.amount}</Typography>
                  </Div>
                  <Div>
                    <Typography variant="button">GST Inclusive?</Typography>
                    <Typography variant="button">
                      {exp.tax_incl.toString()}
                    </Typography>
                  </Div>
                  <Div>
                    <Typography variant="button">CGST</Typography>
                    <Typography variant="button">{exp.cgst}%</Typography>
                  </Div>
                  <Div>
                    <Typography variant="button">SGST</Typography>
                    <Typography variant="button">{exp.sgst}%</Typography>
                  </Div>
                  <Div>
                    <Typography variant="button">IGST</Typography>
                    <Typography variant="button">{exp.igst}%</Typography>
                  </Div>
                  <Div>
                    <Typography variant="button">Total</Typography>
                    <Typography variant="button">
                      ₹
                      {exp.total_amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Div>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>
        <Grid item xs={12} md={4} p={2}>
          <AccentCard sx={{ p: 2, my: 2 }}>
            <Typography variant="h6" textAlign="center">
              Supplier
            </Typography>
            <Typography variant="h3" textAlign="center">
              {supplier && supplier.name}
            </Typography>
            <Typography variant="h6" textAlign="center">
              {supplier && supplier.number}
            </Typography>
            <Div>
              <Typography variant="button">Received Status</Typography>
              <Typography variant="button">
                {billParams.received_status ? "Received" : "Not received"}
              </Typography>
            </Div>
            <Div>
              <Typography variant="button">
                Buying Price GST Inclusive?
              </Typography>
              <Typography variant="button">
                {billParams.buying_price_gst_incl ? "Yes" : "No"}
              </Typography>
            </Div>

            {billParams.received_status === 0 ? (
              <MD3Button
                sx={{ mt: 4, width: "100%" }}
                variant="filled"
                size="large"
                color="primary"
                onClick={markBillReceived}
              >
                Mark As Received
              </MD3Button>
            ) : (
              <Link
                to={
                  INVENTORY.PRODUCTS.PRINT_LABELS +
                  "?ids=" +
                  addedProducts.map((el) => {
                    if ((el.product as ProductType).bulk) {
                      return Array(Number(el.size)).fill(el.id)
                    } else if (!(el.product as ProductType).is_pieces) {
                      return Array(4).fill(el.id);
                    }
                    return [el.id];
                  }).flat().join(",")
                }
                target="_blank"
              >
                <MD3Button
                  sx={{ mt: 4, width: "100%" }}
                  variant="filled"
                  size="large"
                  color="primary"
                >
                  Print Labels
                </MD3Button>
              </Link>
            )}

            {/* <MD3Button
              sx={{ mt: 4, width: "100%" }}
              variant="filled"
              size="large"
              color="primary"
              // onClick={handleBillCreate}
            >
              Edit
            </MD3Button> */}
          </AccentCard>
          <AccentCard sx={{ p: 2, my: 2 }}>
            <Div>
              <Typography variant="button">Sub Total</Typography>
              <Typography variant="button">
                {"₹" +
                  totals.subtotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </Typography>
            </Div>
            <Div>
              <Typography variant="button">Taxes</Typography>
              <Typography variant="button">
                {"₹" +
                  totals.taxes.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </Typography>
            </Div>
            <Div>
              <Typography variant="button">Total</Typography>
              <Typography variant="button">
                {"₹" +
                  totals.total.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </Typography>
            </Div>
            <Div>
              <Typography variant="button">Discount</Typography>
              <Typography variant="button">
                {"₹" +
                  totals.discount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </Typography>
            </Div>
            <Div>
              <Typography variant="button">Extra Expenses</Typography>
              <Typography variant="button">
                {"₹" +
                  totals.extra_expenses.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </Typography>
            </Div>
            <Div>
              <Typography variant="button">Round Off</Typography>
              <Typography variant="button">
                {"₹" +
                  totals.roundoff.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </Typography>
            </Div>
            <Typography
              variant="button"
              textAlign="center"
              width="100%"
              component="div"
            >
              total payable
            </Typography>
            <Typography variant="h3" textAlign="center">
              {"₹" +
                totals.payable.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </Typography>
          </AccentCard>
        </Grid>
      </Grid>
    </>
  );
}
