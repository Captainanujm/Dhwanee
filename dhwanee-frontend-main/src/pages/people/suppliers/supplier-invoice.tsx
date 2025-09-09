import {
  Grid,
  TextField,
  Typography,
  Stack,
  Card,
  CardContent,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Checkbox,
  CardActions,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";

// import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

//   import AddStaffModal from "src/./add-staff-modal";
import DataTable from "src/components/data-table";
import { ProductType } from "src/types/inventory";
import Div from "src/components/div";
import { Add, CloseTwoTone, DeleteTwoTone } from "@mui/icons-material";
// import dateToIsoString from "src/utils/date-to-string";
import AccentCard from "src/components/accent-card";
import roundOff from "src/utils/round-off";
import {
  SupplierType,
  SupplierBillItemType,
  SupplierBillExtraExpenseAtCreation,
} from "src/types/suppliers";
import AddSupplierModal from "src/pages/people/suppliers/add-supplier-modal";
import SupplierAutoComplete from "src/components/autocompletes/supplier-autocomplete";
import ProductAutoComplete from "src/components/autocompletes/product-autocomplete";
import { createSupplierBill, getOneSupplier } from "src/api/suppliers";
import AddProductModal from "src/pages/inventory/products/add-product-modal";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useNavigate } from "react-router-dom";
import MD3Button from "src/components/md3-button";

function NewBillAddItem(props: {
  supplier_state: string;
  buying_price_gst_incl: boolean;
  addItem: (item: SupplierBillItemType & { product: ProductType }) => any;
}) {
  const [product, setProduct] = useState<ProductType | null>(null);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [currentProps, setCurrentProps] = useState<SupplierBillItemType>({
    product: null,
    tax: null,
    quantity: 0,
    buying_price: 0,
    buying_cgst: 0,
    buying_sgst: 0,
    buying_igst: 0,
  });
  const [apparentBuyingPrice, setApparentBuyingPrice] = useState<number>(0);
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();
  console.log(currentProps);
  useEffect(() => {
    if (product) {
      setCurrentProps((_curr) => ({
        product,
        tax: product.default_tax,
        quantity: 0,
        buying_price: 0,
        buying_sgst:
          _curr.buying_cgst || _curr.buying_sgst || _curr.buying_igst
            ? _curr.buying_sgst
            : props.supplier_state === "UTTAR PRADESH - 09"
            ? product.default_tax / 2 || 0
            : 0,
        buying_cgst:
          _curr.buying_cgst || _curr.buying_sgst || _curr.buying_igst
            ? _curr.buying_cgst
            : props.supplier_state === "UTTAR PRADESH - 09"
            ? product.default_tax / 2 || 0
            : 0,
        buying_igst:
          _curr.buying_cgst || _curr.buying_sgst || _curr.buying_igst
            ? _curr.buying_igst
            : props.supplier_state === "UTTAR PRADESH - 09"
            ? 0
            : product.default_tax || 0,
      }));
      if (props.buying_price_gst_incl) {
        setApparentBuyingPrice(0);
      }
    }
  }, [product, props.buying_price_gst_incl, props.supplier_state]);

  useEffect(() => {
    setCurrentProps((_curr) => {
      let buying_price = _curr.buying_price;
      if (props.buying_price_gst_incl) {
        buying_price = apparentBuyingPrice;
        buying_price = roundOff(
          buying_price /
            (1 +
              (Number(_curr.buying_cgst) +
                Number(_curr.buying_sgst) +
                Number(_curr.buying_igst)) /
                100)
        );
      }

      return {
        ..._curr,
        buying_price,
      };
    });
  }, [
    props.buying_price_gst_incl,
    currentProps.buying_price,
    apparentBuyingPrice,
  ]);

  const buying_tax =
    Number(currentProps.buying_cgst || 0) +
    Number(currentProps.buying_sgst || 0) +
    Number(currentProps.buying_igst || 0);

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Div>
            <Typography variant="h5">Add Item</Typography>
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<Add />}
              onClick={() => setAddProductModalOpen(true)}
            >
              Add Product
            </Button>
          </Div>
          <Stack gap={1} my={2}>
            <ProductAutoComplete
              product={product}
              setProduct={setProduct}
              token={tokens ? tokens.access : null}
              finished={false}
            />
            <TextField
              variant="outlined"
              sx={{ minWidth: "320px" }}
              required
              label="Quantity in kg"
              type="number"
              value={currentProps.quantity === 0 ? "" : currentProps.quantity}
              onChange={(evt) =>
                setCurrentProps({
                  ...currentProps,
                  quantity: Number(evt.target.value),
                })
              }
            />
            <Typography variant="button">Buying Information</Typography>
            <Div sx={{flexWrap: "nowrap", gap: 3}}>
            <TextField
                sx={{ width: "50%" }}
              variant="outlined"
              type="number"
              required
              label="Buying Tax %"
              value={buying_tax || ""}
              onChange={(evt) => {
                if (props.supplier_state === "UTTAR PRADESH - 09") {
                  setCurrentProps({
                    ...currentProps,
                    buying_cgst: Number(evt.target.value) / 2,
                    buying_sgst: Number(evt.target.value) / 2,
                    buying_igst: 0,
                  });
                } else {
                  setCurrentProps({
                    ...currentProps,
                    buying_cgst: 0,
                    buying_sgst: 0,
                    buying_igst: Number(evt.target.value),
                  });
                }
              }}
            />
              <TextField
                sx={{ width: "50%" }}
                variant="outlined"
                type="number"
                required
                label="Buying Price"
                value={
                  props.buying_price_gst_incl
                    ? apparentBuyingPrice === 0
                      ? ""
                      : apparentBuyingPrice
                    : currentProps.buying_price === 0
                    ? ""
                    : currentProps.buying_price
                }
                onChange={(evt) => {
                  if (props.buying_price_gst_incl) {
                    setApparentBuyingPrice(Number(evt.target.value));
                  } else {
                    setCurrentProps({
                      ...currentProps,
                      buying_price: Number(evt.target.value),
                    });
                  }
                }}
              />
            </Div>
          </Stack>
          <Div sx={{flexWrap: "nowrap"}}>
            <MD3Button
              sx={{width: "100%"}}
              variant="filledTonal"
              onClick={() => {
                setProduct(null);
                setCurrentProps((_curr) => ({
                  ..._curr,
                  product: null,
                  cgst: null,
                  sgst: null,
                  igst: null,
                  quantity: 0,
                  buying_price: 0,
                  selling_price: 0,
                }));
              }}
            >
              Clear Data
            </MD3Button>
            <MD3Button
              sx={{width: "100%"}}
              variant="filled"
              onClick={() => {
                if (product && currentProps.quantity)
                  props.addItem({
                    product: product,
                    quantity: currentProps.quantity,
                    tax: currentProps.tax,
                    buying_price: currentProps.buying_price,
                    buying_cgst: currentProps.buying_cgst,
                    buying_sgst: currentProps.buying_sgst,
                    buying_igst: currentProps.buying_igst,
                  });
                else
                  dispatch(
                    showSnackbar({
                      text: "Please select a valid product and quantity",
                    })
                  );
                setProduct(null);
                setApparentBuyingPrice(0);
                setCurrentProps((_curr) => ({
                  ..._curr,
                  product: null,
                  cgst: null,
                  sgst: null,
                  igst: null,
                  quantity: 0,
                  buying_price: 0,
                  selling_price: 0,
                }));
              }}
            >
              Add
            </MD3Button>
          </Div>
        </CardContent>
      </Card>
      <AddProductModal
        open={addProductModalOpen}
        handleClose={() => setAddProductModalOpen(false)}
        onAdd={(prod) => {
          setProduct(prod);
          setAddProductModalOpen(false);
        }}
      />
    </>
  );
}

function AddExtraExpenseCard(props: {
  onAdd: (arg0: SupplierBillExtraExpenseAtCreation) => any;
}) {
  const [isGstInclusive, setGstInclusive] = useState(false);
  const [basicDetails, setBasicDetails] = useState({
    description: "",
    amount: "",
  });
  const [taxInfo, setTaxInfo] = useState({ cgst: "0", sgst: "0", igst: "0" });
  return (
    <Card sx={{ maxWidth: "400px", width: "min-content" }} variant="outlined">
      <CardContent
        sx={{ display: "flex", flexDirection: "column", width: "min-content" }}
      >
        <Typography variant="button">Details</Typography>
        <TextField
          sx={{ width: "80%", minWidth: "320px" }}
          variant="outlined"
          required
          label="Description of the expense"
          value={basicDetails.description}
          onChange={(evt) => {
            setBasicDetails({
              ...basicDetails,
              description: evt.target.value,
            });
          }}
        />

        <TextField
          variant="outlined"
          sx={{ width: "80%", minWidth: "320px", mt: 1 }}
          required
          type="number"
          label="Amount"
          value={basicDetails.amount === "0" ? "" : basicDetails.amount}
          onChange={(evt) => {
            setBasicDetails({
              ...basicDetails,
              amount: evt.target.value,
            });
          }}
        />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          gap={0}
        >
          <Checkbox
            checked={isGstInclusive}
            onChange={(evt) => setGstInclusive(evt.target.checked)}
            inputProps={{ "aria-label": "controlled" }}
          />
          <Typography>GST Inclusive?</Typography>
        </Stack>
        {isGstInclusive && (
          <>
            <Typography variant="button">Tax Information</Typography>
            <Div>
              <TextField
                sx={{ width: "30%" }}
                variant="outlined"
                type="number"
                required
                label="CGST"
                value={taxInfo.cgst === "0" ? "" : taxInfo.cgst}
                onChange={(evt) =>
                  setTaxInfo({
                    ...taxInfo,
                    cgst: evt.target.value,
                  })
                }
              />
              <TextField
                sx={{ width: "30%" }}
                variant="outlined"
                type="number"
                required
                label="SGST"
                value={taxInfo.sgst === "0" ? "" : taxInfo.sgst}
                onChange={(evt) =>
                  setTaxInfo({
                    ...taxInfo,
                    sgst: evt.target.value,
                  })
                }
              />
              <TextField
                sx={{ width: "30%" }}
                variant="outlined"
                type="number"
                required
                label="IGST"
                value={taxInfo.igst === "0" ? "" : taxInfo.igst}
                onChange={(evt) =>
                  setTaxInfo({
                    ...taxInfo,
                    igst: evt.target.value,
                  })
                }
              />
            </Div>
            <Div>
              <Typography variant="button">Total</Typography>
              <Typography variant="button">
                ₹
                {(
                  Number(basicDetails.amount) *
                  (1 +
                    (Number(taxInfo.cgst) +
                      Number(taxInfo.sgst) +
                      Number(taxInfo.igst)) /
                      100)
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Div>
          </>
        )}
      </CardContent>
      <CardActions>
        <MD3Button
          color="primary"
          variant="filled"
          size="small"
          sx={{ width: "100%", mb: 2 }}
          onClick={() => {
            if (basicDetails.description !== "" && basicDetails.amount !== "") {
              props.onAdd({
                description: basicDetails.description,
                amount: Number(basicDetails.amount),
                tax_incl: isGstInclusive,
                cgst: Number(taxInfo.cgst),
                sgst: Number(taxInfo.sgst),
                igst: Number(taxInfo.igst),
                total_amount: roundOff(
                  Number(basicDetails.amount) *
                    (1 +
                      (Number(taxInfo.cgst) +
                        Number(taxInfo.sgst) +
                        Number(taxInfo.igst)) /
                        100)
                ),
              });
              setBasicDetails({ description: "", amount: "" });
            }
          }}
        >
          Add
        </MD3Button>
      </CardActions>
    </Card>
  );
}

export default function NewBill() {
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [supplier, setSupplier] = useState<SupplierType>();
  const [addedProducts, setAddedProducts] = useState<
    Array<SupplierBillItemType & { product: ProductType }>
  >([]);
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
    buying_price_gst_incl: false,
    received_status: 1,
  });
  const [extraExpenses, setExtraExpenses] = useState<
    SupplierBillExtraExpenseAtCreation[]
  >([]);

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleBillCreate = () => {
    if (tokens && supplier && addedProducts.length > 0) {
      dispatch(showLoader("Creating bill"));
      createSupplierBill(tokens.access, {
        supplier: supplier.id,
        date: billParams.date,
        number: billParams.number,
        products: addedProducts,
        cash_discount: Number(billParams.cash_discount),
        cash_discount_type: billParams.cash_discount_type,
        received_status: billParams.received_status === 1,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        buying_price_gst_incl: billParams.buying_price_gst_incl,
        extra_expenses: extraExpenses,
      })
        .then((data) => {
          navigate("/people/suppliers/" + supplier.id);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to create the supplier bill" }))
        )
        .finally(() => dispatch(hideLoader()));
    }
  };

  useEffect(() => {
    let subtotal = 0;
    addedProducts.forEach((el) => {
      subtotal += el.buying_price * (el.quantity || 0);
    });
    subtotal = roundOff(subtotal);
    let taxes = totals.cgst + totals.sgst + totals.igst;
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
      extra_expenses_total += el.total_amount;
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
    const search = new URLSearchParams(window.location.search);
    if (tokens && search.get("supplier")) {
      getOneSupplier(tokens.access, search.get("supplier") as string)
        .then((results) => {
          setSupplier(results);
        })
        .catch(() => {});
    }
  }, [tokens, setSupplier]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        New Supplier Bill
      </Typography>
      <Grid container>
        <Grid item xs={12} md={8} p={2}>
          <Typography variant="h6" sx={{ my: 2 }}>
            Supplier Information
          </Typography>
          <Stack direction="row" gap={2} mb={2} flexWrap="wrap">
            <Stack>
              <SupplierAutoComplete
                supplier={supplier}
                setSupplier={setSupplier}
                token={tokens ? tokens.access : null}
              />
              <Typography
                sx={{
                  textDecoration: "underline",
                  cursor: "pointer",
                  color: "grey",
                  fontSize: "small",
                }}
                onClick={() => setAddSupplierOpen(true)}
              >
                Create New
              </Typography>
            </Stack>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              gap={0}
            >
              <Checkbox
                checked={billParams.buying_price_gst_incl}
                onChange={(evt) =>
                  setBillParams({
                    ...billParams,
                    buying_price_gst_incl: evt.target.checked,
                  })
                }
                inputProps={{ "aria-label": "controlled" }}
                disabled={addedProducts.length > 0}
              />
              <Stack>
                <Typography>Buying Price GST Inclusive?</Typography>
                {addedProducts.length > 0 && (
                  <Typography
                    variant="caption"
                    fontSize="small"
                    color="gray"
                    sx={{ mt: -1 }}
                  >
                    Remove all products to change this option
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Stack>
          <Typography variant="h6" sx={{ my: 2 }}>
            Item Information
          </Typography>
          <DataTable
            header={[
              "s no.",
              "product",
              "buying price",
              "total buying price",
              "quantity",
              "remove",
            ]}
            rows={addedProducts.map((elem, index) => [
              index + 1,
              elem.product.name,
              "₹" + elem.buying_price,
              "₹" +
                roundOff(
                  elem.buying_price * (elem.quantity || 0)
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
              elem.quantity,
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setTotals({
                    ...totals,
                    cgst: roundOff(
                      totals.cgst -
                        (elem.buying_cgst || 0) *
                          elem.buying_price *
                          0.01 *
                          (elem.quantity || 1)
                    ),
                    sgst: roundOff(
                      totals.sgst -
                        (elem.buying_sgst || 0) *
                          elem.buying_price *
                          0.01 *
                          (elem.quantity || 1)
                    ),
                    igst: roundOff(
                      totals.igst -
                        (elem.buying_igst || 0) *
                          elem.buying_price *
                          0.01 *
                          (elem.quantity || 1)
                    ),
                  });
                  setAddedProducts(
                    addedProducts
                      .slice(0, index)
                      .concat(addedProducts.slice(index + 1))
                  );
                }}
              >
                <DeleteTwoTone fontSize="small" />
              </IconButton>,
            ])}
          />
          <Typography variant="h6" sx={{ my: 2 }}>
            Bill Information
          </Typography>
          <Stack direction="row" gap={2} mb={2} flexWrap="wrap">
            <TextField
              variant="outlined"
              sx={{ minWidth: "320px" }}
              required
              label="Bill Number"
              value={billParams.number}
              onChange={(evt) =>
                setBillParams({
                  ...billParams,
                  number: evt.target.value,
                })
              }
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Bill Date"
                value={billParams.date}
                format="dd MMM yy"
                onChange={(newValue) =>
                  newValue && setBillParams({ ...billParams, date: newValue })
                }
              />
            </LocalizationProvider>
            <FormControl fullWidth sx={{ maxWidth: "150px" }}>
              <InputLabel id="product-item-rows-select-label">
                Received Status
              </InputLabel>
              <Select
                labelId="product-item-rows-select-label"
                id="product-item-rows-select"
                value={billParams.received_status}
                label="Received Status"
                onChange={(ev) =>
                  setBillParams({
                    ...billParams,
                    received_status: Number(ev.target.value),
                  })
                }
              >
                <MenuItem value={0}>In transit</MenuItem>
                <MenuItem value={1}>Received</MenuItem>
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
            Cash Discount
          </Typography>
          <Stack direction="row" gap={2} mb={2} flexWrap="wrap">
            <TextField
              variant="outlined"
              sx={{ minWidth: "320px" }}
              required
              label="Cash Discount"
              value={
                billParams.cash_discount === 0 ? "" : billParams.cash_discount
              }
              onChange={(evt) =>
                setBillParams({
                  ...billParams,
                  cash_discount: evt.target.value,
                })
              }
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
              >
                <MenuItem value="percentage">Percentage (%)</MenuItem>
                <MenuItem value="amount">Amount (₹)</MenuItem>
              </Select>
            </FormControl>
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
                  <div style={{ width: "100%" }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setExtraExpenses(
                          extraExpenses
                            .slice(0, ind)
                            .concat(extraExpenses.slice(ind + 1))
                        );
                      }}
                      sx={{ float: "right" }}
                    >
                      <CloseTwoTone fontSize="small" />
                    </IconButton>
                  </div>
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
            <AddExtraExpenseCard
              onAdd={(expense) => setExtraExpenses([...extraExpenses, expense])}
            />
          </Stack>
        </Grid>
        <Grid item xs={12} md={4} p={2}>
          <NewBillAddItem
            buying_price_gst_incl={billParams.buying_price_gst_incl}
            supplier_state={supplier ? supplier.state : "UTTAR PRADESH - 09"}
            addItem={(item) => {
              var found = false;
              for (var i = 0; i < addedProducts.length; i++)
                if (
                  addedProducts[i].product &&
                  addedProducts[i].product.id === item.product.id
                ) {
                  found = true;
                  break;
                }
              if (found) {
                dispatch(
                  showSnackbar({ text: "this product has already been added" })
                );
                return;
              } else {
                setAddedProducts([...addedProducts, item]);
              }
              setTotals({
                ...totals,
                cgst: roundOff(
                  totals.cgst +
                    (item.buying_cgst || 0) *
                      item.buying_price *
                      0.01 *
                      (item.quantity || 1)
                ),
                sgst: roundOff(
                  totals.sgst +
                    (item.buying_sgst || 0) *
                      item.buying_price *
                      0.01 *
                      (item.quantity || 1)
                ),
                igst: roundOff(
                  totals.igst +
                    (item.buying_igst || 0) *
                      item.buying_price *
                      0.01 *
                      (item.quantity || 1)
                ),
              });
            }}
          />
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
          <MD3Button
            sx={{ mt: 4, width: "100%" }}
            variant="filled"
            size="large"
            color="primary"
            onClick={handleBillCreate}
          >
            Generate Bill
          </MD3Button>
        </Grid>
      </Grid>
      <AddSupplierModal
        open={addSupplierOpen}
        handleClose={() => setAddSupplierOpen(false)}
        onAdd={(supplier) => {
          setSupplier(supplier);
          setAddSupplierOpen(false);
        }}
      />
    </>
  );
}
