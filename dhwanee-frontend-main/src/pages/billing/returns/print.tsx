import { Box, Stack, styled } from "@mui/material";
import { getOneSalesReturns } from "src/api/billing";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "src/redux/hooks";
import { SalesReturnFromDBType } from "src/types/billing";
import roundOff from "src/utils/round-off";

const LargeFont = styled("div")({
  fontSize: "50px",
  fontWeight: 800,
  color: "black",
});

const BoldFont = styled("span")({
  fontSize: "21pt",
  fontWeight: 650,
  color: "black",
});

const Div = styled("div")({
  fontSize: "21pt",
  fontWeight: 500,
  color: "black",
});

export default function PrintSaleReturnView() {
  const [salereturn, setSalereturn] = useState<SalesReturnFromDBType>();

  const { id } = useParams();
  const tokens = useAppSelector((state) => state.auth.tokens);

  useEffect(() => {
    if (tokens && id) {
      getOneSalesReturns(tokens.access, id).then((data) => setSalereturn(data));
    }
  }, [tokens, id]);

  useEffect(() => {
    if (salereturn) {
      window.print();
    }
  }, [salereturn]);

  return salereturn ? (
    <Stack
      sx={{
        width: "20cm",
        px: 2,
        // border: "1px solid black",
        tranform: "scale(1.5)",
        fontFamily: "'Roboto Slab'",
      }}
      justifyContent="center"
      alignItems="center"
    >
      <LargeFont>PAWAN</LargeFont>
      <LargeFont>TEXTILES</LargeFont>
      <BoldFont
        sx={{
          wordWrap: "break-word",
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        335A/2 chak raghunath,naini bazar, prayagraj.211008
      </BoldFont>
      <BoldFont
        sx={{
          wordWrap: "break-word",
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        9935620463
      </BoldFont>
      <Div>
        <BoldFont>GSTIN:</BoldFont>
        09AASPA1571A1Z1
      </Div>
      <BoldFont>Sales Return</BoldFont>
      <Box width="100%" px={2}>
        <Div>
          <BoldFont>Return No</BoldFont> {salereturn.number}
        </Div>
        <Div>
          <BoldFont>Dated</BoldFont>{" "}
          {format(new Date(salereturn.date), "dd/MM/yyyy hh:mm")}
        </Div>
        <Div>
          <BoldFont>Customer Name</BoldFont> {salereturn.customer.name}{" "}
          {salereturn.customer.number}
        </Div>
        <Div>
          <BoldFont>GSTIN</BoldFont> {salereturn.customer.gstin}
        </Div>
      </Box>
      <BoldFont sx={{ mt: 2, alignSelf: "flex-start" }}>Items</BoldFont>
      <Div sx={{ width: "100%" }}>
        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Amt</th>
            </tr>
          </thead>
          <tbody>
            {salereturn.products.map((elem: any, index: number) => {
              var price = roundOff(
                elem.product.unit === "pc" && !elem.product.bulk
                  ? Number(elem.selling_price)
                  : Number(elem.selling_price) * Number(elem.length),
                0
              );
              return (
                <tr>
                  <td>{index + 1}</td>
                  <td>
                    {elem.product.name}
                    <br />
                    {elem.uuid}
                  </td>
                  <td>{(elem.length ? elem.length : 1) + elem.product.unit}</td>
                  <td>{price}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Div>

      <BoldFont sx={{ mt: 2, alignSelf: "flex-start" }}>Totals</BoldFont>
      <table style={{ alignSelf: "flex-end" }}>
        <tbody>
          <tr>
            <td style={{ textAlign: "right", paddingRight: "12px" }}>
              <Div>Total</Div>
            </td>
            <td>
              <BoldFont>₹{salereturn.total}</BoldFont>
            </td>
          </tr>

          <tr>
            <td style={{ textAlign: "right", paddingRight: "12px" }}>
              <Div>Customer Opening Balance</Div>
            </td>
            <td>
              <Div>₹{salereturn.ledger.balance_before}</Div>
            </td>
          </tr>

          <tr>
            <td style={{ textAlign: "right", paddingRight: "12px" }}>
              <Div>Customer Closing Balance</Div>
            </td>
            <td>
              <Div>₹{salereturn.ledger.balance_after}</Div>
            </td>
          </tr>
        </tbody>
      </table>

      <BoldFont sx={{ textDecoration: "underlined" }}>
        Terms & Conditions
      </BoldFont>
      <Div sx={{ textAlign: "left", width: "100%" }}>
        1. Goods once sold cant be taken back
      </Div>
      <Div sx={{ textAlign: "left", width: "100%" }}>
        2. No guarantee no claim of colour and zari
      </Div>
      <Div sx={{ textAlign: "left", width: "100%" }}>
        3. Fancy Sarees and suits are recommended for dry clean only
      </Div>
      <Div sx={{ textAlign: "left", width: "100%" }}>
        4. All disputes are subject to prayagraj jurisdiction only
      </Div>
      <BoldFont
        sx={{
          width: "100%",
          textAlign: "center",
          textTransform: "uppercase",
          fontSize: "24pt",
        }}
      >
        THanks and please visit again
      </BoldFont>
      <Stack direction="row" justifyContent="space-between" width="100%">
        <Div>E. & O.E.</Div>
        <Div>SHN ERP</Div>
        <Div>9453268602</Div>
      </Stack>
    </Stack>
  ) : (
    <Div>Loading Details...</Div>
  );
}
