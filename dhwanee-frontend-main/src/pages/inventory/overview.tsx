import { ChevronLeft, LaunchTwoTone } from "@mui/icons-material";
import {
  Card,
  CardContent,
  Chip,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  filterProducts,
  searchCategories,
  searchSubCategories,
} from "src/api/inventory";
import DataTable from "src/components/data-table";
import Div from "src/components/div";
import { hideLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";
import { id } from "date-fns/locale";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import {
  CategoryType,
  ProductType,
  SubCategoryType,
} from "src/types/inventory";

interface Searchable {
  name: string;
}

function PropertySelectCard<Item extends Searchable>(props: {
  searchFn: (tokens: string, searchTerm: string) => Promise<{ results: Item[] }>;
  selected: Item[];
  setSelected: (item: Item[]) => any;
  name: string;
}) {
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [showOptions, setShowOptions] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { searchFn, selected, setSelected } = props;

  useEffect(() => {
    if (tokens) {
      searchFn(tokens.access, searchTerm)
        .then((results) => {
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
  }, [tokens, dispatch, searchFn, searchTerm]);
  return (
    <Card variant="outlined" sx={{ my: 1 }}>
      <CardContent sx={{ p: 2, pb: "16px !important" }}>
        <Stack direction="row" justifyContent="space-between" width="100%">
          <Typography variant="h6">{props.name}</Typography>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            sx={{ transform: `rotate(${expanded ? 90 : -90}deg)` }}
          >
            <ChevronLeft />
          </IconButton>
        </Stack>
        {!expanded && (
          <Stack direction="row" gap={1} mt={0.5} flexWrap="wrap">
            {selected.map((cat) => (
              <Chip
                label={cat.name}
                variant="filled"
                color="primary"
                onClick={() => {
                  const index = selected.indexOf(cat);
                  setSelected(
                    selected.slice(0, index).concat(selected.slice(index + 1))
                  );
                }}
              />
            ))}
          </Stack>
        )}
        <Collapse in={expanded}>
          <TextField
            variant="outlined"
            label="Category"
            value={searchTerm}
            onChange={(evt) => setSearchTerm(evt.target.value)}
            sx={{ mt: 1, width: "100%" }}
          />
          {selected.length > 0 && (
            <Typography variant="button" color="gray" fontSize="small">
              Selected
            </Typography>
          )}
          <Stack direction="row" gap={1} mt={0.5} flexWrap="wrap">
            {selected.map((cat) => (
              <Chip
                label={cat.name}
                variant="filled"
                color="primary"
                onClick={() => {
                  const index = selected.indexOf(cat);
                  setSelected(
                    selected.slice(0, index).concat(selected.slice(index + 1))
                  );
                }}
              />
            ))}
          </Stack>
          <Stack direction="row" justifyContent="space-between" width="100%">
            <Typography variant="h6">Options</Typography>
            <IconButton
              onClick={() => setShowOptions(!showOptions)}
              sx={{ transform: `rotate(${showOptions ? 90 : -90}deg)` }}
            >
              <ChevronLeft />
            </IconButton>
          </Stack>
          <Stack
            direction="row"
            gap={1}
            mt={0.5}
            flexWrap={showOptions ? "wrap" : "nowrap"}
          >
            {searchResults.map((cat) => (
              <Chip
                label={cat.name}
                variant="outlined"
                color="primary"
                onClick={() => {
                  if (selected.includes(cat)) {
                    const index = selected.indexOf(cat);
                    setSelected(
                      selected.slice(0, index).concat(selected.slice(index + 1))
                    );
                  } else {
                    setSelected([...selected, cat]);
                  }
                }}
              />
            ))}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default function ProductList() {
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const [searchParams, setSearchParams] = useState<{
    category: CategoryType[];
    subcategory: SubCategoryType[];
    min_price: number;
    max_price: number;
    name: string;
    pagination: boolean;
    page: number;
    rows_per_page: number;
  }>({
    category: [],
    subcategory: [],
    min_price: 0,
    max_price: 0,
    name: "",
    pagination: true,
    rows_per_page: 20,
    page: 1,
  });
  const [searchResults, setSearchResults] = useState<ProductType[]>([]);
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const lastSearchTimeout = useRef<{
    elapsed: boolean;
    timeout: NodeJS.Timeout | null;
  }>({ timeout: null, elapsed: false });

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

      if (tokens && id) {
        setLoading(true);
        var finalParams: any = {};
        if (searchParams.category.length > 0) {
          finalParams.category = searchParams.category.map((el) => el.id);
        }
        if (searchParams.subcategory.length > 0) {
          finalParams.subcategory = searchParams.subcategory.map((el) => el.id);
        }
        if (searchParams.min_price > 0) {
          finalParams.min_price = searchParams.min_price;
        }
        if (searchParams.max_price > 0) {
          finalParams.max_price = searchParams.max_price;
        }
        if (searchParams.name !== "") {
          finalParams.name = searchParams.name;
        }
        if (searchParams.pagination) {
          finalParams.paginated = {
            page: searchParams.page,
            rows_per_page: searchParams.rows_per_page,
          };
        } else {
          finalParams.all = true;
        }
        filterProducts(tokens.access, finalParams)
          .then((products) => {
            setSearchResults(products.results);
            setSearchResultCount(products.count);
          })
          .catch(() =>
            dispatch(showSnackbar({ text: "failed to load products" }))
          )
          .finally(() => setLoading(false));
      }
    }
  }, [dispatch, tokens, searchParams, lastSearchTimeout]);

  useEffect(refreshProducts, [refreshProducts]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        Inventory Overview
      </Typography>
      <Grid container>
        <Grid item xs={12} md={9}>
          <DataTable
            loading={loading}
            limitHeight="80vh"
            header={[
              "id",
              "product",
              "stock",
              "selling price",
              "cat",
              "sub cat",
              "actions",
            ]}
            rows={searchResults.map((elem) => [
              elem.id,
              elem.name,
              elem.current_stock,
              elem.default_selling_price,
              typeof elem.subcategory === "object" ? elem.subcategory.category.name : "",
              typeof elem.subcategory === "object" ? elem.subcategory.name : "",
              <Link to={`/store/inventory/products/${elem.id}`}>
                <IconButton size="small">
                  <LaunchTwoTone fontSize="small" />
                </IconButton>
              </Link>,
            ])}
          />
        </Grid>
        <Grid item xs={12} md={3} sx={{ pl: 1 }}>
          <Typography variant="h6">
            {searchResultCount} search results
          </Typography>
          <Card variant="outlined" sx={{ my: 1 }}>
            <CardContent sx={{ p: 2, pb: "16px !important" }}>
              <Typography variant="h6">Name</Typography>
              <TextField
                variant="outlined"
                label="Product Name"
                value={searchParams.name}
                onChange={(evt) =>
                  setSearchParams({
                    ...searchParams,
                    name: evt.target.value,
                  })
                }
                sx={{ mt: 1, width: "100%" }}
              />
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ my: 1 }}>
            <CardContent sx={{ p: 2, pb: "16px !important" }}>
              <Typography variant="h6">Price range</Typography>
              <Stack direction={"row"} gap={1}>
                <TextField
                  variant="outlined"
                  label="Min"
                  value={
                    searchParams.min_price === 0 ? "" : searchParams.min_price
                  }
                  type="number"
                  onChange={(evt) =>
                    setSearchParams({
                      ...searchParams,
                      min_price: Number(evt.target.value),
                    })
                  }
                  sx={{ mt: 1, width: "100%" }}
                />
                <TextField
                  variant="outlined"
                  label="Max"
                  value={
                    searchParams.max_price === 0 ? "" : searchParams.max_price
                  }
                  type="number"
                  onChange={(evt) =>
                    setSearchParams({
                      ...searchParams,
                      max_price: Number(evt.target.value),
                    })
                  }
                  sx={{ mt: 1, width: "100%" }}
                />
              </Stack>
            </CardContent>
          </Card>
          <PropertySelectCard
            name="Categories"
            searchFn={useCallback(
              (tk, sr) => searchCategories(tk, sr, 1, 10),
              []
            )}
            selected={searchParams.category}
            setSelected={(cat) =>
              setSearchParams({ ...searchParams, category: cat })
            }
          />
          <PropertySelectCard
            name="Sub Categories"
            searchFn={useCallback(
              (tk, sr) => searchSubCategories(tk, sr, 1, 10),
              []
            )}
            selected={searchParams.subcategory}
            setSelected={(cat) =>
              setSearchParams({ ...searchParams, subcategory: cat })
            }
          />
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent sx={{ p: 2, pb: "16px !important" }}>
              <Typography variant="h6">Pagination</Typography>

              <Div>
                <Typography variant="body1">
                  Enable pagination? (Recommended)
                </Typography>
                <Switch
                  checked={searchParams.pagination}
                  onChange={(evt) =>
                    setSearchParams({
                      ...searchParams,
                      pagination: evt.target.checked,
                    })
                  }
                  inputProps={{ "aria-label": "controlled" }}
                />
              </Div>
              <FormControl fullWidth>
                <InputLabel id="product-item-rows-select-label">
                  Rows per page
                </InputLabel>
                <Select
                  labelId="product-item-rows-select-label"
                  id="product-item-rows-select"
                  value={searchParams.rows_per_page}
                  label="Rows per page"
                  onChange={(ev) =>
                    setSearchParams({
                      ...searchParams,
                      rows_per_page: Number(ev.target.value),
                    })
                  }
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>

              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  padding: "12px 0",
                }}
              >
                <Pagination
                  count={Math.ceil(
                    searchResultCount / searchParams.rows_per_page
                  )}
                  page={searchParams.page}
                  siblingCount={1}
                  boundaryCount={1}
                  showFirstButton
                  color="primary"
                  onChange={(_, page) =>
                    setSearchParams({ ...searchParams, page: page })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
