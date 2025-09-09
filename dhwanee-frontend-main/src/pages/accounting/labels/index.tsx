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
import { listLabel, searchLabels } from "src/api/accounting";

//   import StaffType from "src/types/staffs";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

//   import AddStaffModal from "./add-staff-modal";
import { Outlet } from "react-router-dom";
import StringAvatar from "src/components/string-avatar";
import AddLabelModal from "./add-label-modal";
import useEnsureAuth from "src/utils/ensure-login";

export default function StaffLists() {
  const navigate = useNavigate();
  const [addLabelOpen, setAddLabelOpen] = useState(false);
  const [totalLabels, setTotalLabels] = useState(0);
  const [searchResults, setSearchResults] = useState<
    Array<{ name: string; id: number }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useState({
    page: 1,
    rows_per_page: 15,
  });
  const [selectedLabel, setSelectedLabel] = useState<number | undefined>();
  const lastSearchTimeout = useRef<{
    elapsed: boolean;
    timeout: NodeJS.Timeout | null;
  }>({ timeout: null, elapsed: false });

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const ensureAuth = useEnsureAuth();
  useEffect(ensureAuth, [ensureAuth]);

  const refreshLabels = useCallback(() => {
    if (!lastSearchTimeout.current.elapsed) {
      if (lastSearchTimeout.current.timeout)
        clearTimeout(lastSearchTimeout.current.timeout);
      lastSearchTimeout.current.timeout = setTimeout(() => {
        lastSearchTimeout.current.timeout = null;
        lastSearchTimeout.current.elapsed = true;
        refreshLabels();
      }, 500);
    } else {
      lastSearchTimeout.current.elapsed = false;
      if (tokens) {
        dispatch(showLoader("searching..."));
        var promise;
        if (searchQuery === "")
          promise = listLabel(
            tokens.access,
            searchParams.page,
            searchParams.rows_per_page
          );
        else
          promise = searchLabels(
            tokens.access,
            searchQuery,
            searchParams.page,
            searchParams.rows_per_page
          );
        promise
          .then((results) => {
            setTotalLabels(results.count);
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
    refreshLabels();
  }, [refreshLabels]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        Labels
      </Typography>
      <Grid container sx={{ width: "100%" }}>
        <Grid item xs={12} md={2}>
          <Stack>
            <Stack
              direction="row"
              style={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Total {totalLabels} Labels
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setAddLabelOpen(true)}
              >
                New Label
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
              {searchResults.map((label, index) => (
                <ListItemButton
                  onClick={() => {
                    setSelectedLabel(label.id);
                    navigate(label.id.toString());
                  }}
                  selected={label.id === selectedLabel}
                >
                  <ListItemAvatar>
                    <StringAvatar>{label.name}</StringAvatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={label.name}
                    // secondary={label.stock}
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
                count={Math.ceil(totalLabels / searchParams.rows_per_page)}
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

        <Grid item xs={12} md={10} sx={{ p: 2, position: "relative" }}>
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
      <AddLabelModal
        open={addLabelOpen}
        handleClose={() => setAddLabelOpen(false)}
        onAdd={(label) => {
          refreshLabels();
          setAddLabelOpen(false);
        }}
      />
    </>
  );
}
