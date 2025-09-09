import {
  Grid,
  Typography,
  Stack,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";

//   import StaffType from "src/types/staffs";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

//   import AddStaffModal from "./add-staff-modal";
import DataTable from "src/components/data-table";
import { ProductItemType } from "src/types/inventory";
import Div from "src/components/div";
import MD3Button from "src/components/md3-button";
import { DeleteTwoTone } from "@mui/icons-material";
import AccentCard from "src/components/accent-card";
import roundOff from "src/utils/round-off";
import ProductItemAutoComplete from "src/components/autocompletes/productitem-autocomplete";
import { SupplierType } from "src/types/suppliers";
import SupplierAutoComplete from "src/components/autocompletes/supplier-autocomplete";
import {
  checkProductBelongsToSupplier,
  createPurchaseReturn,
} from "src/api/suppliers";

export default function NewBill() {
  const [supplier, setSupplier] = useState<SupplierType>();
  const [addedProducts, setAddedProducts] = useState<
    Array<{ product: ProductItemType; quantity: number; billNumber: string }>
  >([]);

  const [totals, setTotals] = useState<{
    subtotal: number;
    total: number;
    roundoff: number;
  }>({
    subtotal: 0,
    total: 0,
    roundoff: 0,
  });
  const [product, setProduct] = useState<ProductItemType | null>(null);
  const [loading, setLoading] = useState(false);

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  useEffect(() => {
    var total = 0;
    addedProducts.forEach((item) => {
      total += (Number(item.product.buying_price) || 0) * (item.quantity || 0);
    });

    setTotals((totals) => ({
      ...totals,
      total: roundOff(total),
    }));
  }, [addedProducts]);

  const handleCreateReturn = useCallback(() => {
    if (tokens && supplier && addedProducts.length > 0) {
      dispatch(showLoader("Creatign purchase return"));
      createPurchaseReturn(tokens.access, {
        products: addedProducts.map((e) => e.product.id),
        remarks: "",
        supplier: supplier.id,
      })
        .then(() => {
          dispatch(showSnackbar({ text: "created return succesfully" }));
          setAddedProducts([]);
          setSupplier(undefined);
        })
        .catch(() =>
          dispatch(
            showSnackbar({
              text: "encountered some error while trying to craete the return",
            })
          )
        )
        .finally(() => dispatch(hideLoader()));
    }
  }, [addedProducts, tokens, dispatch, supplier]);

  useEffect(() => {
    if (product && tokens && supplier) {
      setLoading(true);
      checkProductBelongsToSupplier(tokens.access, supplier.id, product.id)
        .then((res) => {
          if (res.is_same && res.bill) {
            var item: { product: ProductItemType; quantity: number; billNumber: string };
            if (product.product.unit === "pc" && !product.product.bulk)
              item = { product, quantity: 1, billNumber: res.bill };
            else item = { product, quantity: product.length as number, billNumber: res.bill };
            setAddedProducts((products) => {
              var found = false;
              for (var i = 0; i < products.length; i++)
                if (
                  products[i].product &&
                  products[i].product.id === item.product.id
                ) {
                  found = true;
                  break;
                }
              if (found) {
                dispatch(
                  showSnackbar({ text: "this product has already been added" })
                );
                return products;
              } else {
                return [...products, item];
              }
            });
          } else {
            dispatch(
              showSnackbar({
                text: "this product does not belong to the selected supplier",
              })
            );
          }
          setProduct(null);
        })
        .catch(() =>
          dispatch(
            showSnackbar({ text: "some error occurred while adding product" })
          )
        )
        .finally(() => setLoading(false));
    }
  }, [product, tokens, dispatch, supplier]);

  return (
    <Grid container>
      <Grid item xs={12} md={8} p={2}>
        <Typography variant="h6" sx={{ my: 2 }}>
          Item Information
        </Typography>
        <DataTable
        loading={loading}
          header={[
            "s no.",
            "id",
            "product",
            "bill number",
            "buying price",
            "quantity",
            "total",
            "remove",
          ]}
          rows={addedProducts.map((elem, index) => [
            index + 1,
            elem.product.uuid,
            elem.product.product.name,
            elem.billNumber,
            "₹" + elem.product.buying_price,
            elem.quantity,
            "₹" +
              roundOff(
                (Number(elem.product.buying_price) || 0) * (elem.quantity || 0)
              ).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            <IconButton
              size="small"
              color="error"
              onClick={() => {
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
      </Grid>
      <Grid item xs={12} md={4} p={2}>
        <Typography variant="h6" sx={{ my: 2 }}>
          Supplier Information
        </Typography>
        <SupplierAutoComplete
          supplier={supplier}
          setSupplier={setSupplier}
          token={tokens?tokens.access:null}
          disabled={addedProducts.length > 0}
        />

        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Div>
              <Typography variant="h5">Add Item</Typography>
            </Div>
            <Stack gap={1} my={2}>
              <ProductItemAutoComplete
                product={product}
                disabled={supplier === undefined}
                setProduct={setProduct}
                token={tokens?tokens.access:null}
              />
            </Stack>
          </CardContent>
        </Card>
        <AccentCard sx={{ p: 2, my: 2 }}>
          {/* <Div>
            <Typography variant="button">Total</Typography>
            <Typography variant="button">
              {"₹" +
                totals.total.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </Typography>
          </Div> */}
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
              totals.total.toLocaleString("en-IN", {
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
          onClick={handleCreateReturn}
        >
          Generate Return
        </MD3Button>
      </Grid>
    </Grid>
  );
}
