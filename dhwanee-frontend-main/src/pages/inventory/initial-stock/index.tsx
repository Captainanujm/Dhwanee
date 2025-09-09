import {
  Grid,
  TextField,
  Typography,
  Stack,
  Card,
  CardContent,
  IconButton,
  Button,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { createInitialStock } from "src/api/inventory";

//   import StaffType from "src/types/staffs";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

//   import AddStaffModal from "./add-staff-modal";
import DataTable from "src/components/data-table";
import { ProductType } from "src/types/inventory";
import Div from "src/components/div";
import MD3Button from "src/components/md3-button";
import { Add, DeleteTwoTone } from "@mui/icons-material";
import dateToIsoString from "src/utils/date-to-string";
import INVENTORY from "src/api/inventory/endpoints";
import AddProductModal from "src/pages/inventory/products/add-product-modal";
import ProductAutoComplete from "src/components/autocompletes/product-autocomplete";

export default function CreateInitialStock() {
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [product, setProduct] = useState<ProductType | null>(null);

  const [currentProps, setCurrentProps] = useState<{
    tax: null | number;
    quantity: null | number;
    selling_price: null | number;
  }>({
    tax: null,
    quantity: null,
    selling_price: null,
  });
  const [addedItems, setAddedItems] = useState<Array<any>>([]);

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (product) {
      var found = false;
      for(var i=0;i<addedItems.length;i++) if (addedItems[i].product.id === product.id){ found = true; break; }
      if (found) {
        dispatch((showSnackbar({text: "this product has already been added"})))
        setProduct(null);
      }
      else setCurrentProps({
        tax: product.default_tax,
        quantity: null,
        selling_price: product.default_selling_price,
      });
    }
  }, [product, addedItems, dispatch]);

  const handleCreate = () => {
    if (tokens) {
      dispatch(showLoader("crteating products"));
      createInitialStock(tokens.access, {
        date: dateToIsoString(new Date()),
        products: addedItems.map((elem) => ({
          name: elem.product.name,
          id: elem.product.id,
          unit: elem.product.unit,
          quantity: elem.quantity,
          tax: elem.tax,
          buying_cgst: 0,
          buying_sgst: 0,
          buying_igst: 0,
          cgst: 0,
          sgst: 0,
          igst: elem.tax,
          selling_price: elem.selling_price,
          buying_price: 0,
        })),
      })
        .then((data) => {
          window.open(
            INVENTORY.PRODUCTS.PRINT_LABELS + "?ids=" + data.items.join(","),
            "_blank"
          );
          dispatch(showSnackbar({ text: "products added succesfully" }));
          setAddedItems([]);
          setCurrentProps({
            tax: null,
            quantity: null,
            selling_price: null,
          });
          setProduct(null);
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

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        Add Initial Inventory
      </Typography>
      <Grid container>
        <Grid item xs={12} md={8} p={2}>
          <DataTable
            header={["s no.", "product", "selling price", "quantity", "remove"]}
            rows={addedItems.map((elem, index) => [
              index + 1,
              elem.product.name,
              elem.selling_price,
              elem.quantity,
              <IconButton
                size="small"
                color="error"
                onClick={() =>
                  setAddedItems(
                    addedItems
                      .slice(0, index)
                      .concat(addedItems.slice(index + 1))
                  )
                }
              >
                <DeleteTwoTone fontSize="small" />
              </IconButton>,
            ])}
          />
        </Grid>
        <Grid item xs={12} md={4} p={2}>
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
              <Stack gap={3} my={2}>
                <ProductAutoComplete
                  product={product}
                  setProduct={setProduct}
                  token={tokens?tokens.access:null}
                />
                <TextField
                  variant="outlined"
                  sx={{ minWidth: "320px" }}
                  required
                  label="Quantity"
                  type="number"
                  value={
                    currentProps.quantity === null ? "" : currentProps.quantity
                  }
                  onChange={(evt) =>
                    setCurrentProps({
                      ...currentProps,
                      quantity: Number(evt.target.value),
                    })
                  }
                />
                  <TextField
                    sx={{ minWidth: "320px" }}
                    variant="outlined"
                    type="number"
                    required
                    label="Tax %"
                    value={currentProps.tax === null ? "" : currentProps.tax}
                    onChange={(evt) =>
                      setCurrentProps({
                        ...currentProps,
                        tax: Number(evt.target.value),
                      })
                    }
                  />
                <TextField
                  variant="outlined"
                  sx={{ minWidth: "320px" }}
                  required
                  label="Selling Price"
                  value={
                    currentProps.selling_price === null
                      ? ""
                      : currentProps.selling_price
                  }
                  onChange={(evt) =>
                    setCurrentProps({
                      ...currentProps,
                      selling_price: Number(evt.target.value),
                    })
                  }
                />
              </Stack>
              <Div>
                <MD3Button
                  variant="filled"
                  size="large"
                  color="secondary"
                  onClick={() => {
                    setProduct(null);
                    setCurrentProps({
                      tax: null,
                      quantity: null,
                      selling_price: null,
                    });
                  }}
                >
                  Clear Data
                </MD3Button>
                <MD3Button
                  variant="filled"
                  size="large"
                  color="primary"
                  onClick={() => {
                    if (product && currentProps.quantity)
                      setAddedItems([
                        ...addedItems,
                        {
                          product: product,
                          quantity: currentProps.quantity,
                          tax: currentProps.tax,
                          selling_price: currentProps.selling_price,
                        },
                      ]);
                    else dispatch(showSnackbar({text: "Please select a valid product and quantity"}))
                    setProduct(null);
                    setCurrentProps({
                      tax: null,
                      quantity: null,
                      selling_price: null,
                    });
                  }}
                >
                  Add
                </MD3Button>
              </Div>
            </CardContent>
          </Card>
          <MD3Button
            sx={{ mt: 4, width: "100%" }}
            variant="filled"
            size="large"
            color="primary"
            onClick={handleCreate}
          >
            Create Bill
          </MD3Button>
        </Grid>
      </Grid>
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
