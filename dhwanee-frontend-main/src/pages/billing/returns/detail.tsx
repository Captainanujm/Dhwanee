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
import { useParams } from "react-router-dom";
import Div from "src/components/div";
import AccentCard from "src/components/accent-card";
import DataTable from "src/components/data-table";
import { getOneSalesReturns } from "src/api/billing";
import roundOff from "src/utils/round-off";
import MD3Button from "src/components/md3-button";

export default function CustomerDetails() {
  const [salesreturns, setSalesReturns] = useState<any>();
  const [loading, setLoading] = useState(false);

  const { id } = useParams();
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (tokens && id) {
      setLoading(true);
      getOneSalesReturns(tokens.access, id)
        .then((data) => {
          setSalesReturns(data);
        })
        .catch(() =>
          dispatch(
            showSnackbar({ text: "Failed to load salesreturns details" })
          )
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
      {salesreturns && (
        <Grid container sx={{ position: "relative", zIndex: 900 }}>
          <Grid item xs={8} sx={{ px: 1 }}>
            <Div sx={{ mb: 1 }}>
              <Typography variant="h5">Items</Typography>
            </Div>
            <DataTable
              header={["s no.", "product", "uuid", "unit price", "qty"]}
              rows={salesreturns.products.map((elem: any, index: number) => {
                return [
                  index + 1,
                  elem.product.name,
                  elem.uuid,
                  elem.product.unit === "pc" && !elem.product.bulk
                    ? Number(elem.selling_price)
                    : roundOff(
                        Number(elem.selling_price) * Number(elem.length)
                      ),
                  (elem.length ? elem.length : 1) + elem.product.unit,
                ];
              })}
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
                <Typography variant="button">Sales Return Number</Typography>
                <Typography variant="h4" gutterBottom>
                  {salesreturns.number}
                </Typography>
                <Typography variant="button" mt={2}>
                  Total
                </Typography>
                <Typography variant="h4">₹{salesreturns.total}</Typography>
                <Typography variant="button" mt={2}>
                  Number of items
                </Typography>
                <Typography variant="h4">
                  {salesreturns.products.length}
                </Typography>
                <MD3Button
                  variant="filled"
                  color="primary"
                  sx={{ width: "100%" }}
                  onClick={() => {
                    window.open("/billing/returns/print/" + id);
                  }}
                >
                  Print
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
                  {salesreturns.customer.name}
                </Typography>
                <Div>
                  <Typography variant="button">Number</Typography>
                  <Typography variant="button">
                    {salesreturns.customer.number}
                  </Typography>
                </Div>
                <Div>
                  <Typography variant="button">Address</Typography>
                  <Typography variant="button">
                    {salesreturns.customer.address}
                  </Typography>
                </Div>
                <Div>
                  <Typography variant="button">GSTIN</Typography>
                  <Typography variant="button">
                    {salesreturns.customer.gstin}
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
