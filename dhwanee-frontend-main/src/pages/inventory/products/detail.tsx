import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { showSnackbar } from "src/components/snackbar/reducer";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { useParams } from "react-router-dom";
import Div from "src/components/div";
import AccentCard from "src/components/accent-card";
import DataTable from "src/components/data-table";
import {
  getOneProduct,
  getProductItemsByProduct,
  getProductLedger,
  updateProductRate,
} from "src/api/inventory";
import {
  ProductItemType,
  ProductLedgerType,
  ProductType,
} from "src/types/inventory";
import MD3Button from "src/components/md3-button";
import AlertChip from "src/components/alert-chip";
import EditProductModal from "./edit-product-modal";
import { format } from "date-fns";
import { DeleteTwoTone, EditTwoTone } from "@mui/icons-material";
import AddProductToStock from "./add-product-to-stock";

export default function ProductDetails() {
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(false);
  const [unsoldProductitemsData, setUnsoldProductitemsData] = useState<
    ProductItemType[]
  >([]);
  const [pageParams, setPageParams] = useState({
    number: 1,
    rows: 10,
  });
  const [totalProductItems, setTotalProductItems] = useState(0);
  const [editProductModalOpen, setEditProductModalOpen] = useState(false);
  const [productLedger, setProductLedger] = useState<ProductLedgerType[]>([]);
  const [ledgerPageParams, setLedgerPageParams] = useState({
    number: 1,
    rows: 10,
  });
  const [totalProductLedgers, setTotalProductLedgers] = useState(0);

  const { id } = useParams();
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const rateUpdateRef = useRef<HTMLInputElement>();

  const refreshProductitems = useCallback(() => {
    if (tokens && id) {
      setLoading(true);
      getProductItemsByProduct(
        tokens.access,
        { id },
        pageParams.number,
        pageParams.rows
      )
        .then((productitems) => {
          setUnsoldProductitemsData(productitems.results);
          setTotalProductItems(productitems.count);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to load product items" }))
        )
        .finally(() => setLoading(false));
    }
  }, [dispatch, tokens, id, pageParams]);

  const refreshProductDetails = useCallback(() => {
    if (tokens && id) {
      setLoading(true);
      getOneProduct(tokens.access, id)
        .then((_product) => {
          setProduct(_product);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to load product details" }))
        )
        .finally(() => setLoading(false));
    }
  }, [tokens, dispatch, id]);

  const refreshProductLedger = useCallback(() => {
    if (tokens && id) {
      setLoading(true);
      getProductLedger(
        tokens.access,
        id,
        ledgerPageParams.number,
        ledgerPageParams.rows
      )
        .then((productledgers) => {
          setProductLedger(productledgers.results);
          setTotalProductLedgers(productledgers.count);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to get product ledger" }))
        )
        .finally(() => setLoading(false));
    }
  }, [dispatch, tokens, id, ledgerPageParams]);

  const handleUpdatePrice = useCallback(() => {
    if (
      tokens &&
      rateUpdateRef.current &&
      rateUpdateRef.current.value !== "" &&
      id
    ) {
      if (Number(rateUpdateRef.current.value).toString() === "NaN") {
        dispatch(showSnackbar({ text: "Please enter a numeric value" }));
        return;
      }

      setLoading(true);
      updateProductRate(tokens.access, id, Number(rateUpdateRef.current.value))
        .then(() => {
          refreshProductDetails();
          refreshProductitems();
        })
        .catch(() =>
          dispatch(
            showSnackbar({
              text: "There was some error while trying to update the rate",
            })
          )
        )
        .finally(() => setLoading(false));
    }
  }, [tokens, dispatch, id, refreshProductDetails, refreshProductitems]);

  useEffect(refreshProductitems, [refreshProductitems]);
  useEffect(refreshProductLedger, [refreshProductLedger]);
  useEffect(refreshProductDetails, [refreshProductDetails]);

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
      <Grid container sx={{ position: "relative", zIndex: 900 }}>
        <Grid item xs={8} sx={{ px: 1 }}>
          <Div sx={{ mb: 1 }}>
            <Typography variant="h5">Items</Typography>

            <FormControl fullWidth sx={{ maxWidth: "150px" }}>
              <InputLabel id="product-item-rows-select-label">
                Rows per page
              </InputLabel>
              <Select
                labelId="product-item-rows-select-label"
                id="product-item-rows-select"
                value={pageParams.rows}
                label="Rows per page"
                onChange={(ev) =>
                  setPageParams({
                    ...pageParams,
                    rows: Number(ev.target.value),
                  })
                }
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </Div>
          <DataTable
            header={["uuid", "cost per unit", "selling price", "tax%", "status"].concat(
              product && (!product.is_pieces || product.bulk)
                ? ["qty left"]
                : []
            )}
            rows={unsoldProductitemsData.map((productitem) =>
              [
                productitem.uuid,
                productitem.cost,
                productitem.price,
                productitem.tax,
                <AlertChip
                  //@ts-expect-error
                  level={
                    {
                      AWAITED: "warning",
                      UNSOLD: "info",
                      SOLD: "success",
                      RETURNED: "error",
                    }[productitem.status]
                  }
                >
                  {productitem.status}
                </AlertChip>,
              ].concat((product && (!product.is_pieces || product.bulk) && productitem.size) ? [productitem.size] : [])
            )}
            limitHeight={400}
          />

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              padding: "12px 0",
            }}
          >
            <Pagination
              count={Math.ceil(totalProductItems / pageParams.rows)}
              page={pageParams.number}
              siblingCount={1}
              boundaryCount={1}
              showFirstButton
              color="primary"
              onChange={(_, page) =>
                setPageParams({ ...pageParams, number: page })
              }
            />
          </div>

          <Div sx={{ mb: 1 }}>
            <Typography variant="h5">Ledger entries</Typography>

            <FormControl fullWidth sx={{ maxWidth: "150px" }}>
              <InputLabel id="product-item-rows-select-label">
                Rows per page
              </InputLabel>
              <Select
                labelId="product-item-rows-select-label"
                id="product-item-rows-select"
                value={ledgerPageParams.rows}
                label="Rows per page"
                onChange={(ev) =>
                  setLedgerPageParams({
                    ...ledgerPageParams,
                    rows: Number(ev.target.value),
                  })
                }
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Div>
          <DataTable
            header={["date", "remarks", "amount", "bal after"]}
            rows={productLedger.map((ledgerItem) => [
              format(new Date(ledgerItem.date), "dd/MM/yyyy hh:mm"),
              ledgerItem.remarks,
              ledgerItem.amount,
              ledgerItem.bal_after,
            ])}
          />

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              padding: "12px 0",
            }}
          >
            <Pagination
              count={Math.ceil(totalProductLedgers / ledgerPageParams.rows)}
              page={ledgerPageParams.number}
              siblingCount={1}
              boundaryCount={1}
              showFirstButton
              color="primary"
              onChange={(_, page) =>
                setLedgerPageParams({ ...ledgerPageParams, number: page })
              }
            />
          </div>
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
              <Typography variant="button">Product Details</Typography>
              <Typography variant="h4" gutterBottom>
                {product ? product.name : "NA"}
              </Typography>
              <Div>
                <Typography variant="button">Default Selling Price</Typography>
                <Typography variant="button">
                  {product && product.default_selling_price}
                </Typography>
              </Div>
              <Div>
                <Typography variant="button">HSN</Typography>
                <Typography variant="button">
                  {product && product.hsn}
                </Typography>
              </Div>
              <Div>
                <Typography variant="button">Current Stock</Typography>
                <Typography variant="button">
                  {product && product.current_stock}
                </Typography>
              </Div>
              <Div>
                <span style={{ flexGrow: 1 }} />
                <IconButton
                  size="small"
                  onClick={() => setEditProductModalOpen(true)}
                  color="primary"
                >
                  <EditTwoTone fontSize="small" />
                </IconButton>
                <IconButton size="small" color="primary">
                  <DeleteTwoTone fontSize="small" />
                </IconButton>
                {product && product.finished && <AddProductToStock product={product} onAdd={() => {
                  refreshProductDetails()
                  refreshProductLedger()
                  refreshProductitems()
                }} />}
              </Div>
            </CardContent>
          </AccentCard>
          {product && product.finished && (
            <>
              <AccentCard sx={{ mt: 1 }}>
                <CardContent>
                  <Typography variant="h5">Recipe</Typography>
                  {product &&
                    product.recipe.map((e, i) => (
                      <Div key={i}>
                        <Typography variant="button">
                          {e.product.name}
                        </Typography>
                        <Typography variant="button">
                          {e.percentage}%
                        </Typography>
                      </Div>
                    ))}
                </CardContent>
              </AccentCard>
              <Card variant="outlined" sx={{ mt: 1 }}>
                <CardContent
                  sx={{
                    alignItems: "center",
                    display: "flex",
                    flexDirection: "column",
                    padding: 2,
                  }}
                >
                  <Typography variant="h6">Update Rate</Typography>
                  <TextField
                    variant="outlined"
                    defaultValue={
                      product ? Number(product.default_selling_price) : 0
                    }
                    type="number"
                    sx={{ width: "100%" }}
                    label="Rate"
                    inputRef={rateUpdateRef}
                  />
                  <MD3Button
                    sx={{ mt: 1, width: "100%" }}
                    variant="filled"
                    color="primary"
                    onClick={handleUpdatePrice}
                  >
                    Save
                  </MD3Button>
                </CardContent>
              </Card>
            </>
          )}
        </Grid>
      </Grid>
      {product && (
        <EditProductModal
          onAdd={() => {
            setEditProductModalOpen(false);
            refreshProductDetails();
          }}
          open={editProductModalOpen}
          handleClose={() => setEditProductModalOpen(false)}
          initialData={product}
        />
      )}
    </>
  );
}
