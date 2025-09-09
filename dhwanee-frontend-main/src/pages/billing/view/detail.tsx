import {
  Box,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import { showSnackbar } from "src/components/snackbar/reducer";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { useNavigate, useParams } from "react-router-dom";
import Div from "src/components/div";
import AccentCard from "src/components/accent-card";
import DataTable from "src/components/data-table";
import MD3Button from "src/components/md3-button";
import { getOneBill } from "src/api/billing";
import roundOff from "src/utils/round-off";
import format from "date-fns/format";
import { ProductItemType, ProductType } from "src/types/inventory";
import { BillType } from "src/types/billing";

export default function CustomerDetails() {
  const [bill, setBill] = useState<BillType>();
  const [taxinfo, setTaxinfo] = useState<{
    [perc: string]: { cgst: number; sgst: number; igst: number };
  }>();
  const [loading, setLoading] = useState(false);

  const { id } = useParams();
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (tokens && id) {
      setLoading(true);
      getOneBill(tokens.access, id)
        .then((data) => {
          setBill(data);
          var tax_info: {
            [perc: string]: { cgst: number; sgst: number; igst: number };
          } = {};
          var sgst: number,
            cgst: number,
            igst: number,
            unit_price_before_tax: number,
            price_before_tax: number;
          data.products.forEach((elem: ProductItemType) => {
            unit_price_before_tax = roundOff(
              Number(elem.price) * (100 / (100 + Number(elem.tax)))
            );

            price_before_tax = roundOff(
              (elem.product as ProductType).is_pieces && !(elem.product as ProductType).bulk
                ? unit_price_before_tax
                : unit_price_before_tax * Number(elem.size)
            );

            const tax = roundOff(Number(elem.tax) * 0.01 * price_before_tax);
            var percentage = "";
            if (data.customer.state === "UTTAR PRADESH - 09") {
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
          setTaxinfo(tax_info);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "Failed to load bill details" }))
        )
        .finally(() => setLoading(false));
    }
  }, [tokens, dispatch, id]);

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backdropFilter: "blur(8px)",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          display: loading ? "flex" : "none",
        }}
      >
        <CircularProgress />
      </Box>
      {bill && taxinfo && (
        <Grid container sx={{ position: "relative", zIndex: 900 }}>
          <Grid item xs={8} sx={{ px: 1 }}>
            <Div sx={{ mb: 1 }}>
              <Typography variant="h5">Items</Typography>
            </Div>
            <DataTable
              header={["s no.", "product", "uuid", "unit price", "qty", "amt"]}
              rows={bill.products.map((elem, index: number) => {
                var unit_price_before_tax = roundOff(
                  Number(elem.price) * (100 / (100 + Number(elem.tax)))
                );

                var price_before_tax = roundOff(
                  (elem.product as ProductType).is_pieces && !(elem.product as ProductType).bulk
                    ? unit_price_before_tax
                    : unit_price_before_tax * Number(elem.size)
                );

                var tax = roundOff(Number(elem.tax) * 0.01 * price_before_tax);
                var price = roundOff(price_before_tax + tax);
                return [
                  index + 1,
                  (elem.product as ProductType).name,
                  elem.uuid,
                  (elem.product as ProductType).is_pieces && !(elem.product as ProductType).bulk
                    ? price
                    : roundOff(price / Number(elem.size)),
                  (elem.size ? elem.size : 1) + ((elem.product as ProductType).is_pieces ? "pc" : "kg"),
                  price,
                ];
              })}
            />
            <Div sx={{ mb: 1 }}>
              <Typography variant="h5">Tax Information</Typography>
            </Div>
            <DataTable
              header={["%", "CGST", "SGST", "IGST"]}
              rows={Object.keys(taxinfo).map((elem) => [
                elem,
                taxinfo[elem].cgst,
                taxinfo[elem].sgst,
                taxinfo[elem].igst,
              ])}
            />
            <Div sx={{ mb: 1 }}>
              <Typography variant="h5">Payment Information</Typography>
            </Div>
            <DataTable
              header={["method", "amount"]}
              rows={bill.payments.map((elem) => [
                // actually it will be string but this is to silence ts
                elem.method?.name,
                "₹" + elem.amount,
              ])}
            />
            <Div sx={{ mb: 1 }}>
              <Typography variant="h5">Ledger Entries</Typography>
            </Div>
            <DataTable
              header={["date", "remarks", "amount", "bal before", "bal after"]}
              rows={bill.ledger.map((ledgerItem: any) => [
                format(new Date(ledgerItem.date), "dd/MM/yyyy hh:mm"),
                ledgerItem.remarks,
                ledgerItem.amount,
                ledgerItem.balance_before,
                ledgerItem.balance_after,
              ])}
            />
          </Grid>
          <Grid item xs={4}>
            <AccentCard>
              <CardContent
                sx={{
                  alignItems: "center",
                  display: "flex",
                  flexDirection: "column",
                  padding: 2,
                }}
              >
                <Typography variant="button">Bill Details</Typography>
                <Typography variant="h4" gutterBottom>
                  {bill.number}
                </Typography>
                <Div>
                  <Typography variant="button">Subtotal</Typography>
                  <Typography variant="button">{bill.subtotal}</Typography>
                </Div>
                <Div>
                  <Typography variant="button">CGST</Typography>
                  <Typography variant="button">{bill.cgst}</Typography>
                </Div>
                <Div>
                  <Typography variant="button">SGST</Typography>
                  <Typography variant="button">{bill.sgst}</Typography>
                </Div>
                <Div>
                  <Typography variant="button">IGST</Typography>
                  <Typography variant="button">{bill.igst}</Typography>
                </Div>
                <Div>
                  <Typography variant="button">Total</Typography>
                  <Typography variant="button">₹{bill.total}</Typography>
                </Div>
                <Div>
                  <Typography variant="button">Round off</Typography>
                  <Typography variant="button">₹{bill.roundoff}</Typography>
                </Div>
                <Div>
                  <Typography variant="button">Opening Balance</Typography>
                  <Typography variant="button">
                    ₹{bill.ledger[0].balance_before}
                  </Typography>
                </Div>
                <Typography variant="button">Payable</Typography>
                <Typography variant="h3">{bill.payable}</Typography>

                <MD3Button
                  sx={{ mt: 0, width: "100%" }}
                  variant="filled"
                  onClick={() =>
                    window.open(
                      window.location.protocol +
                        "//" +
                        window.location.host +
                        "/billing/print/" +
                        bill.id,
                      "_blank"
                    )
                  }
                >
                  Reprint bill
                </MD3Button>
                <MD3Button
                  sx={{ mt: 1, width: "100%" }}
                  variant="outlined"
                  
                  onClick={() =>
                    navigate("/billing/new?edit=true&bill=" + bill.id)
                  }
                >
                  Edit Details
                </MD3Button>
              </CardContent>
            </AccentCard>
            <AccentCard sx={{ mt: 2 }}>
              <CardContent
                sx={{
                  alignItems: "center",
                  display: "flex",
                  flexDirection: "column",
                  padding: 2,
                }}
              >
                <Typography variant="button">Customer Details</Typography>
                <Typography variant="h4" gutterBottom>
                  {bill.customer.name}
                </Typography>
                <Div>
                  <Typography variant="button">Number</Typography>
                  <Typography variant="button">
                    {bill.customer.number}
                  </Typography>
                </Div>
                <Div>
                  <Typography variant="button">Address</Typography>
                  <Typography variant="button">
                    {bill.customer.address}
                  </Typography>
                </Div>
                <Div>
                  <Typography variant="button">GSTIN</Typography>
                  <Typography variant="button">
                    {bill.customer.gstin}
                  </Typography>
                </Div>
              </CardContent>
            </AccentCard>
          </Grid>
        </Grid>
      )}
    </>
  );
}
