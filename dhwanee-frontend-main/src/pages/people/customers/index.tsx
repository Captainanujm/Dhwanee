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
import { useState, useEffect, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { listCustomer, searchCustomers } from "src/api/customers";

//   import StaffType from "src/types/staffs";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

//   import AddStaffModal from "./add-staff-modal";
import { Outlet } from "react-router-dom";
import StringAvatar from "src/components/string-avatar";
import AddCustomerModal from "./add-customer-modal";
import { CustomerType } from "src/types/customer";

export default function StaffLists() {
  const navigate = useNavigate();
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [searchResults, setSearchResults] = useState<CustomerType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useState({
    page: 1,
    rows_per_page: 15,
  });
  const [selectedCustomer, setSelectedCustomer] = useState<
    number | undefined
  >();
  const lastSearchTimeout = useRef<{
    elapsed: boolean;
    timeout: NodeJS.Timeout | null;
  }>({ timeout: null, elapsed: false });

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const refreshCustomers = useCallback(() => {
    if (!lastSearchTimeout.current.elapsed) {
      if (lastSearchTimeout.current.timeout)
        clearTimeout(lastSearchTimeout.current.timeout);
      lastSearchTimeout.current.timeout = setTimeout(() => {
        lastSearchTimeout.current.timeout = null;
        lastSearchTimeout.current.elapsed = true;
        refreshCustomers();
      }, 500);
    } else {
      lastSearchTimeout.current.elapsed = false;
      if (tokens) {
        dispatch(showLoader("searching..."));
        var promise;
        if (searchQuery === "")
          promise = listCustomer(
            tokens.access,
            searchParams.page,
            searchParams.rows_per_page
          );
        else
          promise = searchCustomers(
            tokens.access,
            searchQuery,
            searchParams.page,
            searchParams.rows_per_page
          );
        promise
          .then((results) => {
            setTotalCustomers(results.count);
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
    refreshCustomers();
  }, [refreshCustomers]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        Customers
      </Typography>
      <Grid container sx={{ width: "100%" }}>
        <Grid item xs={12} md={3} sx={{}}>
          <Stack>
            <Stack
              direction="row"
              style={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Total {totalCustomers} Customers
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setAddCustomerOpen(true)}
              >
                New Customer
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

            <List
              sx={{ width: "100%", bgcolor: "background.paper" }}
            >
              {searchResults.map((customer, index) => (
                <ListItemButton
                  selected={customer.id === selectedCustomer}
                  onClick={() => {
                    setSelectedCustomer(customer.id);
                    navigate(customer.id.toString());
                  }}
                >
                  <ListItemAvatar>
                    <StringAvatar>{customer.name}</StringAvatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={customer.name}
                    // secondary={customer.stock}
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
                count={Math.ceil(totalCustomers / searchParams.rows_per_page)}
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
          <Outlet />
        </Grid>
      </Grid>
      <AddCustomerModal
        open={addCustomerOpen}
        handleClose={() => setAddCustomerOpen(false)}
        onAdd={(customer) => {
          refreshCustomers();
          setAddCustomerOpen(false);
        }}
      />
    </>
  );
}
