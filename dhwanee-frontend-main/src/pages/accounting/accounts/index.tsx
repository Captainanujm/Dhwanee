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
import { listAccount, searchAccounts } from "src/api/accounting";

//   import StaffType from "src/types/staffs";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

//   import AddStaffModal from "./add-staff-modal";
import { Outlet } from "react-router-dom";
import StringAvatar from "src/components/string-avatar";
import AddAccountModal from "./add-account-modal";
import useEnsureAuth from "src/utils/ensure-login";

export default function AccountLists() {
  const navigate = useNavigate();
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [searchResults, setSearchResults] = useState<
    Array<{ name: string; id: number }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useState({
    page: 1,
    rows_per_page: 15,
  });
  const [selectedAccount, setSelectedAccount] = useState<number | undefined>();
  const lastSearchTimeout = useRef<{
    elapsed: boolean;
    timeout: NodeJS.Timeout | null;
  }>({ timeout: null, elapsed: false });

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const ensureAuth = useEnsureAuth();
  useEffect(ensureAuth, [ensureAuth]);

  const refreshAccounts = useCallback(() => {
    if (!lastSearchTimeout.current.elapsed) {
      if (lastSearchTimeout.current.timeout)
        clearTimeout(lastSearchTimeout.current.timeout);
      lastSearchTimeout.current.timeout = setTimeout(() => {
        lastSearchTimeout.current.timeout = null;
        lastSearchTimeout.current.elapsed = true;
        refreshAccounts();
      }, 500);
    } else {
      lastSearchTimeout.current.elapsed = false;
      if (tokens) {
        dispatch(showLoader("searching..."));
        var promise;
        if (searchQuery === "")
          promise = listAccount(
            tokens.access,
            searchParams.page,
            searchParams.rows_per_page
          );
        else
          promise = searchAccounts(
            tokens.access,
            searchQuery,
            searchParams.page,
            searchParams.rows_per_page
          );
        promise
          .then((results) => {
            setTotalAccounts(results.count);
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
    refreshAccounts();
  }, [refreshAccounts]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        Accounts
      </Typography>
      <Grid container sx={{ width: "100%" }}>
        <Grid item xs={12} md={3}>
          <Stack>
            <Stack
              direction="row"
              style={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Total {totalAccounts} Accounts
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setAddAccountOpen(true)}
              >
                New Account
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
              {searchResults.map((account, index) => (
                <ListItemButton
                  onClick={() => {
                    setSelectedAccount(account.id);
                    navigate(account.id.toString());
                  }}
                  selected={account.id === selectedAccount}
                >
                  <ListItemAvatar>
                    <StringAvatar>{account.name}</StringAvatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={account.name}
                    // secondary={account.stock}
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
                count={Math.ceil(totalAccounts / searchParams.rows_per_page)}
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
      <AddAccountModal
        open={addAccountOpen}
        handleClose={() => setAddAccountOpen(false)}
        onAdd={(account) => {
          refreshAccounts();
          setAddAccountOpen(false);
        }}
      />
    </>
  );
}
