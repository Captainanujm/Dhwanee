import {
  Box,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { showSnackbar } from "src/components/snackbar/reducer";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { useNavigate, useParams } from "react-router-dom";
import Div from "src/components/div";
import AccentCard from "src/components/accent-card";
import DataTable from "src/components/data-table";
import { getOneChallan } from "src/api/billing";
import roundOff from "src/utils/round-off";
import MD3Button from "src/components/md3-button";
import { ProductType } from "src/types/inventory";
// import { hideLoader, showLoader } from "components/loader/reducer";

export default function CustomerDetails() {
  const [challan, setChallan] = useState<any>();
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
      getOneChallan(tokens.access, id)
        .then((data) => {
          setChallan(data);
          var tax_info: {
            [perc: string]: { cgst: number; sgst: number; igst: number };
          } = {};
          var sgst: number,
            cgst: number,
            igst: number,
            unit_price_before_tax: number,
            price_before_tax: number;
          data.items.forEach((el: any) => {
            const elem = el.product;
            unit_price_before_tax = roundOff(
              Number(elem.price) * (100 / (100 + Number(elem.tax)))
            );

            price_before_tax = roundOff(
              (elem.product as ProductType).is_pieces &&
                !(elem.product as ProductType).bulk
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
          dispatch(showSnackbar({ text: "Failed to load challan details" }))
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
      {challan && taxinfo && (
        <Grid container sx={{ position: "relative", zIndex: 900 }}>
          <Grid item xs={8} sx={{ px: 1 }}>
            <Div sx={{ mb: 1 }}>
              <Typography variant="h5">Items</Typography>
            </Div>
            <DataTable
              header={[
                "s no.",
                "product",
                "uuid",
                "price",
                "qty",
                "amt",
                "dis",
                "total",
              ]}
              rows={challan.items.map((item: any, index: number) => {
                const elem = item.product;
                var unit_price_before_tax = roundOff(
                  Number(elem.price) * (100 / (100 + Number(elem.tax)))
                );

                var price_before_tax = roundOff(
                  (elem.product as ProductType).is_pieces &&
                    !(elem.product as ProductType).bulk
                    ? unit_price_before_tax
                    : unit_price_before_tax * Number(elem.size)
                );

                var tax = roundOff(Number(elem.tax) * 0.01 * price_before_tax);
                var price = roundOff(price_before_tax + tax);
                return [
                  index + 1,

                  <Stack>
                    <Typography>{elem.product.name}</Typography>
                    <Typography
                      component="i"
                      fontSize="small"
                      variant="caption"
                      color="gray"
                    >
                      {item.remarks}
                    </Typography>
                  </Stack>,
                  elem.uuid,
                  (elem.product as ProductType).is_pieces &&
                  !(elem.product as ProductType).bulk
                    ? price
                    : roundOff(price / Number(elem.size)),
                  elem.size ? elem.size + "pc" : "",
                  price,
                  elem.discount,
                  roundOff(price),
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
                <Typography variant="button">Challan Details</Typography>
                <Typography variant="h4" gutterBottom>
                  {challan.number}
                </Typography>
                <Div>
                  <Typography variant="button">Subtotal</Typography>
                  <Typography variant="button">{challan.subtotal}</Typography>
                </Div>
                <Div>
                  <Typography variant="button">CGST</Typography>
                  <Typography variant="button">{challan.cgst}</Typography>
                </Div>
                <Div>
                  <Typography variant="button">SGST</Typography>
                  <Typography variant="button">{challan.sgst}</Typography>
                </Div>
                <Div>
                  <Typography variant="button">IGST</Typography>
                  <Typography variant="button">{challan.igst}</Typography>
                </Div>
                <Div>
                  <Typography variant="button">Discount</Typography>
                  <Typography variant="button">
                    ₹
                    {(() => {
                      var discount = 0;
                      challan.items.forEach((el: any) => {
                        discount += Number(el.product.discount);
                      });
                      return discount;
                    })()}
                  </Typography>
                </Div>
                <Div>
                  <Typography variant="button">Round off</Typography>
                  <Typography variant="button">₹{challan.roundoff}</Typography>
                </Div>
                <Div>
                  <Typography variant="button">Total</Typography>
                  <Typography variant="button">₹{challan.total}</Typography>
                </Div>
                <Typography variant="button">Conversion status</Typography>
                <Typography
                  variant="h5"
                  textTransform="uppercase"
                  textAlign="center"
                  fontWeight={600}
                >
                  {challan.converted_to === null
                    ? "Not Converted"
                    : "Converted to " + challan.converted_to}
                </Typography>
                    
                <MD3Button
                  sx={{ mt: 0, width: "100%" }}
                  variant="filled"
                  size="large"
                  color="primary"
                  onClick={() =>
                    window.open(
                      window.location.protocol +
                        "//" +
                        window.location.host +
                        "/billing/challan/edit/" +
                        challan.id,
                      "_blank"
                    )
                  }
                >
                  Edit challan
                </MD3Button>
                <MD3Button
                  sx={{ mt: 1, width: "100%" }}
                  variant="filled"
                  size="large"
                  color="primary"
                  onClick={() =>
                    window.open(
                      window.location.protocol +
                        "//" +
                        window.location.host +
                        "/billing/challan/print/" +
                        challan.id,
                      "_blank"
                    )
                  }
                >
                  Reprint challan
                </MD3Button>
                {challan.converted_to === null && (
                  <MD3Button
                    sx={{ mt: 1, width: "100%" }}
                    variant="filled"
                    size="large"
                    color="secondary"
                    onClick={() =>
                      navigate("/billing/challan/convert/" + challan.id)
                    }
                  >
                    convert to invoice
                  </MD3Button>
                )}
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
                  {challan.customer.name}
                </Typography>
                <Div>
                  <Typography variant="button">Number</Typography>
                  <Typography variant="button">
                    {challan.customer.number}
                  </Typography>
                </Div>
                <Div>
                  <Typography variant="button">Address</Typography>
                  <Typography variant="button">
                    {challan.customer.address}
                  </Typography>
                </Div>
                <Div>
                  <Typography variant="button">GSTIN</Typography>
                  <Typography variant="button">
                    {challan.customer.gstin}
                  </Typography>
                </Div>
              </CardContent>
            </AccentCard>
            {challan.ship_to && (
              <AccentCard sx={{ mt: 2 }}>
                <CardContent
                  sx={{
                    alignItems: "center",
                    display: "flex",
                    flexDirection: "column",
                    padding: 2,
                  }}
                >
                  <Typography variant="button">
                    Ship to Customer Details
                  </Typography>
                  <Typography variant="h4" gutterBottom>
                    {challan.ship_to.name}
                  </Typography>
                  <Div>
                    <Typography variant="button">Number</Typography>
                    <Typography variant="button">
                      {challan.ship_to.number}
                    </Typography>
                  </Div>
                  <Div>
                    <Typography variant="button">Address</Typography>
                    <Typography variant="button">
                      {challan.ship_to.address}
                    </Typography>
                  </Div>
                  <Div>
                    <Typography variant="button">GSTIN</Typography>
                    <Typography variant="button">
                      {challan.ship_to.gstin}
                    </Typography>
                  </Div>
                </CardContent>
              </AccentCard>
            )}
          </Grid>
        </Grid>
      )}
    </>
  );
}
