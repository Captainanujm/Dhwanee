import { Box, Divider, Grid, Stack, Typography, styled } from "@mui/material";
import { getOneChallan } from "src/api/billing";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "src/redux/hooks";
import roundOff from "src/utils/round-off";
import logo from "src/assets/anera-logo.png";
import { MailOutline, Public, WhatsApp } from "@mui/icons-material";
import { ProductItemType, ProductType } from "src/types/inventory";

const LargeFont = styled("div")({
  fontSize: "50px",
  fontWeight: 800,
  color: "#464646",
});

const BoldFont = styled("span")({
  fontSize: "21pt",
  fontWeight: 650,
  color: "#464646",
  textTransform: "uppercase",
  letterSpacing: "2px",
});

const Div = styled("div")({
  fontSize: "21pt",
  fontWeight: 500,
  color: "#464646",
});

const Row = styled("div")({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  width: "100%",
});

export default function PrintChallanView() {
  const [challan, setChallan] = useState<any>();
  const [taxinfo, setTaxinfo] = useState<{
    [perc: string]: { cgst: number; sgst: number; igst: number };
  }>();

  const { id } = useParams();
  const tokens = useAppSelector((state) => state.auth.tokens);

  useEffect(() => {
    if (tokens && id) {
      getOneChallan(tokens.access, id).then((data) => setChallan(data));
    }
  }, [tokens, id]);

  useEffect(() => {
    if (challan) {
      var tax_info: {
        [perc: string]: { cgst: number; sgst: number; igst: number };
      } = {};
      var sgst: number,
        cgst: number,
        igst: number,
        unit_price_before_tax: number,
        price_before_tax: number;
      challan.items.forEach((item: any) => {
        const elem: ProductItemType = item.product;
        unit_price_before_tax = roundOff(
          Number(elem.price) * (100 / (100 + Number(elem.tax)))
        );

        price_before_tax = roundOff(unit_price_before_tax * Number(elem.size||1)
        );

        cgst =
          challan.customer.state === "UTTAR PRADESH - 09"
            ? roundOff((Number(elem.tax) / 2) * 0.01 * price_before_tax)
            : 0;
        sgst = cgst;
        igst =
          challan.customer.state !== "UTTAR PRADESH - 09"
            ? roundOff(Number(elem.tax) * 0.01 * price_before_tax)
            : 0;
        if (Object.keys(tax_info).includes(elem.tax as unknown as string)) {
          tax_info[elem.tax as unknown as string].cgst += cgst;
          tax_info[elem.tax as unknown as string].sgst += sgst;
        } else if (Number(elem.tax) !== 0) {
          tax_info[elem.tax as unknown as string] = {
            cgst: cgst,
            sgst: sgst,
            igst: 0,
          };
        }
        if (Object.keys(tax_info).includes(elem.tax as unknown as string)) {
          tax_info[elem.tax as unknown as string].igst += igst;
        } else if (Number(elem.tax) !== 0) {
          tax_info[elem.tax as unknown as string] = {
            igst: igst,
            sgst: 0,
            cgst: 0,
          };
        }
      });
      setTaxinfo(tax_info);
    }
  }, [challan]);

  // useEffect(() => {
  //   if (challan && taxinfo) {
  //     window.print();
  //   }
  // }, [challan, taxinfo]);

  return challan ? (
    <Stack
      sx={{
        width: "42cm",
        // border: "1px solid black",
        fontFamily: "'Montserrat'",
        position: "relative",
      }}
      alignItems="center"
    >
      <style media="print">
        {`
        @page {
          size: A4;
          margin: 24px;
        }
        `}
      </style>
      <Stack
        direction="row"
        width={"100%"}
        justifyContent="space-around"
        height="12cm"
        alignItems="center"
        sx={{ backgroundColor: "#eee" }}
      >
        <Stack>
          <LargeFont sx={{ fontWeight: 700 }}>Delivery Challan</LargeFont>
          <Typography fontSize="x-large">
            Delivery Challan Number: {challan.number}
          </Typography>
          <Typography fontSize="x-large">
            Dated: {format(new Date(challan.date), "dd MMM yy HH:mm")}
          </Typography>
          {challan.po_number !== "" && (
            <Typography fontSize="x-large">
              PO Number: {challan.po_number}
            </Typography>
          )}
        </Stack>
        <img src={logo} alt="logo" style={{ width: "12cm" }} />
      </Stack>
      <Row sx={{ px: 2, mt: 3 }}>
        <Box maxWidth="30%">
          <BoldFont sx={{ textTransform: "uppercase", letterSpacing: "2px" }}>
            Customer
          </BoldFont>
          <Div>{challan.customer.name}</Div>
          <Div>{challan.customer.address}</Div>
          <Div>{challan.customer.number}</Div>
          <Div>{challan.customer.gstin}</Div>
        </Box>
        {challan.customer.shipping_address && (
          <Box maxWidth="30%">
            <BoldFont sx={{ textTransform: "uppercase", letterSpacing: "2px" }}>
              Ship To
            </BoldFont>
            <Div>{challan.customer.name}</Div>{" "}
            <Div>{challan.customer.shipping_address}</Div>{" "}
            <Div>{challan.customer.number}</Div>
          </Box>
        )}
        <Box maxWidth="30%">
          <BoldFont sx={{ textTransform: "uppercase", letterSpacing: "2px" }}>
            From
          </BoldFont>
          <Div>ANERA BY ASMITA VERMA</Div>
          <Div>8, Kazi Khera, Lal Bangla, Kanpur 208007</Div>
          <Div>+91 9569181611</Div>
          <Div>09AOQPV5824H1Z7</Div>
        </Box>
      </Row>
      {/* <BoldFont sx={{ mt: 2, alignSelf: "flex-start" }}>Items</BoldFont> */}
      <Div sx={{ width: "100%", mt: 2 }}>
        <table style={{ width: "100%" }}>
          <thead
            style={{
              background: "#eee",
              color: "#464646",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            <tr>
              <th style={{ padding: "16px 0" }}>#</th>
              <th style={{ padding: "16px 0" }}>Product</th>
              <th style={{ padding: "16px 0" }}>HSN Code</th>
              <th style={{ padding: "16px 0" }}>Orig Price</th>
              <th style={{ padding: "16px 0" }}>Cost Price</th>
              <th style={{ padding: "16px 0" }}>Qty</th>
              <th style={{ padding: "16px 0" }}>Discount</th>
              <th style={{ padding: "16px 0" }}>Tax</th>
              <th style={{ padding: "16px 0" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {challan.items.map((item: any, index: number) => {
              const elem: ProductItemType = item.product;
              var unit_price_before_tax = roundOff(
                Number(elem.price) * (100 / (100 + Number(elem.tax)))
              );

              var price_before_tax = roundOff(unit_price_before_tax * Number(elem.size||1)
              );

              var tax = roundOff(Number(elem.tax) * 0.01 * price_before_tax);

              var apparent_price_before_tax = roundOff(
                (Number(elem.price) + Number(elem.discount)) *
                  (100 / (100 + Number(elem.tax)))
              );

              return (
                <tr>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "12px 0",
                    }}
                  >
                    {index + 1}
                  </td>
                  <td
                    style={{
                      padding: "12px 0",
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      // variant="body1"
                      // color="gray"
                      fontSize="21pt"
                    >
                      {(elem.product as ProductType).name}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="gray"
                      component="i"
                      fontSize="16pt"
                    >
                      {item.remarks}
                    </Typography>
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "12px 0",
                    }}
                  >
                    {(elem.product as ProductType).hsn}
                  </td> 
                  <td
                    style={{
                      textAlign: "center",
                      padding: "12px 0",
                    }}
                  >
                    {(apparent_price_before_tax * (1 + Number(elem.tax)/100) * 100 / (100 - Number(challan.customer.markdown))).toLocaleString('en-IN', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "12px 0",
                    }}
                  >
                    {apparent_price_before_tax}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "12px 0",
                    }}
                  >
                    {elem.size||1}pc
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "12px 0",
                    }}
                  >
                    {elem.discount}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "12px 0",
                    }}
                  >
                    {tax}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "12px 0",
                    }}
                  >
                    {roundOff(price_before_tax + tax)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Div>

      <Grid container sx={{mt: challan.items.length > 15 ? 20 : 'auto'}}>
        <Grid item xs={6} p={2} px={4} pt={8}>
          {taxinfo && (
            <>
              <BoldFont sx={{ mt: 2, alignSelf: "flex-start" }}>
                Tax Information
              </BoldFont>
              <Div sx={{ width: "100%", padding: "24px" }}>
                <table style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>%</th>
                      <th>CGST</th>
                      <th>SGST</th>
                      <th>IGST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(taxinfo).map((elem, index) => (
                      <tr key={index}>
                        <td style={{ textAlign: "center" }}>{elem}</td>
                        <td style={{ textAlign: "center" }}>
                          {roundOff(taxinfo[elem].cgst)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {roundOff(taxinfo[elem].sgst)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {roundOff(taxinfo[elem].igst)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Div>{" "}
            </>
          )}
          <BoldFont sx={{ mt: 12, alignSelf: "flex-start" }}>
            Bank Details
          </BoldFont>
          <Div sx={{ width: "100%", padding: "24px" }}>
            <table style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <td>Bank Name</td>
                  <td>HDFC BANK, LAL BANGLAW KANPUR</td>
                </tr>
                <tr>
                  <td>Bank Account No.</td>
                  <td>50200048592776</td>
                </tr>
                <tr>
                  <td>Bank IFSC code</td>
                  <td>HDFC0001475</td>
                </tr>
                <tr>
                  <td>Account holder's name</td>
                  <td> ANERA BY ASMITA VERMA</td>
                </tr>
              </tbody>
            </table>
          </Div>
        </Grid>
        <Grid item xs={6} p={2}>
          <Divider
            sx={{
              width: "90%",
              float: "right",
              my: 2,
              borderBottomWidth: "8px",
            }}
          />
          <table style={{ float: "right", minWidth: "90%" }}>
            <tbody>
              <tr>
                <td>
                  <BoldFont>Sub Total</BoldFont>
                </td>
                <td style={{ textAlign: "right" }}>
                  <BoldFont>
                    ₹
                    {roundOff(
                      Number(challan.subtotal) +
                        Number(challan.sgst) +
                        Number(challan.cgst) +
                        Number(challan.igst)
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </BoldFont>
                </td>
              </tr>
              <tr>
                <td>
                  <Div
                    sx={{ textTransform: "uppercase", letterSpacing: "2px" }}
                    color="#6a6a6a"
                  >
                    RoundOff
                  </Div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <Div>₹{challan.roundoff}</Div>
                </td>
              </tr>
              <tr>
                <td>
                  <BoldFont>Payable</BoldFont>
                </td>
                <td style={{ textAlign: "right" }}>
                  <BoldFont>₹{challan.total}</BoldFont>
                </td>
              </tr>
            </tbody>
          </table>
        </Grid>
      </Grid>
      <Stack
        direction="row"
        justifyContent="space-around"
        alignItems="center"
        style={{
          position: challan.items.length > 15 ? "relative" : "fixed",
          width: "42cm",
          height: "2cm",
          background: "#eee",
          bottom: 0,
          // transform: "translateY(-100%)",
        }}
      >
        {/* <Stack>
          <img style={{ width: "8cm" }} src={paytm} alt="paytm" />
          <img style={{ width: "8cm" }} src={paytmQR} alt="paytm" />
        </Stack> */}
        <Stack direction="row" justifyContent="space-between" width="100%">
          <Stack direction="row" gap={4} my={2}>
            <WhatsApp fontSize="large" />
            <Typography fontSize="x-large">+91-9569181611</Typography>
          </Stack>
          <Stack direction="row" gap={4} my={2}>
            <MailOutline fontSize="large" />
            <Typography fontSize="x-large">aneraatwork@gmail.com</Typography>
          </Stack>
          <Stack direction="row" gap={4} my={2}>
            <Public fontSize="large" />
            <Typography fontSize="x-large">www.anerabyav.com</Typography>
          </Stack>
        </Stack>
        {/* <Stack>
          <img style={{ width: "8cm" }} src={ig} alt="ig" />
          <img style={{ width: "8cm" }} src={igQR} alt="paytm" />
        </Stack> */}
      </Stack>
      {/* <Stack direction="row" justifyContent="space-between" width="100%">
        <Div>E. & O.E.</Div>
        <Div>SHN ERP</Div>
        <Div>9453268602</Div>
      </Stack> */}
    </Stack>
  ) : (
    <Div>Loading Details...</Div>
  );
}
