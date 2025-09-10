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
import { getOnePurchaseReturn } from "src/api/suppliers";
import roundOff from "src/utils/round-off";
import format from "date-fns/format";
import { PurchaseReturnType } from "src/types/suppliers";

export default function PurchaseReturnDetails() {
  const [purchasereturn, setPurchaseReturn] = useState<PurchaseReturnType>();
  const [loading, setLoading] = useState(false);

  const { id } = useParams();
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();
  // const navigate = useNavigate();

  useEffect(() => {
    if (tokens && id) {
      setLoading(true);
      getOnePurchaseReturn(tokens.access, id)
        .then((data) => {
          setPurchaseReturn(data);
        })
        .catch(() =>
          dispatch(
            showSnackbar({ text: "Failed to load purchase return details" })
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
      {purchasereturn && (
        <Grid container sx={{ position: "relative", zIndex: 900 }}>
          <Grid item xs={8} sx={{ px: 1 }}>
            <Div sx={{ mb: 1 }}>
              <Typography variant="h5">Items</Typography>
            </Div>
            <DataTable
          header={[
            "s no.",
            "id",
            "product",
            "buying price",
            "quantity",
            "total",
          ]}
          rows={purchasereturn.products.map((elem, index) => [
            index + 1,
            elem.uuid,
            typeof elem.product === "object" ? elem.product.name : "",
            "₹" + elem.price,
            elem.size || 1,
            "₹" +
              roundOff(
                (Number(elem.price) || 0) * (Number(elem.size || 1))
              ).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
          ])}
        />
            <Div sx={{ mb: 1 }}>
              <Typography variant="h5">Ledger Entries</Typography>
            </Div>
            <DataTable
              header={["date", "remarks", "amount", "bal before", "bal after"]}
              rows={[
                [
                  format(
                    new Date(purchasereturn.ledger.date),
                    "dd/MM/yyyy hh:mm"
                  ),
                  purchasereturn.ledger.remarks,
                  purchasereturn.ledger.amount,
                  purchasereturn.ledger.balance_before,
                  purchasereturn.ledger.balance_after,
                ],
              ]}
            />
          </Grid>
          <Grid item xs={4}>
            <AccentCard sx={{mt: 2}}>
              <CardContent
                sx={{
                  alignItems: "center",
                  display: "flex",
                  flexDirection: "column",
                  padding: 2,
                }}
              >
                <Typography variant="button">PurchaseReturn Details</Typography>
                <Typography variant="h4" gutterBottom>
                  {purchasereturn.number}
                </Typography>
                <Div>
                  <Typography variant="button">Total</Typography>
                  <Typography variant="button">
                    ₹
                    {(
                      Number(purchasereturn.total) -
                      Number(purchasereturn.roundoff)
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Div>
                <Div>
                  <Typography variant="button">Round off</Typography>
                  <Typography variant="button">
                    ₹{purchasereturn.roundoff}
                  </Typography>
                </Div>
                <Typography variant="button">Payable</Typography>
                <Typography variant="h3">{purchasereturn.total}</Typography>

                {/* <MD3Button
                    sx={{ mt: 0, width: "100%" }}
                    variant="filled"
                    size="large"
                    color="primary"
                    onClick={() =>
                      window.open(
                        window.location.protocol +
                          "//" +
                          window.location.host +
                          "/purchasereturning/print/" +
                          purchasereturn.id,
                        "_blank"
                      )
                    }
                  >
                    Reprint purchasereturn
                  </MD3Button>
                  <MD3Button
                    sx={{ mt: 1, width: "100%" }}
                    variant="filled"
                    size="large"
                    color="secondary"
                    onClick={() =>
                      navigate("/store/purchasereturning/new?edit=true&purchasereturn=" + purchasereturn.id)
                    }
                  >
                    Edit Details
                  </MD3Button> */}
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
                <Typography variant="button">Supplier Details</Typography>
                <Typography variant="h4" gutterBottom>
                  {purchasereturn.supplier.name}
                </Typography>
                <Div>
                  <Typography variant="button">Number</Typography>
                  <Typography variant="button">
                    {purchasereturn.supplier.number}
                  </Typography>
                </Div>
                <Div>
                  <Typography variant="button">Address</Typography>
                  <Typography variant="button">
                    {purchasereturn.supplier.address}
                  </Typography>
                </Div>
                <Div>
                  <Typography variant="button">GSTIN</Typography>
                  <Typography variant="button">
                    {purchasereturn.supplier.gstin}
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
