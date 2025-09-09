import { ChevronLeft } from "@mui/icons-material";
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
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  filterTransactions,
  searchAccounts,
  searchLabels,
  searchPaymentMethods,
} from "src/api/accounting";
import AddPaymentModal from "src/pages/accounting/add-payment-modal";
import DataTable from "src/components/data-table";
import Div from "src/components/div";
import { hideLoader } from "src/components/loader/reducer";
import MD3Button from "src/components/md3-button";
import { showSnackbar } from "src/components/snackbar/reducer";
import { startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import {
  AccountLedgerType,
  AccountType,
  PaymentLabelType,
  PaymentMethodType,
} from "src/types/accounting";
import dateToIsoString from "src/utils/date-to-string";
import useEnsureAuth from "src/utils/ensure-login";

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

export default function AccountingOverview() {
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const [searchParams, setSearchParams] = useState<{
    account: AccountType[];
    method: PaymentMethodType[];
    labels: PaymentLabelType[];
    from_date: Date;
    to_date: Date;
    description: string;
    pagination: boolean;
    page: number;
    rows_per_page: number;
  }>({
    account: [],
    method: [],
    labels: [],
    from_date: startOfDay(new Date()),
    to_date: new Date(),
    description: "",
    pagination: true,
    rows_per_page: 20,
    page: 1,
  });
  const [searchResults, setSearchResults] = useState<AccountLedgerType[]>([]);
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const lastSearchTimeout = useRef<{
    elapsed: boolean;
    timeout: NodeJS.Timeout | null;
  }>({ timeout: null, elapsed: false });

  const ensureAuth = useEnsureAuth();
  useEffect(ensureAuth, [ensureAuth]);
  
  const refreshResults = useCallback(() => {
    if (!lastSearchTimeout.current.elapsed) {
      if (lastSearchTimeout.current.timeout)
        clearTimeout(lastSearchTimeout.current.timeout);
      lastSearchTimeout.current.timeout = setTimeout(() => {
        lastSearchTimeout.current.timeout = null;
        lastSearchTimeout.current.elapsed = true;
        refreshResults();
      }, 500);
    } else {
      lastSearchTimeout.current.elapsed = false;

      if (tokens && id) {
        setLoading(true);
        var finalParams: any = {};
        if (searchParams.account.length > 0) {
          finalParams.account = searchParams.account.map((el) => el.id);
        }
        if (searchParams.method.length > 0) {
          finalParams.method = searchParams.method.map((el) => el.id);
        }
        if (searchParams.labels.length > 0) {
          finalParams.labels = searchParams.labels.map((el) => el.id);
        }
        if (searchParams.from_date !== null) {
          finalParams.from_date = dateToIsoString(searchParams.from_date);
        }
        if (searchParams.to_date !== null) {
          finalParams.to_date = dateToIsoString(searchParams.to_date);
        }
        if (searchParams.description !== "") {
          finalParams.description = searchParams.description;
        }
        if (searchParams.pagination) {
          finalParams.paginated = {
            page: searchParams.page,
            rows_per_page: searchParams.rows_per_page,
          };
        } else {
          finalParams.all = true;
        }
        filterTransactions(tokens.access, finalParams)
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

  useEffect(refreshResults, [refreshResults]);

  return (
    <>
      <Typography variant="h1" gutterBottom color="primary">
        Overview
      </Typography>
      <Grid container>
        <Grid item xs={12} md={9}>
          <DataTable
            loading={loading}
            limitHeight="80vh"
            header={["id", "description", "account", "method", "branch", "amount", "bal"]}
            rows={searchResults.map((elem) => [
              elem.id,
              <>
                {elem.remarks}
                <Stack direction="row">
                  {elem.labels.map((lab) => (
                    <Chip size="small" label={lab.name} />
                  ))}
                </Stack>
              </>,
              elem.account.name,
              elem.method ? elem.method.name : "",
              typeof elem.account.branch === "number" ? elem.account.branch : elem.account.branch.name,
              Number(elem.amount).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
              Number(elem.balance_after).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            ])}
          />
        </Grid>
        <Grid item xs={12} md={3} sx={{ pl: 1 }}>
          <Typography variant="h6">
            {searchResultCount} search results
          </Typography>
          <MD3Button
            sx={{ width: "100%", my: 1 }}
            variant="filled"
            color="primary"
            onClick={() => {
              setAddPaymentModalOpen(true);
            }}
          >
            New Expense
          </MD3Button>
          <Card variant="outlined" sx={{ my: 1 }}>
            <CardContent sx={{ p: 2, pb: "16px !important" }}>
              <Typography variant="h6">Description</Typography>
              <TextField
                variant="outlined"
                label="Description"
                value={searchParams.description}
                onChange={(evt) =>
                  setSearchParams({
                    ...searchParams,
                    description: evt.target.value,
                  })
                }
                sx={{ mt: 1, width: "100%" }}
              />
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ my: 1 }}>
            <CardContent sx={{ p: 2, pb: "16px !important" }}>
              <Typography variant="h6">Date range</Typography>
              <Stack direction={"row"} gap={1}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From Date"
                    format="dd MMM yy"
                    value={searchParams.from_date}
                    onChange={(val) =>
                      val &&
                      setSearchParams({
                        ...searchParams,
                        from_date: new Date(
                          val.getFullYear(),
                          val.getMonth(),
                          val.getDate(),
                          0,
                          0,
                          0
                        ),
                      })
                    }
                  />
                  <DatePicker
                    label="To Date"
                    format="dd MMM yy"
                    value={searchParams.to_date}
                    onChange={(val) =>
                      val &&
                      setSearchParams({
                        ...searchParams,
                        to_date: new Date(
                          val.getFullYear(),
                          val.getMonth(),
                          val.getDate(),
                          0,
                          0,
                          0
                        ),
                      })
                    }
                  />
                </LocalizationProvider>
              </Stack>
            </CardContent>
          </Card>
          <PropertySelectCard
            name="Accounts"
            searchFn={useCallback(
              (tk, sr) => searchAccounts(tk, sr, 1, 10),
              []
            )}
            selected={searchParams.account}
            setSelected={(cat) =>
              setSearchParams({ ...searchParams, account: cat })
            }
          />
          <PropertySelectCard
            name="Payment Methods"
            searchFn={useCallback(
              (tk, sr) => searchPaymentMethods(tk, sr, 1, 10),
              []
            )}
            selected={searchParams.method}
            setSelected={(cat) =>
              setSearchParams({ ...searchParams, method: cat })
            }
          />
          <PropertySelectCard
            name="Payment Labels"
            searchFn={useCallback((tk, sr) => searchLabels(tk, sr, 1, 10), [])}
            selected={searchParams.labels}
            setSelected={(cat) =>
              setSearchParams({ ...searchParams, labels: cat })
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
      <AddPaymentModal
        open={addPaymentModalOpen}
        handleClose={() => setAddPaymentModalOpen(false)}
        onAdd={() => {
          setAddPaymentModalOpen(false);
          refreshResults();
        }}
      />
    </>
  );
}
