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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { listSupplier, searchSuppliers } from "src/api/suppliers";

//   import StaffType from "src/types/staffs";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

//   import AddStaffModal from "./add-staff-modal";
import { Outlet } from "react-router-dom";
import StringAvatar from "src/components/string-avatar";
import AddSupplierModal from "./add-supplier-modal";
import { SupplierType } from "src/types/suppliers";
import PageLoadingSkeleton from "src/components/page-loading-skeleton";

export default function StaffLists() {
  const navigate = useNavigate();
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [searchResults, setSearchResults] = useState<SupplierType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useState({
    page: 1,
    rows_per_page: 15,
  });
  const [selectedSupplier, setSelectedSupplier] = useState<
    number | undefined
  >();
  const lastSearchTimeout = useRef<{
    elapsed: boolean;
    timeout: NodeJS.Timeout | null;
  }>({ timeout: null, elapsed: false });

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const refreshSuppliers = useCallback(() => {
    if (!lastSearchTimeout.current.elapsed) {
      if (lastSearchTimeout.current.timeout)
        clearTimeout(lastSearchTimeout.current.timeout);
      lastSearchTimeout.current.timeout = setTimeout(() => {
        lastSearchTimeout.current.timeout = null;
        lastSearchTimeout.current.elapsed = true;
        refreshSuppliers();
      }, 500);
    } else {
      lastSearchTimeout.current.elapsed = false;
      if (tokens) {
        dispatch(showLoader("searching..."));
        var promise;
        if (searchQuery === "")
          promise = listSupplier(
            tokens.access,
            searchParams.page,
            searchParams.rows_per_page
          );
        else
          promise = searchSuppliers(
            tokens.access,
            searchQuery,
            searchParams.page,
            searchParams.rows_per_page
          );
        promise
          .then((results) => {
            setTotalSuppliers(results.count);
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
  }, [searchQuery, tokens, searchParams, dispatch, lastSearchTimeout]);

  useEffect(() => {
    refreshSuppliers();
  }, [refreshSuppliers]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        Suppliers
      </Typography>
      <Grid container sx={{ width: "100%" }}>
        <Grid item xs={12} md={3} sx={{}}>
          <Stack>
            <Stack
              direction="row"
              style={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Total {totalSuppliers} Suppliers
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setAddSupplierOpen(true)}
              >
                New Supplier
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

            <List sx={{ width: "100%", bgcolor: "background.paper" }}>
              {searchResults.map((supplier, index) => (
                <ListItemButton
                  selected={supplier.id === selectedSupplier}
                  onClick={() => {
                    setSelectedSupplier(supplier.id);
                    navigate(supplier.id.toString());
                  }}
                >
                  <ListItemAvatar>
                    <StringAvatar>{supplier.name}</StringAvatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={supplier.name}
                    // secondary={supplier.stock}
                  />
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
                count={Math.ceil(totalSuppliers / searchParams.rows_per_page)}
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

        <Grid item xs={12} md={9}>
          <Suspense fallback={<PageLoadingSkeleton />}>
            <Outlet />
          </Suspense>
        </Grid>
      </Grid>
      <AddSupplierModal
        open={addSupplierOpen}
        handleClose={() => setAddSupplierOpen(false)}
        onAdd={(supplier) => {
          refreshSuppliers();
          setAddSupplierOpen(false);
        }}
      />
    </>
  );
}
