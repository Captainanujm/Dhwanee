import {
  Button,
  Grid,
  TextField,
  Typography,
  Stack,
  Pagination,
  List,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Backdrop,
  CircularProgress,
  ListItemSecondaryAction,
  Checkbox,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { listProduct, searchProducts } from "src/api/inventory";

//   import StaffType from "src/types/staffs";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

//   import AddStaffModal from "./add-staff-modal";
import { Outlet } from "react-router-dom";
import StringAvatar from "src/components/string-avatar";
import AddProductModal from "./add-product-modal";
import { ProductType } from "src/types/inventory";
import AlertChip from "src/components/alert-chip";

export default function ProductList() {
  const navigate = useNavigate();
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchResults, setSearchResults] = useState<ProductType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useState({
    page: 1,
    rows_per_page: 15,
  });
  const [selectedProduct, setSelectedProduct] = useState<number | undefined>();
  const lastSearchTimeout = useRef<{
    elapsed: boolean;
    timeout: NodeJS.Timeout | null;
  }>({ timeout: null, elapsed: false });
  const [enableFilter, setEnableFilter] = useState(false);
  const [finishedOnly, setFinishedOnly] = useState(false);

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const refreshProducts = useCallback(() => {
    if (!lastSearchTimeout.current.elapsed) {
      if (lastSearchTimeout.current.timeout)
        clearTimeout(lastSearchTimeout.current.timeout);
      lastSearchTimeout.current.timeout = setTimeout(() => {
        lastSearchTimeout.current.timeout = null;
        lastSearchTimeout.current.elapsed = true;
        refreshProducts();
      }, 500);
    } else {
      lastSearchTimeout.current.elapsed = false;
      if (tokens) {
        dispatch(showLoader("searching..."));
        var promise;
        if (enableFilter) {
          promise = searchProducts(
            tokens.access,
            searchQuery,
            searchParams.page,
            searchParams.rows_per_page,
            finishedOnly
          );
        } else if (searchQuery === "")
          promise = listProduct(
            tokens.access,
            searchParams.page,
            searchParams.rows_per_page
          );
        else {
          promise = searchProducts(
            tokens.access,
            searchQuery,
            searchParams.page,
            searchParams.rows_per_page
          );
        }
        promise
          .then((results) => {
            setTotalProducts(results.count);
            setSearchResults(results.results);
          })
          .catch(() => {
            dispatch(
              showSnackbar({
                text: "some error occurred while trying to load the results",
              })
            );
          })
          .finally(() => dispatch(hideLoader()));
      }
    }
  }, [
    searchQuery,
    tokens,
    searchParams,
    dispatch,
    lastSearchTimeout,
    finishedOnly,
    enableFilter,
  ]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        Products
      </Typography>
      <Grid container sx={{ width: "100%" }}>
        <Grid item xs={12} md={3} sx={{}}>
          <Stack>
            <Stack
              direction="row"
              style={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Total {totalProducts} Products
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setAddProductOpen(true)}
              >
                New Product
              </Button>
            </Stack>

            <br />

            <TextField
              label="Search"
              variant="outlined"
              value={searchQuery}
              onChange={(evt) => setSearchQuery(evt.target.value)}
              sx={{ mb: 2 }}
            />
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="flex-end"
            >
              <Checkbox
                checked={enableFilter}
                onChange={(evt) => setEnableFilter(evt.target.checked)}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={finishedOnly}
                    onChange={(evt) => setFinishedOnly(evt.target.checked)}
                  />
                }
                label="Finished"
                disabled={!enableFilter}
              />
            </Stack>
            <List sx={{ width: "100%", bgcolor: "background.paper" }}>
              {searchResults.map((product, index) => (
                <ListItemButton
                  onClick={() => {
                    setSelectedProduct(product.id);
                    navigate(product.id.toString());
                  }}
                  selected={product.id === selectedProduct}
                >
                  <ListItemAvatar>
                    <StringAvatar>{product.name}</StringAvatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={product.name}
                    // secondary={Product.stock}
                  />
                  <ListItemSecondaryAction>
                    <AlertChip level={product.finished ? "success" : "info"}>
                      {product.finished ? "FINISHED" : "RAW"}
                    </AlertChip>
                  </ListItemSecondaryAction>
                </ListItemButton>
              ))}
            </List>

            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                padding: "12px 0",
              }}
            >
              <Pagination
                count={Math.ceil(totalProducts / searchParams.rows_per_page)}
                page={searchParams.page}
                siblingCount={1}
                boundaryCount={1}
                showFirstButton
                color="primary"
                onChange={(_, page) =>
                  setSearchParams({ ...searchParams, page })
                }
              />
            </div>
          </Stack>
        </Grid>

        <Grid item xs={12} md={9} sx={{ p: 2, position: "relative" }}>
          <Suspense
            fallback={
              <Backdrop component="div" open={true}>
                <CircularProgress />
              </Backdrop>
            }
          >
            <Outlet />
          </Suspense>
        </Grid>
      </Grid>
      <AddProductModal
        open={addProductOpen}
        handleClose={() => setAddProductOpen(false)}
        onAdd={() => {
          refreshProducts();
          setAddProductOpen(false);
        }}
      />
    </>
  );
}
