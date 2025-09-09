import {
  Grid,
  TextField,
  Typography,
  Stack,
  Card,
  CardContent,
  IconButton,
  Checkbox,
  FormControlLabel,
  Alert,
  AlertTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";

//   import StaffType from "src/types/staffs";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

//   import AddStaffModal from "./add-staff-modal";
import DataTable from "src/components/data-table";
import { ProductItemType, ProductType } from "src/types/inventory";
import Div from "src/components/div";
import MD3Button from "src/components/md3-button";
import {
  DeleteTwoTone,
  Looks5TwoTone,
  LooksOneTwoTone,
} from "@mui/icons-material";
import dateToIsoString from "src/utils/date-to-string";
import AccentCard from "src/components/accent-card";
import roundOff from "src/utils/round-off";
import { createBill, getOneBill, updateBill } from "src/api/billing";
import { CustomerType } from "src/types/customer";
import AddCustomerModal from "src/pages/people/customers/add-customer-modal";
import CustomerAutoComplete from "src/components/autocompletes/customer-autocomplete";
import ProductItemAutoComplete from "src/components/autocompletes/productitem-autocomplete";
import { searchCustomers } from "src/api/customers";
import { useNavigate } from "react-router-dom";
import NewBillDiscountEdit from "src/components/new-bill-discount-edit";
import { BillType } from "src/types/billing";
import useEnsureAuth from "src/utils/ensure-login";
import { searchPaymentMethods } from "src/api/accounting";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export default function NewBill() {
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [product, setProduct] = useState<ProductItemType | null>(null);
  const [customer, setCustomer] = useState<CustomerType>();
  const [addedProducts, setAddedProducts] = useState<Array<ProductItemType>>(
    []
  );
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
  const [paymentModes, setPaymentModes] = useState<{
    [id: number | string]: { amount: number; enabled: boolean; name: string };
  }>({});
  const [received, setReceived] = useState(0);
  const [editingData, setEditingData] = useState({
    editing: false,
    opening_balance: 0,
    number: "",
    id: "",
  });
  const [usePreviousBalance, setUsePreviousBalance] = useState(false);
  const [date, setDate] = useState(new Date());
  const tokens = useAppSelector((state) => state.auth.tokens);
  const authBody = useAppSelector((state) => state.auth.body);
  const [billBranch, setBillBranch] = useState<number>(0);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const ensureAuth = useEnsureAuth();
  useEffect(ensureAuth, [ensureAuth]);

  const quantityRef = useRef<HTMLInputElement>();
  const poNumberRef = useRef<HTMLInputElement>();

  useEffect(() => {
    if (authBody) {
      if (authBody.branch.length === 1) {
        setBillBranch(authBody.branch[0].id);
      }
    } else {
      dispatch(
        showSnackbar({
          text: "Could not load user branch data. Are you logged in?",
          severity: "error",
        })
      );
    }
  }, [authBody, dispatch]);

  const handleCreate = () => {
    if (tokens && poNumberRef.current && customer && addedProducts.length > 0) {
      dispatch(showLoader("crteating products"));
      const bill_data = {
        date: dateToIsoString(date),
        branch: billBranch,
        customer: customer.id,
        po_number: poNumberRef.current.value,
        use_previous_balance: usePreviousBalance,
        products: addedProducts.map((elem) => {
          if (elem.size)
            return {
              id: elem.id,
              size: Number(elem.size),
              parent: elem.parent,
              discount: elem.discount,
              price: elem.price,
            };
          return {
            id: elem.id,
            size: null,
            parent: null,
            discount: elem.discount,
            price: elem.price,
          };
        }),
        payments: Object.keys(paymentModes).map((payment) => {
          if (paymentModes[payment].enabled) {
            return {
              id: payment,
              amount: paymentModes[payment].amount,
            };
          }
          return null;
        }),
      };
      var create;
      if (editingData.editing)
        create = updateBill(
          tokens.access,
          editingData.id,
          bill_data as unknown as BillType
        );
      else create = createBill(tokens.access, bill_data);
      create
        .then((data) => {
          window.open(
            window.location.protocol +
              "//" +
              window.location.host +
              "/billing/print/" +
              data.bill,
            "_blank"
          );
          dispatch(showSnackbar({ text: "bill created succesfully" }));
          if (editingData.editing) navigate("/billing/old/" + editingData.id);
          else {
            setAddedProducts([]);
            setProduct(null);
            var modes = { ...paymentModes };
            Object.keys(modes).forEach((e) => {
              modes[e].enabled = false;
              modes[e].amount = 0;
            });
            setPaymentModes(modes);
            searchCustomers(tokens.access, "WALK IN", 1, 10).then((results) => {
              if (results.results.length === 1) {
                setCustomer(results.results[0]);
              }
            });
          }
        })
        .catch((err) =>
          dispatch(
            showSnackbar({
              text: "There was some error trying to create the entries",
            })
          )
        )
        .finally(() => dispatch(hideLoader()));
    }
  };

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    if (search.get("edit") === "true" && search.get("bill") && tokens) {
      dispatch(showLoader("Loading bill data"));
      getOneBill(tokens.access, search.get("bill") as string)
        .then((data) => {
          setCustomer(data.customer);
          setAddedProducts(data.products);
          setPaymentModes((modes) => {
            var _modes: typeof modes = { ...modes };
            data.payments.forEach((elem) => {
              if (elem.method) {
                _modes[elem.method.id] = {
                  enabled: true,
                  amount: Number(elem.amount),
                  name: elem.method.name,
                };
              }
            });
            console.log(_modes);
            return _modes;
          });
          setEditingData({
            editing: true,
            opening_balance: Number(data.ledger[0].balance_before),
            number: data.number,
            id: search.get("bill") as string,
          });
          setUsePreviousBalance(data.use_previous_balance);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "Failed to load bill details" }))
        )
        .finally(() => dispatch(hideLoader()));
    }
  }, [tokens, dispatch]);

  useEffect(() => {
    if (product && (product.product as ProductType).is_pieces && customer) {
      setAddedProducts((added) => {
        var found = false;
        added.forEach((e) => {
          found = found || e.id === product.id;
        });
        if (found) {
          dispatch(
            showSnackbar({ text: "This product has already been added" })
          );
          return added;
        }
        const _product = {...product};
        if (Number(customer.markdown) > 0) {
          _product.price = (1-Number(customer.markdown)/100) * Number(product.price)
        }
        if (!(product.product as ProductType).bulk) return [...added, { ..._product, size: undefined}];
        else return [...added, { ..._product, size: 1}];
      });
      setProduct(null);
    }
  }, [product, customer, dispatch]);

  useEffect(() => {
    var unit_price_before_tax, price_before_tax;
    var subtotal = 0;
    var taxes = 0;
    var total = 0;
    var discount = 0;
    addedProducts.forEach((elem, index) => {
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
      subtotal += price_before_tax;
      taxes += tax;
      discount += Number(elem.discount);
      total += roundOff(price_before_tax + tax);
    })
    const roundoff = roundOff(
      total % 1 > 0.49 ? 1 - (total % 1) : -(total % 1)
    );
    total += roundoff
    let payable =
      total +
      (usePreviousBalance
        ? Number(
            editingData.editing
              ? editingData.opening_balance
              : customer
              ? customer.balance
              : 0
          )
        : 0);
    setTotals({
      subtotal,
      taxes,
      total: roundOff(total),
      roundoff,
      discount,
      payable: roundOff(payable),
    });
  }, [editingData, addedProducts, customer, usePreviousBalance]);

  useEffect(() => {
    var total = 0;
    for (var j = 0; j < Object.keys(paymentModes).length; j++) {
      if (Object.values(paymentModes)[j].enabled)
        total += Object.values(paymentModes)[j].amount;
    }
    setReceived(total);
  }, [paymentModes]);

  useEffect(() => {
    if (tokens) {
      searchCustomers(tokens.access, "WALK IN", 1, 10).then((results) => {
        if (results.results.length === 1) {
          setCustomer(results.results[0]);
        }
      });
    }
  }, [tokens, setCustomer]);

  useEffect(() => {
    if (tokens) {
      searchPaymentMethods(tokens.access, "", 1, 100).then((results) => {
        var modes: typeof paymentModes = {};
        results.results.forEach((e) => {
          modes[e.id] = { enabled: false, amount: 0, name: e.name };
        });
        setPaymentModes(modes);
      });
    }
  }, [tokens]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        {editingData.editing
          ? "Edit Bill " + editingData.number
          : "New Bill (POS)"}
      </Typography>
      <Grid container>
        <Grid item xs={12} md={8} p={2}>
          <Stack direction="row" gap={2} mb={2}>
            <Stack>
              <CustomerAutoComplete
                customer={customer}
                setCustomer={setCustomer}
                token={tokens ? tokens.access : null}
              />
              <Typography
                sx={{
                  textDecoration: "underline",
                  cursor: "pointer",
                  color: "grey",
                  fontSize: "small",
                }}
                onClick={() => setAddCustomerOpen(true)}
              >
                Create New
              </Typography>
            </Stack>
            <TextField
              variant="outlined"
              sx={{ minWidth: "320px", mt: 1 }}
              required
              label="PO Number"
              inputRef={poNumberRef}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={date}
                format="dd MMM yy"
                sx={{ mt: 1 }}
                onChange={(newValue) => newValue && setDate(newValue)}
              />
            </LocalizationProvider>

            <FormControl sx={{ width: "auto", my: 1 }}>
              <InputLabel id="product-item-rows-select-label">
                Branch
              </InputLabel>
              <Select
                labelId="product-item-rows-select-label"
                id="product-item-rows-select"
                value={billBranch}
                label="Branch"
                onChange={(ev) => setBillBranch(Number(ev.target.value))}
              >
                {(authBody ? authBody.branch : []).map((e) => (
                  <MenuItem value={e.id} key={e.id}>
                    {e.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
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
              "remove",
            ]}
            rows={addedProducts.map((elem, index) => {
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
              return [
                index + 1,
                elem.uuid,
                (elem.product as ProductType).name,
                unit_price_before_tax,
                (elem.product as ProductType).bulk ? (
                  <Stack direction="row" alignItems="center" gap={0}>
                    <IconButton
                      color="secondary"
                      size="small"
                      onClick={() =>
                        setAddedProducts((items) => {
                          var _items = items.slice();
                          _items[index].size = Number(_items[index].size) - 5;
                          return _items;
                        })
                      }
                      sx={{ p: 0 }}
                    >
                      <Looks5TwoTone fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="secondary"
                      size="small"
                      onClick={() =>
                        setAddedProducts((items) => {
                          var _items = items.slice();
                          _items[index].size = Number(_items[index].size) - 1;
                          return _items;
                        })
                      }
                      sx={{ mr: 1, p: 0 }}
                    >
                      <LooksOneTwoTone fontSize="small" />
                    </IconButton>
                    {elem.size}
                    <IconButton
                      sx={{ ml: 1, p: 0 }}
                      color="primary"
                      size="small"
                      onClick={() =>
                        setAddedProducts((items) => {
                          var _items = items.slice();
                          _items[index].size = Number(_items[index].size) + 1;
                          return _items;
                        })
                      }
                    >
                      <LooksOneTwoTone fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() =>
                        setAddedProducts((items) => {
                          var _items = items.slice();
                          _items[index].size = Number(_items[index].size) + 5;
                          return _items;
                        })
                      }
                      sx={{ p: 0 }}
                    >
                      <Looks5TwoTone fontSize="small" />
                    </IconButton>
                  </Stack>
                ) : (
                  elem.size
                ),
                price_before_tax,
                tax,
                <>
                  {Number(elem.discount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  <NewBillDiscountEdit
                    onAdd={(n) => {
                      var _added = addedProducts.slice();
                      var _disc: number;
                      if (
                        (elem.product as ProductType).is_pieces &&
                        !(elem.product as ProductType).bulk
                      ) {
                        if (n.endsWith("%")) {
                          _disc =
                            Number(n.slice(0, n.length - 1)) *
                            (Number(_added[index].price || 0) +
                              Number(_added[index].discount || 0)) *
                            0.01;
                        } else _disc = Number(n);
                        _added[index] = {
                          ..._added[index],
                          discount: _disc,
                          price:
                            Number(_added[index].price || 0) +
                            Number(_added[index].discount || 0) -
                            _disc,
                        };
                      } else {
                        if (n.endsWith("%")) {
                          _disc =
                            Number(n.slice(0, n.length - 1)) *
                            (Number(_added[index].price || 0) * Number(elem.size) +
                              Number(_added[index].discount || 0)) *
                            0.01;
                        } else _disc = Number(n);
                        var per_prod_disc = _disc / Number(elem.size);
                        _added[index] = {
                          ..._added[index],
                          discount: _disc,
                          price:
                            Number(_added[index].price || 0) +
                            Number(_added[index].discount || 0) / Number(elem.size) -
                            per_prod_disc,
                        };
                      }
                      setAddedProducts(_added);
                    }}
                  />
                </>,
                roundOff(price_before_tax + tax, 0),
                <IconButton
                  size="small"
                  color="error"
                  onClick={() =>
                    setAddedProducts(
                      addedProducts
                        .slice(0, index)
                        .concat(addedProducts.slice(index + 1))
                    )
                  }
                >
                  <DeleteTwoTone fontSize="small" />
                </IconButton>,
              ];
            })}
          />
          <Div>
            <Typography variant="h6">Total Discount</Typography>
            <div style={{ display: "flex" }}>
              <Typography variant="h6">{totals.discount}</Typography>
              <NewBillDiscountEdit
                onAdd={(n) => {
                  setAddedProducts((_added) => {
                    var __added = [..._added];
                    var total = 0;
                    __added.forEach((el) => {
                      total +=
                        ((el.product as ProductType).is_pieces &&
                        !(el.product as ProductType).bulk
                          ? Number(el.price || 0)
                          : Number(el.price || 0) * Number(el.size || 0)) +
                        Number(el.discount);
                    });
                    var _disc_perc = (Number(n) / total) * 100;
                    console.log(total, _disc_perc);
                    __added.forEach((elem, index) => {
                      var _disc;
                      if (
                        (elem.product as ProductType).is_pieces &&
                        !(elem.product as ProductType).bulk
                      ) {
                        _disc =
                          _disc_perc *
                          (Number(__added[index].price || 0) +
                            Number(__added[index].discount || 0)) *
                          0.01;
                        __added[index] = {
                          ...__added[index],
                          discount: _disc,
                          price:
                            Number(__added[index].price || 0) +
                            Number(__added[index].discount || 0) -
                            _disc,
                        };
                      } else {
                        _disc =
                          _disc_perc *
                          (Number(__added[index].price || 0) *
                            Number(elem.size) +
                            Number(__added[index].discount || 0)) *
                          0.01;
                        var per_prod_disc = _disc / Number(elem.size);
                        __added[index] = {
                          ...__added[index],
                          discount: _disc,
                          price:
                            Number(__added[index].price || 0) +
                            Number(__added[index].discount || 0) /
                              Number(elem.size) -
                            per_prod_disc,
                        };
                      }
                    });
                    return __added;
                  });
                }}
              />
            </div>
          </Div>
          <Div>
            <Typography variant="h6">Mode of payment:</Typography>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {Object.keys(paymentModes).map((elem, index) => {
                console.log(elem, paymentModes[elem])
                return (
                <div
                  style={{
                    display: "flex",
                    marginTop: 4,
                    justifyContent: "space-between",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={paymentModes[elem].enabled}
                        onChange={(ev, checked) => {
                          var found = false;
                          for (
                            var j = 0;
                            j < Object.keys(paymentModes).length;
                            j++
                          ) {
                            if (Object.values(paymentModes)[j].enabled) {
                              found = true;
                              break;
                            }
                          }
                          setPaymentModes({
                            ...paymentModes,
                            [elem]: {
                              amount:
                                checked && !found
                                  ? totals.payable
                                  : paymentModes[elem].amount,
                              enabled: checked,
                              name: paymentModes[elem].name,
                            },
                          });
                        }}
                      />
                    }
                    value={elem}
                    label={paymentModes[elem].name}
                  />
                  <TextField
                    value={paymentModes[elem].amount}
                    variant="filled"
                    label="Amount Received"
                    disabled={!paymentModes[elem].enabled}
                    onChange={(evt) => {
                      setPaymentModes({
                        ...paymentModes,
                        [elem]: {
                          enabled: paymentModes[elem].enabled,
                          name: paymentModes[elem].name,
                          amount: Number(evt.target.value),
                        },
                      });
                    }}
                  />
                </div>
              )})}
            </div>
            <Div>
              {totals.payable > received && (
                <Alert severity="warning" sx={{ width: "100%" }}>
                  <AlertTitle>Credit Warning</AlertTitle>
                  The received amount is less than the total payable amount.{" "}
                  <strong>
                    ₹{(totals.payable - received).toLocaleString()} will be
                    added to the user's ledger as debt.
                  </strong>
                </Alert>
              )}
            </Div>
          </Div>
        </Grid>
        <Grid item xs={12} md={4} p={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5">Add Item</Typography>
              <Stack gap={3} my={2}>
                <ProductItemAutoComplete
                  product={product}
                  setProduct={setProduct}
                  token={tokens ? tokens.access : null}
                  finished
                />
                <TextField
                  variant="outlined"
                  sx={{ minWidth: "320px" }}
                  required
                  label="Quantity"
                  inputRef={quantityRef}
                  type="number"
                />
              </Stack>
              <Div sx={{ flexWrap: "nowrap" }}>
                <MD3Button variant="filledTonal" sx={{ width: "100%" }}>
                  Clear Data
                </MD3Button>
                <MD3Button
                  sx={{ width: "100%" }}
                  variant="filled"
                  color="primary"
                  onClick={() => {
                    if (product && product.size) {
                      var found = false;
                      addedProducts.forEach((e) => {
                        found = found || e.uuid === product.uuid;
                      });
                      if (found) {
                        dispatch(
                          showSnackbar({
                            text: "This product has already been added",
                          })
                        );
                        return;
                      }
                      if (
                        Number(quantityRef.current?.value) >
                        Number(product.size)
                      ) {
                        if (!(product.product as ProductType).bulk)
                          dispatch(
                            showSnackbar({
                              text:
                                "Available product quantity is only " +
                                product.size +
                                "kg",
                            })
                          );
                        else
                          dispatch(
                            showSnackbar({
                              text:
                                "Available product quantity is " +
                                product.size +
                                "pcs only",
                            })
                          );
                        return;
                      }

                      setAddedProducts([
                        ...addedProducts,
                        {
                          ...product,
                          size: Number(quantityRef.current?.value),
                        },
                      ]);
                      setProduct(null);
                      if (quantityRef.current) quantityRef.current.value = "";
                    }
                  }}
                >
                  Add
                </MD3Button>
              </Div>
            </CardContent>
          </Card>
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
            {/* <Div sx={{ alignItems: "center" }}>
              <Stack direction="row" alignItems="center">
                <Checkbox
                  checked={usePreviousBalance}
                  onChange={(evt) => setUsePreviousBalance(evt.target.checked)}
                />
                <Typography
                  variant="button"
                  color={usePreviousBalance ? undefined : "gray"}
                >
                  Customer Balance
                </Typography>
              </Stack>
              <Typography
                variant="button"
                color={usePreviousBalance ? undefined : "gray"}
              >
                {editingData.editing
                  ? editingData.opening_balance
                  : customer
                  ? customer.balance
                  : 0}
              </Typography>
            </Div> */}
            <Div>
              <Typography variant="button">Round Off</Typography>
              <Typography variant="button">{totals.roundoff}</Typography>
            </Div>
            <Div>
              <div>
                <Typography
                  variant="button"
                  textAlign="center"
                  width="100%"
                  component="div"
                >
                  total payable
                </Typography>
                <Typography variant="h3" textAlign="center">
                  {totals.payable.toLocaleString("en-IN")}
                </Typography>
              </div>
              <div>
                <Typography
                  variant="button"
                  textAlign="center"
                  width="100%"
                  component="div"
                >
                  total received
                </Typography>
                <Typography variant="h3" textAlign="center">
                  {received.toLocaleString("en-IN")}
                </Typography>
              </div>
              <div>
                <Typography
                  variant="button"
                  textAlign="center"
                  width="100%"
                  component="div"
                >
                  closing balance
                </Typography>
                <Typography variant="h3" textAlign="center">
                  {(totals.payable - received).toLocaleString("en-IN")}
                </Typography>
              </div>
            </Div>
          </AccentCard>
          <MD3Button
            sx={{ mt: 4, width: "100%" }}
            variant="filled"
            size="large"
            color="primary"
            onClick={handleCreate}
          >
            Generate Bill
          </MD3Button>
        </Grid>
      </Grid>
      <AddCustomerModal
        open={addCustomerOpen}
        handleClose={() => setAddCustomerOpen(false)}
        onAdd={(customer) => {
          setCustomer(customer);
          setAddCustomerOpen(false);
        }}
      />
    </>
  );
}
