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
import {
  createCategory,
  listCategory,
  searchCategories,
} from "src/api/inventory";

//   import StaffType from "src/types/staffs";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

//   import AddStaffModal from "./add-staff-modal";
import { Outlet } from "react-router-dom";
import StringAvatar from "src/components/string-avatar";
import AddCategoryModal from "./add-category-modal";
import { CategoryTypeAtCreation } from "src/types/inventory";
import PageLoadingSkeleton from "src/components/page-loading-skeleton";

export default function StaffLists() {
  const navigate = useNavigate();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [totalCategories, setTotalCategories] = useState(0);
  const [searchResults, setSearchResults] = useState<
    Array<{ name: string; id: number }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useState({
    page: 1,
    rows_per_page: 15,
  });
  const [selectedCategory, setSelectedCategory] = useState<
    number | undefined
  >();
  const lastSearchTimeout = useRef<{
    elapsed: boolean;
    timeout: NodeJS.Timeout | null;
  }>({ timeout: null, elapsed: false });

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const refreshCategories = useCallback(() => {
    if (!lastSearchTimeout.current.elapsed) {
      if (lastSearchTimeout.current.timeout)
        clearTimeout(lastSearchTimeout.current.timeout);
      lastSearchTimeout.current.timeout = setTimeout(() => {
        lastSearchTimeout.current.timeout = null;
        lastSearchTimeout.current.elapsed = true;
        refreshCategories();
      }, 500);
    } else {
      lastSearchTimeout.current.elapsed = false;
      if (tokens) {
        dispatch(showLoader("searching..."));
        var promise;
        if (searchQuery === "")
          promise = listCategory(
            tokens.access,
            searchParams.page,
            searchParams.rows_per_page
          );
        else
          promise = searchCategories(
            tokens.access,
            searchQuery,
            searchParams.page,
            searchParams.rows_per_page
          );
        promise
          .then((results) => {
            setTotalCategories(results.count);
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

  const handleCategoryCreate = (category: CategoryTypeAtCreation) => {
    if (tokens) {
      dispatch(showLoader("Creating category"));
      createCategory(tokens.access, category)
        .then((res) => {
          refreshCategories();
        })
        .catch(() => {
          dispatch(showSnackbar({ text: "failed to create category" }));
        })
        .finally(() => {
          dispatch(hideLoader());
        });
    }
  };

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        Categories
      </Typography>
      <Grid container sx={{ width: "100%" }}>
        <Grid item xs={12} md={3} sx={{}}>
          <Stack>
            <Stack
              direction="row"
              style={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Total {totalCategories} Categories
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setAddCategoryOpen(true)}
              >
                New Category
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
              {searchResults.map((category, index) => (
                <ListItemButton
                  onClick={() => {
                    setSelectedCategory(category.id);
                    navigate(category.id.toString());
                  }}
                  selected={category.id === selectedCategory}
                >
                  <ListItemAvatar>
                    <StringAvatar>{category.name}</StringAvatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={category.name}
                    // secondary={category.stock}
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
                count={Math.ceil(totalCategories / searchParams.rows_per_page)}
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
          <Suspense fallback={<PageLoadingSkeleton />}>
            <Outlet />
          </Suspense>
        </Grid>
      </Grid>
      <AddCategoryModal
        open={addCategoryOpen}
        handleClose={() => setAddCategoryOpen(false)}
        onAdd={(category) => {
          handleCategoryCreate(category);
          setAddCategoryOpen(false);
        }}
      />
    </>
  );
}
