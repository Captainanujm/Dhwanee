import {
  Box,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { showSnackbar } from "src/components/snackbar/reducer";
import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { useParams } from "react-router-dom";
import Div from "src/components/div";
import AccentCard from "src/components/accent-card";
import DataTable from "src/components/data-table";
import {
  createTransactionToSupplier,
  getOneSupplier,
  getSupplierLedger,
  listSupplierBills,
} from "src/api/suppliers";
import { SupplierBillType, SupplierType } from "src/types/suppliers";
import format from "date-fns/format";
import {
  AddCardTwoTone,
  DeleteTwoTone,
  EditTwoTone,
  OpenInBrowserTwoTone,
  PrintTwoTone,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { endOfMonth, startOfMonth } from "date-fns";
import EditSupplierModal from "./edit-supplier-modal";
import SUPPLIERS from "src/api/suppliers/endpoints";
import dateToIsoString from "src/utils/date-to-string";
import AddPaymentModal from "src/pages/accounting/add-payment-modal";
import { TransactionAtCreation } from "src/types/accounting";
import MD3Button from "src/components/md3-button";

export default function SupplierDetails() {
  const [supplier, setSupplier] = useState<SupplierType | null>(null);
  const [loading, setLoading] = useState(false);
  const [supplierLedger, setSupplierLedger] = useState<any[]>([]);
  const [pageParams, setPageParams] = useState({
    number: 1,
    rows: 5,
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [totalProductItems, setTotalProductItems] = useState(0);
  const [supplierBills, setSupplierBills] = useState<SupplierBillType[]>([]);
  const [pageParamsForBills, setPageParamsForBills] = useState({
    number: 1,
    rows: 5,
  });
  const [totalSupplierBills, setTotalSupplierBills] = useState(0);
  const [editSupplierModalOpen, setEditSupplierModalOpen] = useState(false);
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);

  const { id } = useParams();
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const refreshSupplierLedger = useCallback(() => {
    if (tokens && id) {
      setLoading(true);
      getSupplierLedger(
        tokens.access,
        id,
        pageParams.number,
        pageParams.rows,
        pageParams.from,
        pageParams.to
      )
        .then((supplieritems) => {
          setSupplierLedger(supplieritems.results);
          setTotalProductItems(supplieritems.count);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to load supplier ledger" }))
        )
        .finally(() => setLoading(false));
    }
  }, [dispatch, tokens, id, pageParams]);

  const refreshSupplierBills = useCallback(() => {
    if (tokens && id) {
      setLoading(true);
      listSupplierBills(
        tokens.access,
        id,
        pageParamsForBills.number,
        pageParamsForBills.rows
      )
        .then((supplieritems) => {
          console.log(supplieritems);
          setSupplierBills(supplieritems.results);
          setTotalSupplierBills(supplieritems.count);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to load supplier ledger" }))
        )
        .finally(() => setLoading(false));
    }
  }, [dispatch, tokens, id, pageParamsForBills]);

  const createSupplierPayment = useCallback(
    (trxn: TransactionAtCreation) => {
      if (tokens && id) {
        setLoading(true);
        createTransactionToSupplier(tokens.access, id, trxn)
          .then((supplier) => {
            refreshSupplierLedger();
            setAddPaymentModalOpen(false);
            setSupplier(supplier);
          })
          .catch(() =>
            dispatch(showSnackbar({ text: "Failed to create the transaction" }))
          )
          .finally(() => setLoading(false));
      }
    },
    [dispatch, refreshSupplierLedger, tokens, id]
  );

  useEffect(refreshSupplierLedger, [refreshSupplierLedger]);
  useEffect(refreshSupplierBills, [refreshSupplierBills]);

  useEffect(() => {
    if (tokens && id) {
      setLoading(true);
      getOneSupplier(tokens.access, id)
        .then((_supplier) => {
          setSupplier(_supplier);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to load supplier details" }))
        )
        .finally(() => setLoading(false));
    }
  }, [tokens, dispatch, id]);

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backdropFilter: "blur(8px)",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          display: loading ? "flex" : "none",
        }}
      >
        <CircularProgress />
      </Box>
      <Grid container sx={{ position: "relative", zIndex: 900 }}>
        <Grid item xs={8} sx={{ px: 1 }}>
          <Div sx={{ mb: 1 }}>
            <Typography variant="h5">Supplier Bills</Typography>

            <FormControl fullWidth sx={{ maxWidth: "150px" }}>
              <InputLabel id="product-item-rows-select-label">
                Rows per page
              </InputLabel>
              <Select
                labelId="product-item-rows-select-label"
                id="product-item-rows-select"
                value={pageParamsForBills.rows}
                label="Rows per page"
                onChange={(ev) =>
                  setPageParamsForBills({
                    ...pageParamsForBills,
                    rows: Number(ev.target.value),
                  })
                }
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Div>
          <DataTable
            header={[
              "date",
              "number",
              "payable amount",
              "number of items",
              "received status",
              "open",
            ]}
            rows={supplierBills.map((billItem) => [
              format(new Date(billItem.date), "dd/MM/yyyy"),
              billItem.number,
              billItem.payable,
              billItem.products.length,
              billItem.received_status ? "received" : "awaited",
              <Link
                to={"/inventory/supplier-invoice/view/" + billItem.id}
              >
                <IconButton size="small">
                  <OpenInBrowserTwoTone fontSize="small" />
                </IconButton>
              </Link>,
            ])}
          />

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              padding: "12px 0",
            }}
          >
            <Pagination
              count={Math.ceil(totalSupplierBills / pageParamsForBills.rows)}
              page={pageParamsForBills.number}
              siblingCount={1}
              boundaryCount={1}
              showFirstButton
              color="primary"
              onChange={(_, page) =>
                setPageParamsForBills({ ...pageParamsForBills, number: page })
              }
            />
          </div>
          <Div sx={{ mb: 1 }}>
            <Typography variant="h5">Ledger entries</Typography>

            <Stack direction="row">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="From Date"
                  value={pageParams.from}
                  sx={{ maxWidth: "200px", mr: 1 }}
                  format="dd MMM yy"
                  onChange={(newValue) =>
                    newValue && setPageParams({ ...pageParams, from: newValue })
                  }
                />
                <DatePicker
                  label="To Date"
                  value={pageParams.to}
                  sx={{ maxWidth: "200px", mr: 1 }}
                  format="dd MMM yy"
                  onChange={(newValue) =>
                    newValue && setPageParams({ ...pageParams, to: newValue })
                  }
                />
              </LocalizationProvider>
              <FormControl fullWidth sx={{ maxWidth: "150px" }}>
                <InputLabel id="product-item-rows-select-label">
                  Rows per page
                </InputLabel>
                <Select
                  labelId="product-item-rows-select-label"
                  id="product-item-rows-select"
                  value={pageParams.rows}
                  label="Rows per page"
                  onChange={(ev) =>
                    setPageParams({
                      ...pageParams,
                      rows: Number(ev.target.value),
                    })
                  }
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Div>
          <DataTable
            header={["date", "remarks", "amount", "bal before", "bal after"]}
            rows={supplierLedger.map((ledgerItem) => [
              format(new Date(ledgerItem.date), "dd MMM yy hh:mm"),
              ledgerItem.remarks,
              ledgerItem.amount,
              ledgerItem.balance_before,
              ledgerItem.balance_after,
            ])}
            moreOptions={[
              {
                name: "Print as PDF",
                icon: <PrintTwoTone />,
                onClick: () => {
                  if (supplier) {
                    const a = document.createElement("a");
                    a.setAttribute(
                      "href",
                      SUPPLIERS.PRINT_LEDGER.replace(
                        "{{id}}",
                        supplier.id.toString()
                      ) +
                        "?from=" +
                        encodeURIComponent(dateToIsoString(pageParams.from)) +
                        "&to=" +
                        encodeURIComponent(dateToIsoString(pageParams.to))
                    );
                    a.setAttribute("target", "_blank");
                    a.style.display = "none";
                    document.body.appendChild(a);
                    a.click();
                  }
                },
              },
            ]}
          />

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              padding: "12px 0",
            }}
          >
            <Pagination
              count={Math.ceil(totalProductItems / pageParams.rows)}
              page={pageParams.number}
              siblingCount={1}
              boundaryCount={1}
              showFirstButton
              color="primary"
              onChange={(_, page) =>
                setPageParams({ ...pageParams, number: page })
              }
            />
          </div>
        </Grid>
        <Grid item xs={4}>
          <AccentCard>
            <CardContent
              sx={{
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                padding: 2,
              }}
            >
              <Typography variant="button">Supplier Details</Typography>
              <Typography
                variant="h4"
                gutterBottom
                sx={{ wordWrap: "anywhere" }}
              >
                {supplier ? supplier.name : "NA"}
              </Typography>
              <Div>
                <Typography variant="button">Number</Typography>
                <Typography variant="button">
                  {supplier && supplier.number}
                </Typography>
              </Div>
              <Div>
                <Typography variant="button">Address</Typography>
                <Typography variant="button">
                  {supplier && supplier.address}
                </Typography>
              </Div>
              <Div>
                <Typography variant="button">GSTIN</Typography>
                <Typography variant="button">
                  {supplier && supplier.gstin}
                </Typography>
              </Div>
              <Typography variant="button">balance</Typography>
              <Typography variant="h3">
                {supplier && supplier.balance}
              </Typography>
              <Div sx={{ mt: 4, gap: 1 }}>
                <Link
                  to={
                    "/inventory/supplier-invoice/?supplier=" +
                    (supplier ? supplier.id : 0)
                  }
                >
                  <MD3Button
                    variant="filled"
                    color="primary"
                    sx={{ flexGrow: 1 }}
                  >
                    New Supplier Bill
                  </MD3Button>
                </Link>
                <IconButton
                  size="large"
                  color="primary"
                  onClick={() => setAddPaymentModalOpen(true)}
                >
                  <AddCardTwoTone />
                </IconButton>
                <IconButton
                  size="large"
                  color="info"
                  onClick={() => setEditSupplierModalOpen(true)}
                >
                  <EditTwoTone />
                </IconButton>
                <IconButton size="large" color="error">
                  <DeleteTwoTone />
                </IconButton>
              </Div>
            </CardContent>
          </AccentCard>
        </Grid>
      </Grid>
      {supplier && (
        <EditSupplierModal
          open={editSupplierModalOpen}
          handleClose={() => setEditSupplierModalOpen(false)}
          initialValue={supplier}
          onAdd={(supp) => {
            setSupplier(supp);
            setEditSupplierModalOpen(false);
          }}
        />
      )}
      <AddPaymentModal
        open={addPaymentModalOpen}
        handleClose={() => setAddPaymentModalOpen(false)}
        noCreateInDB
        onAdd={createSupplierPayment}
      />
    </>
  );
}
