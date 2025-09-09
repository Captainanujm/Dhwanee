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
  } from "@mui/material";
  import { useNavigate } from "react-router-dom";
  import { useState, useEffect, useCallback, useRef, Suspense } from "react";
  import { useAppDispatch, useAppSelector } from "src/redux/hooks";
  import { listPaymentMethod, searchPaymentMethods } from "src/api/accounting";
  
  //   import StaffType from "src/types/staffs";
  import { hideLoader, showLoader } from "src/components/loader/reducer";
  import { showSnackbar } from "src/components/snackbar/reducer";
  
  //   import AddStaffModal from "./add-staff-modal";
  import { Outlet } from "react-router-dom";
  import StringAvatar from "src/components/string-avatar";
  import AddPaymentMethodModal from "./add-method-modal";
import useEnsureAuth from "src/utils/ensure-login";
  
  export default function PaymentMethodList() {
    const navigate = useNavigate();
    const [addPaymentMethodOpen, setAddPaymentMethodOpen] = useState(false);
    const [totalPaymentMethods, setTotalPaymentMethods] = useState(0);
    const [searchResults, setSearchResults] = useState<
      Array<{ name: string; id: number }>
    >([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchParams, setSearchParams] = useState({
      page: 1,
      rows_per_page: 15,
    });
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
      number | undefined
    >();
    const lastSearchTimeout = useRef<{
      elapsed: boolean;
      timeout: NodeJS.Timeout | null;
    }>({ timeout: null, elapsed: false });
  
    const tokens = useAppSelector((state) => state.auth.tokens);
    const dispatch = useAppDispatch();
  
    const ensureAuth = useEnsureAuth();
    useEffect(ensureAuth, [ensureAuth]);
    
    const refreshPaymentMethods = useCallback(() => {
      if (!lastSearchTimeout.current.elapsed) {
        if (lastSearchTimeout.current.timeout)
          clearTimeout(lastSearchTimeout.current.timeout);
        lastSearchTimeout.current.timeout = setTimeout(() => {
          lastSearchTimeout.current.timeout = null;
          lastSearchTimeout.current.elapsed = true;
          refreshPaymentMethods();
        }, 500);
      } else {
        lastSearchTimeout.current.elapsed = false;
        if (tokens) {
          dispatch(showLoader("searching..."));
          var promise;
          if (searchQuery === "")
            promise = listPaymentMethod(
              tokens.access,
              searchParams.page,
              searchParams.rows_per_page
            );
          else
            promise = searchPaymentMethods(
              tokens.access,
              searchQuery,
              searchParams.page,
              searchParams.rows_per_page
            );
          promise
            .then((results) => {
              setTotalPaymentMethods(results.count);
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
      refreshPaymentMethods();
    }, [refreshPaymentMethods]);
  
    return (
      <>
        <Typography variant="h1" gutterBottom color="primary">
          Payment Methods
        </Typography>
        <Grid container sx={{ width: "100%" }}>
          <Grid item xs={12} md={2}>
            <Stack>
              <Stack
                direction="row"
                style={{ alignItems: "center", justifyContent: "space-between" }}
              >
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                  Total {totalPaymentMethods} Payment Methods
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setAddPaymentMethodOpen(true)}
                >
                  New Method
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
                {searchResults.map((paymentmethod, index) => (
                  <ListItemButton
                    onClick={() => {
                      setSelectedPaymentMethod(paymentmethod.id)
                      navigate(paymentmethod.id.toString());
                    }}
                    selected={paymentmethod.id === selectedPaymentMethod}
                  >
                    <ListItemAvatar>
                      <StringAvatar>{paymentmethod.name}</StringAvatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={paymentmethod.name}
                      // secondary={paymentmethod.stock}
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
                  count={Math.ceil(totalPaymentMethods / searchParams.rows_per_page)}
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
  
          <Grid item xs={12} md={10} sx={{p: 2, position: 'relative'}}>
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
        <AddPaymentMethodModal
          open={addPaymentMethodOpen}
          handleClose={() => setAddPaymentMethodOpen(false)}
          onAdd={(paymentmethod) => {
            refreshPaymentMethods();
            setAddPaymentMethodOpen(false);
          }}
        />
      </>
    );
  }
  