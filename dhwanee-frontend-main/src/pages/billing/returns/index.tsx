import {
  Grid,
  TextField,
  Typography,
  Stack,
  Pagination,
  List,
  ListItemText,
  ListItemButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { listSalesReturns, searchSalesReturns } from "src/api/billing";

//   import StaffType from "src/types/staffs";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

//   import AddStaffModal from "./add-staff-modal";
import { Outlet } from "react-router-dom";
import format from "date-fns/format";

export default function OldSalesReturns() {
  const navigate = useNavigate();
  const [totalSalesReturns, setTotalSalesReturns] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useState({
    page: 1,
    rows_per_page: 15,
  });
  const [selectedBill, setSelectedBill] = useState<number | undefined>();
  const lastSearchTimeout = useRef<{
    elapsed: boolean;
    timeout: NodeJS.Timeout | null;
  }>({ timeout: null, elapsed: false });

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const refreshSalesReturns = useCallback(() => {
    if (!lastSearchTimeout.current.elapsed) {
      if (lastSearchTimeout.current.timeout)
        clearTimeout(lastSearchTimeout.current.timeout);
      lastSearchTimeout.current.timeout = setTimeout(() => {
        lastSearchTimeout.current.timeout = null;
        lastSearchTimeout.current.elapsed = true;
        refreshSalesReturns();
      }, 500);
    } else {
      lastSearchTimeout.current.elapsed = false;
      if (tokens) {
        dispatch(showLoader("searching..."));
        var promise;
        if (searchQuery === "")
          promise = listSalesReturns(
            tokens.access,
            searchParams.page,
            searchParams.rows_per_page
          );
        else
          promise = searchSalesReturns(
            tokens.access,
            searchQuery,
            searchParams.page,
            searchParams.rows_per_page
          );
        promise
          .then((results) => {
            setTotalSalesReturns(results.count);
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
    refreshSalesReturns();
  }, [refreshSalesReturns]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        Sales Returns History
      </Typography>
      <Grid container sx={{ width: "100%" }}>
        <Grid item xs={12} md={3} sx={{}}>
          <Stack>
            <Stack
              direction="row"
              style={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Total {totalSalesReturns} Sales Returns
              </Typography>
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
              {searchResults.map((bill, index) => (
                <ListItemButton
                  selected={bill.id === selectedBill}
                  onClick={() => {
                    setSelectedBill(bill.id);

                    navigate(bill.id.toString());
                  }}
                >
                  <ListItemText
                    primary={bill.number}
                    secondary={format(new Date(bill.date), "dd/MM/yyyy hh:mm")}
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
                count={Math.ceil(totalSalesReturns / searchParams.rows_per_page)}
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
    </>
  );
}
