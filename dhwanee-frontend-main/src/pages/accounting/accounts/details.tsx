import {
  Box,
  Button,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Tooltip,
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
  getOneAccount,
  getAccountLedger,
  deleteTransaction,
} from "src/api/accounting";
import { AccountLedgerType, AccountType } from "src/types/accounting";
import { format } from "date-fns";
import { DeleteTwoTone, EditTwoTone } from "@mui/icons-material";
import useEnsureAuth from "src/utils/ensure-login";

export default function AccountDetails() {
  const [account, setAccount] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(false);
  const [accountLedger, setAccountLedger] = useState<AccountLedgerType[]>([]);
  const [ledgerPageParams, setLedgerPageParams] = useState({
    number: 1,
    rows: 10,
  });
  const [totalAccountLedgers, setTotalAccountLedgers] = useState(0);
  const [confirmationDialogSettings, setConfirmationDialogSettings] = useState<{
    open: boolean;
    title: string;
    description: string;
    onOk?: () => any;
    onCancel?: () => any;
  }>({
    open: false,
    title: "",
    description: "",
  });

  const { id } = useParams();
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const ensureAuth = useEnsureAuth();
  useEffect(ensureAuth, [ensureAuth]);

  const refreshAccountDetails = useCallback(() => {
    if (tokens && id) {
      setLoading(true);
      getOneAccount(tokens.access, id)
        .then((_account) => {
          setAccount(_account);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to load account details" }))
        )
        .finally(() => setLoading(false));
    }
  }, [tokens, dispatch, id]);

  const refreshAccountLedger = useCallback(() => {
    if (tokens && id) {
      setLoading(true);
      getAccountLedger(
        tokens.access,
        id,
        ledgerPageParams.number,
        ledgerPageParams.rows
      )
        .then((accountledgers) => {
          setAccountLedger(accountledgers.results);
          setTotalAccountLedgers(accountledgers.count);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to get account ledger" }))
        )
        .finally(() => setLoading(false));
    }
  }, [dispatch, tokens, id, ledgerPageParams]);

  useEffect(refreshAccountLedger, [refreshAccountLedger]);
  useEffect(refreshAccountDetails, [refreshAccountDetails]);

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
              <InputLabel id="account-item-rows-select-label">
                Rows per page
              </InputLabel>
              <Select
                labelId="account-item-rows-select-label"
                id="account-item-rows-select"
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
            header={["date", "remarks", "amount", "bal after", "actions"]}
            rows={accountLedger.map((ledgerItem) => [
              format(new Date(ledgerItem.date), "dd/MM/yyyy HH:mm"),
              ledgerItem.remarks,
              ledgerItem.amount,
              ledgerItem.balance_after,
              <Stack direction="row">
                <Tooltip
                  title={
                    ledgerItem.link
                      ? "This item cannot be edited directly because it is linked to " +
                        ledgerItem.link
                      : "Edit"
                  }
                >
                  <IconButton size="small" disabled={ledgerItem.link !== null}>
                    <EditTwoTone fontSize="small" />
                  </IconButton>
                </Tooltip>

                <IconButton
                  size="small"
                  disabled={ledgerItem.link !== null}
                  onClick={() => {
                    setConfirmationDialogSettings({
                      open: true,
                      title: "Confirmaiton",
                      description:
                        "Are you sure you want to delete this transaction?",
                      onOk: () => {
                        if (tokens) {
                          setLoading(true);
                          deleteTransaction(tokens.access, ledgerItem.id)
                            .then(() => {
                              dispatch(
                                showSnackbar({
                                  text: "Deleted the transaction",
                                  severity: "success",
                                })
                              );
                              refreshAccountLedger();
                            })
                            .catch((e) => {
                              dispatch(
                                showSnackbar({
                                  text: "Failed to delete the transaction",
                                })
                              );
                            })
                            .finally(() => setLoading(false));
                        }
                      },
                    });
                  }}
                >
                  <DeleteTwoTone fontSize="small" />
                </IconButton>
              </Stack>,
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
              count={Math.ceil(totalAccountLedgers / ledgerPageParams.rows)}
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
              <Typography variant="button">Account Details</Typography>
              <Typography variant="h4" gutterBottom>
                {account ? account.name : "NA"}
              </Typography>
              <Typography variant="button">Balance</Typography>
              <Typography variant="h4" gutterBottom>
                {account
                  ? Number(account.balance).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "0"}
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

      <Dialog
        sx={{ "& .MuiDialog-paper": { width: "80%", maxHeight: 435 } }}
        maxWidth="xs"
        open={confirmationDialogSettings.open}
        onClose={() =>
          setConfirmationDialogSettings({
            ...confirmationDialogSettings,
            open: false,
          })
        }
      >
        <DialogTitle>{confirmationDialogSettings.title}</DialogTitle>
        <DialogContent dividers>
          {confirmationDialogSettings.description}
        </DialogContent>
        <DialogActions>
          <Button
            autoFocus
            onClick={() => {
              confirmationDialogSettings.onCancel &&
                confirmationDialogSettings.onCancel();
              setConfirmationDialogSettings({
                ...confirmationDialogSettings,
                open: false,
              });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              confirmationDialogSettings.onOk &&
                confirmationDialogSettings.onOk();
              setConfirmationDialogSettings({
                ...confirmationDialogSettings,
                open: false,
              });
            }}
          >
            Ok
          </Button>
        </DialogActions>
      </Dialog>
      {/* {account && (
        <EditAccountModal
          onAdd={() => {
            setEditAccountModalOpen(false);
            refreshAccountDetails();
          }}
          open={editAccountModalOpen}
          handleClose={() => setEditAccountModalOpen(false)}
          initialData={account}
        />
      )} */}
    </>
  );
}
