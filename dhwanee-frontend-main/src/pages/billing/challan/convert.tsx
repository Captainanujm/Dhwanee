import { Grid, Typography, Stack, Checkbox } from "@mui/material";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";

import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

import DataTable from "src/components/data-table";
import { ProductItemType, ProductType } from "src/types/inventory";
import Div from "src/components/div";
import AccentCard from "src/components/accent-card";
import roundOff from "src/utils/round-off";
import {
  convertChallanToInvoice,
  //   createChallan,
  getOneChallan,
} from "src/api/billing";
import { CustomerType } from "src/types/customer";
import { useNavigate, useParams } from "react-router-dom";
import MD3Button from "src/components/md3-button";
import useApi from "src/utils/use-api";
import useEnsureAuth from "src/utils/ensure-login";

export default function NewChallan() {
  const [customer, setCustomer] = useState<CustomerType>();
  const [addedProducts, setAddedProducts] = useState<
    Array<ProductItemType & { remarks: string; is_converted: boolean }>
  >([]);
  const [displayData, setDisplayData] = useState<any[][]>([]);
  const [totals, setTotals] = useState<{
    subtotal: number;
    taxes: number;
    total: number;
    roundoff: number;
    payable: number;
    discount: number;
  }>({
    discount: 0,
    subtotal: 0,
    taxes: 0,
    total: 0,
    roundoff: 0,
    payable: 0,
  });
  const [challanNumber, setChallanNumber] = useState("");
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const call = useApi();
  const navigate = useNavigate();

  const ensureAuth = useEnsureAuth();
  useEffect(ensureAuth, [ensureAuth])

  const handleCreate = () => {
    if (tokens && id) {
      dispatch(showLoader("Converting to Invoice"));
      call(
        convertChallanToInvoice(
          tokens.access,
          id,
          addedProducts
            .map((elem) => (elem.is_converted ? elem.id : null))
            .filter((elem) => elem !== null) as number[]
        )
      ).then((data) => {
        navigate("/billing/old/" + data.bill);
        dispatch(showSnackbar({ text: "Converted Succesfully!", severity: "success" }));
      });
    }
  };

  useEffect(() => {
    var unit_price_before_tax, price_before_tax;
    var subtotal = 0;
    var taxes = 0;
    var total = 0;
    var discount = 0;
    setDisplayData(
      addedProducts.map((elem, index) => {
        unit_price_before_tax = roundOff(
          Number(elem.price) * (100 / (100 + Number(elem.tax)))
        );

        price_before_tax = roundOff(
          (elem.product as ProductType).is_pieces &&
            !(elem.product as ProductType).bulk
            ? unit_price_before_tax
            : unit_price_before_tax * Number(elem.size)
        );

        var tax = roundOff(Number(elem.tax) * 0.01 * price_before_tax);
        if (elem.is_converted) {
          subtotal += price_before_tax;
          taxes += tax;
          discount += Number(elem.discount);
          total += roundOff(price_before_tax + tax);
        }
        console.log(subtotal, taxes, total, discount);
        return [
          index + 1,
          elem.uuid,
          <Stack>
            <Typography>{(elem.product as ProductType).name}</Typography>
            <Typography
              component="i"
              fontSize="small"
              variant="caption"
              color="gray"
            >
              {elem.remarks}
            </Typography>
          </Stack>,
          unit_price_before_tax,
          elem.size,
          price_before_tax,
          tax,
          Number(elem.discount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          roundOff(price_before_tax + tax, 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          <Checkbox
            checked={elem.is_converted}
            onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
              const _added = addedProducts.slice();
              _added[index].is_converted = evt.target.checked;
              setAddedProducts(_added);
            }}
          />,
        ];
      })
    );
    const roundoff = roundOff(
      total % 1 > 0.49 ? 1 - (total % 1) : -(total % 1)
    );
    total += roundoff;
    setTotals({
      subtotal,
      taxes,
      discount,
      total: roundOff(total),
      roundoff,
      payable: total,
    });
  }, [addedProducts, customer]);

  useEffect(() => {
    if (tokens && id) {
      dispatch(showLoader("loading challan data"));
      getOneChallan(tokens.access, id)
        .then((data) => {
          setChallanNumber(data.number);
          //   setDate(new Date(data.date));
          //   if (poNumberRef.current) {
          //     poNumberRef.current.focus();
          //     poNumberRef.current.value = data.po_number;
          //   }
          setCustomer(data.customer);
          setAddedProducts(
            data.items.map((elem: any) => ({
              ...elem.product,
              remarks: elem.remarks,
              is_converted: true,
              id: elem.id,
            }))
          );
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "Failed to load challan details" }))
        )
        .finally(() => dispatch(hideLoader()));
    }
  }, [tokens, dispatch, id]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        Convert Challan: {challanNumber}
      </Typography>
      <Grid container>
        <Grid item xs={12} md={8} p={2}>
          <DataTable
            header={[
              "s no.",
              "uuid",
              "product name",
              "price",
              "quantity",
              "amount",
              "taxes",
              "discount",
              "total",
              "select",
            ]}
            rows={displayData}
          />
        </Grid>
        <Grid item xs={12} md={4} p={2}>
          <AccentCard sx={{ p: 2, my: 2 }}>
            <Div>
              <Typography variant="button">Sub Total</Typography>
              <Typography variant="button">
                {totals.subtotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Div>
            <Div>
              <Typography variant="button">Taxes</Typography>
              <Typography variant="button">
                {totals.taxes.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Div>
            <Div>
              <Typography variant="button">Discount</Typography>
              <Typography variant="button">
                {totals.discount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Div>
            <Div>
              <Typography variant="button">Total</Typography>
              <Typography variant="button">{totals.total}</Typography>
            </Div>
            <Div>
              <Typography variant="button">Round Off</Typography>
              <Typography variant="button">{totals.roundoff}</Typography>
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
              {totals.payable}
            </Typography>
          </AccentCard>
          <MD3Button
            sx={{ mt: 4, width: "100%" }}
            variant="filled"
            size="large"
            color="primary"
            onClick={() => handleCreate()}
          >
            Convert to Invoice
          </MD3Button>
        </Grid>
      </Grid>
    </>
  );
}
