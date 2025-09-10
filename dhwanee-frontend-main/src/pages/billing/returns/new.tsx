import {
  Typography,
  Grid,
  Checkbox,
  CardContent,
  Box,
  CircularProgress,
} from "@mui/material";
import { createSalesReturn, getOneBill } from "src/api/billing";
import AccentCard from "src/components/accent-card";
import DataTable from "src/components/data-table";
import Div from "src/components/div";
import MD3Button from "src/components/md3-button";
import { showSnackbar } from "src/components/snackbar/reducer";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { ProductItemType } from "src/types/inventory";
import BillAutoComplete from "src/components/autocompletes/bills-autocomplete";

export default function SalesReturn() {
  const [loading, setLoading] = useState(false);
  const [billMinimal, setBillMinimal] = useState<any>();
  const [billDeepDetails, setBillDeepDetails] = useState<any>();
  //   const [taxinfo, setTaxinfo] = useState<{
  //     [perc: string]: { cgst: number; sgst: number; igst: number };
  //   }>();
  const [selectedProducts, setSelectedProducts] = useState<ProductItemType[]>(
    []
  );
  const [returnTotal, setReturnTotal] = useState(0);

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const createReturn = useCallback(() => {
    if (billDeepDetails && selectedProducts && tokens) {
      setLoading(true);
      createSalesReturn(tokens.access, {
        bill: billDeepDetails.id,
        products: selectedProducts.map((el) => el.id),
      })
        .then((data) => {
          navigate("/store/billing/returns/" + data.id);
          dispatch(showSnackbar({ text: "Return created successfully" }));
        })
        .catch((err) => {
          dispatch(showSnackbar({ text: "Failed to create the sales return" }));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [billDeepDetails, selectedProducts, tokens, dispatch, navigate]);

  useEffect(() => {
    if (tokens && billMinimal) {
      setLoading(true);
      getOneBill(tokens.access, billMinimal.id)
        .then((data) => {
          setBillDeepDetails(data);
          //   var tax_info: {
          //     [perc: string]: { cgst: number; sgst: number; igst: number };
          //   } = {};
          //   var sgst: number,
          //     cgst: number,
          //     igst: number,
          //     unit_price_before_tax: number,
          //     price_before_tax: number;
          //   data.products.forEach((elem: any) => {
          //     unit_price_before_tax = roundOff(
          //       Number(elem.selling_price) *
          //         (100 /
          //           (100 +
          //             Number(elem.cgst) +
          //             Number(elem.sgst) +
          //             Number(elem.igst)))
          //     );

          //     price_before_tax = roundOff(
          //       elem.product.unit === "pc" && !elem.product.bulk
          //         ? unit_price_before_tax
          //         : unit_price_before_tax * Number(elem.length)
          //     );

          //     cgst = roundOff(Number(elem.cgst) * 0.01 * price_before_tax);
          //     sgst = roundOff(Number(elem.sgst) * 0.01 * price_before_tax);
          //     igst = roundOff(Number(elem.igst) * 0.01 * price_before_tax);
          //     if (Object.keys(tax_info).includes(elem.cgst)) {
          //       tax_info[elem.cgst].cgst += cgst;
          //     } else if (elem.cgst !== "0.00") {
          //       tax_info[elem.cgst] = { cgst: cgst, sgst: 0, igst: 0 };
          //     }
          //     if (Object.keys(tax_info).includes(elem.sgst)) {
          //       tax_info[elem.sgst].sgst += sgst;
          //     } else if (elem.sgst !== "0.00") {
          //       tax_info[elem.sgst] = { sgst: sgst, cgst: 0, igst: 0 };
          //     }
          //     if (Object.keys(tax_info).includes(elem.igst)) {
          //       tax_info[elem.igst].igst += igst;
          //     } else if (elem.igst !== "0.00") {
          //       tax_info[elem.igst] = { igst: igst, sgst: 0, cgst: 0 };
          //     }
          //   });
          //   setTaxinfo(tax_info);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "Failed to load bill details" }))
        )
        .finally(() => setLoading(false));
    }
  }, [tokens, dispatch, billMinimal]);

  useEffect(() => {
    var total = 0;
    selectedProducts.forEach((el) => {
      if (typeof el.product === "object" && el.product.unit === "pc" && !el.product.bulk) {
        total += Number(el.price);
      } else if (typeof el.product === "object") {
        total += Number(el.price) * Number(el.size);
      }
    });
    setReturnTotal(total);
  }, [selectedProducts]);

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
      <Typography variant="h1" gutterBottom color="primary">
        New Sales Return
      </Typography>
      <BillAutoComplete
        bill={billMinimal}
        setBill={setBillMinimal}
        token={tokens?tokens.access:null}
      />
      {billDeepDetails ? (
        <Grid container>
          <Grid item xs={12} md={9} p={2}>
            <DataTable
              header={[
                "",
                "product id",
                "product name",
                "selling price",
                "qty",
              ]}
              rows={billDeepDetails.products.map((el: ProductItemType) => [
                <Checkbox
                  checked={selectedProducts.includes(el)}
                  onChange={(evt) => {
                    if (evt.target.checked) {
                      setSelectedProducts([...selectedProducts, el]);
                    } else {
                      setSelectedProducts(
                        selectedProducts.filter((val) => val !== el)
                      );
                    }
                  }}
                  inputProps={{ "aria-label": "controlled" }}
                />,
                el.uuid,
                typeof el.product === "object" ? el.product.name : "",
                "₹" +
                  (typeof el.product === "object" && el.product.unit === "pc" && !el.product.bulk
                    ? Number(el.price)
                    : Number(el.price) * Number(el.size)
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
                el.size && typeof el.product === "object" ? el.size + el.product.unit : "",
              ])}
            />
          </Grid>
          <Grid item xs={12} md={3} p={2}>
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
                  {billDeepDetails.customer.name}
                </Typography>
                <Div>
                  <Typography variant="button">Number</Typography>
                  <Typography variant="button">
                    {billDeepDetails.customer.number}
                  </Typography>
                </Div>
                <Div>
                  <Typography variant="button">Address</Typography>
                  <Typography variant="button">
                    {billDeepDetails.customer.address}
                  </Typography>
                </Div>
                <Div>
                  <Typography variant="button">GSTIN</Typography>
                  <Typography variant="button">
                    {billDeepDetails.customer.gstin}
                  </Typography>
                </Div>
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
                <Typography variant="button">Products returned</Typography>
                <Typography variant="h4" gutterBottom>
                  {selectedProducts.length}
                </Typography>
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
                <Typography variant="button">Total Returned Amount</Typography>
                <Typography variant="h4" gutterBottom>
                  ₹
                  {returnTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </CardContent>
            </AccentCard>
            <MD3Button
              variant="filled"
              color="primary"
              size="large"
              sx={{ width: "100%", my: 2 }}
              onClick={createReturn}
            >
              Create Return
            </MD3Button>
          </Grid>
        </Grid>
      ) : (
        <Typography variant="body2" color="gray" component="i">
          Select a bill to return items from it
        </Typography>
      )}
    </>
  );
}
