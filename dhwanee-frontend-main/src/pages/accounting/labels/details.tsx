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
  Typography,
} from "@mui/material";
import { showSnackbar } from "src/components/snackbar/reducer";
import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { useParams } from "react-router-dom";
import Div from "src/components/div";
import AccentCard from "src/components/accent-card";
import DataTable from "src/components/data-table";
import { getOneLabel, getLabelLedger } from "src/api/accounting";
import { PaymentLabelLedgerType, PaymentLabelType } from "src/types/accounting";
import { format } from "date-fns";
import { DeleteTwoTone, EditTwoTone } from "@mui/icons-material";
import useEnsureAuth from "src/utils/ensure-login";

export default function PaymentLabelDetails() {
  const [paymentlabel, setPaymentLabel] = useState<PaymentLabelType | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentlabelLedger, setPaymentLabelLedger] = useState<PaymentLabelLedgerType[]>([]);
  const [ledgerPageParams, setLedgerPageParams] = useState({
    number: 1,
    rows: 10,
  });
  const [totalPaymentLabelLedgers, setTotalPaymentLabelLedgers] = useState(0);

  const { id } = useParams();
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const ensureAuth = useEnsureAuth();
  useEffect(ensureAuth, [ensureAuth]);

  const refreshPaymentLabelDetails = useCallback(() => {
    if (tokens && id) {
      setLoading(true);
      getOneLabel(tokens.access, id)
        .then((_paymentlabel) => {
          setPaymentLabel(_paymentlabel);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to load paymentlabel details" }))
        )
        .finally(() => setLoading(false));
    }
  }, [tokens, dispatch, id]);

  const refreshPaymentLabelLedger = useCallback(() => {
    if (tokens && id) {
      setLoading(true);
      getLabelLedger(
        tokens.access,
        id,
        ledgerPageParams.number,
        ledgerPageParams.rows
      )
        .then((paymentlabelledgers) => {
          setPaymentLabelLedger(paymentlabelledgers.results);
          setTotalPaymentLabelLedgers(paymentlabelledgers.count);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to get paymentlabel ledger" }))
        )
        .finally(() => setLoading(false));
    }
  }, [dispatch, tokens, id, ledgerPageParams]);

  useEffect(refreshPaymentLabelLedger, [refreshPaymentLabelLedger]);
  useEffect(refreshPaymentLabelDetails, [refreshPaymentLabelDetails]);

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
              <InputLabel id="paymentlabel-item-rows-select-label">
                Rows per page
              </InputLabel>
              <Select
                labelId="paymentlabel-item-rows-select-label"
                id="paymentlabel-item-rows-select"
                value={ledgerPageParams.rows}
                label="Rows per page"
                onChange={(ev) =>
                  setLedgerPageParams({
                    ...ledgerPageParams,
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
            header={["date", "remarks", "amount", "bal after"]}
            rows={paymentlabelLedger.map((ledgerItem) => [
              format(new Date(ledgerItem.date), "dd/MM/yyyy HH:mm"),
              ledgerItem.remarks,
              ledgerItem.amount,
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
              count={Math.ceil(totalPaymentLabelLedgers / ledgerPageParams.rows)}
              page={ledgerPageParams.number}
              siblingCount={1}
              boundaryCount={1}
              showFirstButton
              color="primary"
              onChange={(_, page) =>
                setLedgerPageParams({ ...ledgerPageParams, number: page })
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
              <Typography variant="button">PaymentLabel Details</Typography>
              <Typography variant="h4" gutterBottom>
                {paymentlabel ? paymentlabel.name : "NA"}
              </Typography>
              <Div>
                <span style={{ flexGrow: 1 }} />
                <IconButton size="small" color="primary">
                  <EditTwoTone fontSize="small" />
                </IconButton>
                <IconButton size="small" color="primary">
                  <DeleteTwoTone fontSize="small" />
                </IconButton>
              </Div>
            </CardContent>
          </AccentCard>
        </Grid>
      </Grid>
      {/* {paymentlabel && (
        <EditPaymentLabelModal
          onAdd={() => {
            setEditPaymentLabelModalOpen(false);
            refreshPaymentLabelDetails();
          }}
          open={editPaymentLabelModalOpen}
          handleClose={() => setEditPaymentLabelModalOpen(false)}
          initialData={paymentlabel}
        />
      )} */}
    </>
  );
}
