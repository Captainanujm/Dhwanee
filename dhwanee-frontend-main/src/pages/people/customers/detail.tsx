import {
  Box,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
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
  getOneCustomer,
  getCustomerLedger,
  createTransactionToCustomer,
} from "src/api/customers";
import { CustomerType } from "src/types/customer";
import MD3Button from "src/components/md3-button";
import format from "date-fns/format";
import AddPaymentModal from "src/pages/accounting/add-payment-modal";
import { TransactionAtCreation } from "src/types/accounting";
import AddCustomerModal from "./add-customer-modal";

export default function CustomerDetails() {
  const [customer, setCustomer] = useState<CustomerType | null>(null);
  const [loading, setLoading] = useState(false);
  const [customerLedger, setCustomerLedger] = useState<any[]>([]);
  const [pageParams, setPageParams] = useState({
    number: 1,
    rows: 5,
  });
  const [totalProductItems, setTotalProductItems] = useState(0);
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [editCustomerModalOpen, setEditCustomerModalOpen] = useState(false);

  const { id } = useParams();
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const refreshCustomerLedger = useCallback(() => {
    if (tokens && id) {
      setLoading(true);
      getCustomerLedger(tokens.access, id, pageParams.number, pageParams.rows)
        .then((customeritems) => {
          setCustomerLedger(customeritems.results);
          setTotalProductItems(customeritems.count);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to create sub customer" }))
        )
        .finally(() => setLoading(false));
    }
  }, [dispatch, tokens, id, pageParams]);

  useEffect(refreshCustomerLedger, [refreshCustomerLedger]);

  useEffect(() => {
    if (tokens && id) {
      setLoading(true);
      getOneCustomer(tokens.access, id)
        .then((_customer) => {
          setCustomer(_customer);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to load customer details" }))
        )
        .finally(() => setLoading(false));
    }
  }, [tokens, dispatch, id]);

  const createSupplierPayment = useCallback(
    (trxn: TransactionAtCreation) => {
      if (tokens && id) {
        setLoading(true);
        createTransactionToCustomer(tokens.access, id, trxn)
          .then((supplier) => {
            refreshCustomerLedger();
            setAddPaymentModalOpen(false);
            setCustomer(supplier);
          })
          .catch(() =>
            dispatch(showSnackbar({ text: "Failed to create the transaction" }))
          )
          .finally(() => setLoading(false));
      }
    },
    [dispatch, refreshCustomerLedger, tokens, id]
  );
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
            <Typography variant="h5">Ledger entries</Typography>

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
          </Div>
          <DataTable
            header={["date", "remarks", "amount", "bal before", "bal after"]}
            rows={customerLedger.map((ledgerItem) => [
              format(new Date(ledgerItem.date), "dd/MM/yyyy hh:mm"),
              ledgerItem.remarks,
              ledgerItem.amount,
              ledgerItem.balance_before,
              ledgerItem.balance_after,
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
              <Typography variant="button">Customer Details</Typography>
              <Typography variant="h4" gutterBottom>
                {customer ? customer.name : "NA"}
              </Typography>
              <Div>
                <Typography variant="button">Number</Typography>
                <Typography variant="button">
                  {customer && customer.number}
                </Typography>
              </Div>
              <Div>
                <Typography variant="button">Address</Typography>
                <Typography variant="button">
                  {customer && customer.address}
                </Typography>
              </Div>
              <Div>
                <Typography variant="button">GSTIN</Typography>
                <Typography variant="button">
                  {customer && customer.gstin}
                </Typography>
              </Div>
              <Div>
                <Typography variant="button">State</Typography>
                <Typography variant="button">
                  {customer && customer.state}
                </Typography>
              </Div>
              <Typography variant="button">balance</Typography>
              <Typography variant="h3">
                {customer && customer.balance}
              </Typography>

              <MD3Button
                sx={{ mt: 4, width: "100%" }}
                variant="filled"
                size="large"
                color="primary"
                onClick={() => setEditCustomerModalOpen(true)}
              >
                Edit Details
              </MD3Button>
              <MD3Button
                sx={{ mt: 1, width: "100%" }}
                variant="filled"
                color="primary"
                onClick={() => setAddPaymentModalOpen(true)}
              >
                Add Receipt Voucher
              </MD3Button>
              <MD3Button
                sx={{ mt: 1, width: "100%" }}
                variant="filled"
                color="secondary"
              >
                Delete
              </MD3Button>
            </CardContent>
          </AccentCard>
        </Grid>
      </Grid>

      <AddPaymentModal
        open={addPaymentModalOpen}
        handleClose={() => setAddPaymentModalOpen(false)}
        noCreateInDB
        onAdd={createSupplierPayment}
        title="Receipt Voucher"
      />
      <AddCustomerModal
        open={editCustomerModalOpen}
        handleClose={() => setEditCustomerModalOpen(false)}
        initialData={customer ? customer : undefined}
        onAdd={(cust) => {
          setCustomer(cust)
          setEditCustomerModalOpen(false)
        }}
      />
    </>
  );
}
