import {
    Grid,
    TextField,
    Typography,
    Stack,
    Card,
    CardContent,
    IconButton,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
  } from "@mui/material";
  import { useState, useEffect, useRef } from "react";
  import { useAppDispatch, useAppSelector } from "src/redux/hooks";
  
  import { hideLoader, showLoader } from "src/components/loader/reducer";
  import { showSnackbar } from "src/components/snackbar/reducer";
  
  import DataTable from "src/components/data-table";
  import { ProductItemType, ProductType } from "src/types/inventory";
  import Div from "src/components/div";
  import {
    DeleteTwoTone,
    Looks5TwoTone,
    LooksOneTwoTone,
  } from "@mui/icons-material";
  import dateToIsoString from "src/utils/date-to-string";
  import AccentCard from "src/components/accent-card";
  import roundOff from "src/utils/round-off";
  import { getOneChallan, updateChallan } from "src/api/billing";
  import { CustomerType } from "src/types/customer";
  import AddCustomerModal from "src/pages/people/customers/add-customer-modal";
  import CustomerAutoComplete from "src/components/autocompletes/customer-autocomplete";
  import ProductItemAutoComplete from "src/components/autocompletes/productitem-autocomplete";
  import NewBillDiscountEdit from "src/components/new-bill-discount-edit";
  import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
  import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
  import MD3Button from "src/components/md3-button";
import { useParams } from "react-router-dom";
  
  export default function NewChallan() {
    const [addCustomerOpen, setAddCustomerOpen] = useState(false);
    const [product, setProduct] = useState<ProductItemType | null>(null);
    const [customer, setCustomer] = useState<CustomerType>();
    const [addedProducts, setAddedProducts] = useState<
      Array<ProductItemType & { remarks: string; old_id?: number }>
    >([]);
    const [displayData, setDisplayData] = useState<any[][]>([]);
    const [date, setDate] = useState(new Date());
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
    const authBody = useAppSelector((state) => state.auth.body);
    const [billBranch, setBillBranch] = useState<number>(0);
    const tokens = useAppSelector((state) => state.auth.tokens);
    const dispatch = useAppDispatch();
    const {id} = useParams();

    const remarksRef = useRef<HTMLInputElement>();
    const lengthRef = useRef<HTMLInputElement>();
    
  
    const handleEdit = () => {
      console.log(tokens && customer && addedProducts.length > 0)
      if (tokens && customer && addedProducts.length > 0 && id) {
        dispatch(showLoader("saving challan"));
        const bill_data = {
          date: dateToIsoString(date),
          customer: customer.id,
          branch: billBranch,
          products: addedProducts.map((elem) => ({
            id: elem.id,
            size: Number(elem.size),
            remarks: elem.remarks,
            parent_prod: elem.parent,
            discount: elem.discount,
            price: elem.price,
            old_id: elem.old_id
          })),
        };
        updateChallan(tokens.access, id, bill_data)
          .then((data) => {
            console.log(data.challan);
            window.open(
              window.location.protocol +
                "//" +
                window.location.host +
                "/billing/challan/print/" +
                data.challan,
              "_blank"
            );
            dispatch(
              showSnackbar({
                text: "challan edited succesfully",
              })
            );
          })
          .catch((err) =>
            dispatch(
              showSnackbar({
                text: "There was some error trying to save the entry",
              })
            )
          )
          .finally(() => dispatch(hideLoader()));
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
          subtotal += price_before_tax;
          taxes += tax;
          discount += Number(elem.discount);
          total += roundOff(price_before_tax + tax);
          return [
            index + 1,
            elem.uuid,
            <>
            <Typography variant="body1">{(elem.product as ProductType).name}</Typography>
            <Typography variant="caption" fontSize="samll" color={"gray"} component="i">{elem.remarks}</Typography>
            </>,
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
        })
      );
      const roundoff = roundOff(
        total % 1 > 0.49 ? 1 - (total % 1) : -(total % 1)
      );
      setTotals({
        subtotal,
        taxes,
        discount,
        total: roundOff(total),
        roundoff,
        payable: roundOff(
          total + roundoff
        ),
      });
    }, [addedProducts, customer]);
  
    // useEffect(() => {
    //   var total = 0;
    //   for (var j = 0; j < Object.keys(paymentModes).length; j++) {
    //     if (Object.values(paymentModes)[j].enabled)
    //       total += Object.values(paymentModes)[j].amount;
    //   }
    //   setReceived(total);
    // }, [paymentModes]);
  
    useEffect(() => {
      if (product && remarksRef.current && lengthRef.current) {
        remarksRef.current.focus();
      }
    }, [product]);

  useEffect(() => {
    if (tokens && id) {
      getOneChallan(tokens.access, id)
        .then((data) => {
          setAddedProducts(data.items.map((el: any) => ({...el.product, remarks: el.remarks, old_id: el.id})));
          setCustomer(data.customer);
          setBillBranch(data.branch);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "Failed to load challan details" }))
        )
    }
  }, [tokens, dispatch, id]);
  
    return (
      <>
        <Typography variant="h1" gutterBottom color="primary">
          Edit Delivery Challan
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
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Dated"
                  value={date}
                  format="dd MMM yy"
                  onChange={(newValue) => newValue && setDate(newValue)}
                  sx={{ my: 1 }}
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
              rows={displayData}
            />
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
                    label="Remarks"
                    inputRef={remarksRef}
                  />
                  <TextField
                    variant="outlined"
                    sx={{ minWidth: "320px" }}
                    required
                    label="Quantity"
                    inputRef={lengthRef}
                    type="number"
                    defaultValue={1}
                  />
                </Stack>
                <Div sx={{flexWrap: "nowrap"}}>
                  <MD3Button
                  sx={{width: "100%"}}
                    variant="filledTonal"
                    onClick={() => {
                      setProduct(null);
                      if (lengthRef.current) lengthRef.current.value = "1";
                      if (remarksRef.current) remarksRef.current.value = "";
                    }}
                  >
                    Clear Data
                  </MD3Button>
                  <MD3Button
                  sx={{width: "100%"}}
                    variant="filled"
                    color="primary"
                    onClick={() => {
                      if (product && customer) {
                        var found = false;
                        addedProducts.forEach((e) => {
                          found = found || e.id === product.id;
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
                          product.size && Number(lengthRef.current?.value) > Number(product.size)
                        ) {
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
                            size: product.size ? Number(lengthRef.current?.value) : undefined,
                            remarks: remarksRef.current?.value || "",
  
                            price:
                              (100 - Number(customer.markdown)) *
                              Number(product.price) *
                              0.01,
                          },
                        ]);
                        setProduct(null);
                        if (lengthRef.current) lengthRef.current.value = "1";
                        if (remarksRef.current) remarksRef.current.value = "";
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
              onClick={() => handleEdit()}
            >
              Save Delivery Challan
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
  