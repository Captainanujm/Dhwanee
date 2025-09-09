import { Card, Divider, Modal, TextField, Typography } from "@mui/material";
import { createRef, useCallback, useState } from "react";
import MD3Button from "src/components/md3-button";
import {
  PaymentLabelType,
  PaymentMethodType,
  TransactionAtCreation,
} from "src/types/accounting";
import { useAppSelector } from "src/redux/hooks";
import PaymentMethodsAutoComplete from "src/components/autocompletes/paymentmethod-autocomplete";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import PaymentLabelsMultiSelect from "../../components/payment-labels-multiselect";
import { createTransaction } from "src/api/accounting";
import dateToIsoString from "src/utils/date-to-string";
import useApi from "src/utils/use-api";

export default function AddPaymentModal(props: {
  open: boolean;
  onAdd: (payment: any) => any;
  handleClose: (_?: any) => any;
  noCreateInDB?: boolean;
  title?: string;
}) {
  const [error, setError] = useState<null | string>(null);
  const [date, setDate] = useState(new Date());
  const [method, setMethod] = useState<PaymentMethodType>();
  const [labels, setLabels] = useState<PaymentLabelType[]>([]);
  const descriptionRef = createRef<HTMLInputElement>();
  const amountRef = createRef<HTMLInputElement>();

  const tokens = useAppSelector((state) => state.auth.tokens);
  const { onAdd } = props;
  const call = useApi();

  const createTrxn = useCallback(
    (trxn: TransactionAtCreation) => {
      if (tokens) {
        call(createTransaction(tokens.access, trxn)).then(() => {
          onAdd({});
        });
      }
    },
    [tokens, onAdd, call]
  );

  return (
    <Modal
      open={props.open}
      onClose={() => {
        setError(null);
        props.handleClose();
      }}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Card
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "background.paper",
          p: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          minWidth: "30%",
          maxWidth: "60%",
        }}
      >
        <Typography
          id="modal-modal-title"
          variant="h4"
          component="h2"
          sx={{ textAlign: "center" }}
        >
          Add {props.title || "Payment"}
        </Typography>
        {error && (
          <Typography color="error" fontSize="small">
            {error}
          </Typography>
        )}
        <Divider variant="middle" sx={{ my: 2, width: "70%" }} />
        <TextField
          variant="outlined"
          label="Description"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          required
          inputRef={descriptionRef}
        />
        <TextField
          variant="outlined"
          label="Amount"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          required
          inputRef={amountRef}
          type="number"
        />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date"
            format="dd MMM yy"
            value={date}
            sx={{ my: 1, width: "80%", minWidth: "320px" }}
            onChange={(val) =>
              val &&
              setDate(
                new Date(
                  val.getFullYear(),
                  val.getMonth(),
                  val.getDate(),
                  0,
                  0,
                  0
                )
              )
            }
          />
        </LocalizationProvider>
        <PaymentMethodsAutoComplete
          paymentmethods={method}
          token={tokens ? tokens.access : null}
          setPaymentMethods={setMethod}
        />
        <PaymentLabelsMultiSelect selected={labels} setSelected={setLabels} />
        <Divider variant="middle" sx={{ my: 1, width: "70%" }} />
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            gap: 4,
          }}
        >
          <MD3Button
            sx={{ float: "left", width: "100%" }}
            variant="filledTonal"
            onClick={() => {
              setError(null);
              props.handleClose();
            }}
          >
            Cancel
          </MD3Button>
          <MD3Button
            sx={{ width: "100%" }}
            variant="filled"
            onClick={() => {
              if (method === undefined) {
                setError("Please select a valid method");
                return;
              }
              if (
                descriptionRef.current &&
                descriptionRef.current.value === ""
              ) {
                setError("Please enter a valid description");
                return;
              }

              if (amountRef.current && Number.isNaN(amountRef.current.value)) {
                setError("Please enter a valid name");
                return;
              }
              setError(null);
              // onAdd({ remarks: descriptionRef.current?.value, method: method });
              if (props.noCreateInDB) {
                props.onAdd({
                  remarks: descriptionRef.current?.value || "",
                  method: method.id,
                  account:
                    typeof method.account === "number"
                      ? method.account
                      : method.account.id,
                  labels: labels.map((lbl) => lbl.id),
                  amount: Number(amountRef.current?.value),
                  date: dateToIsoString(date),
                });
              } else {
                createTrxn({
                  remarks: descriptionRef.current?.value || "",
                  method: method.id,
                  account:
                    typeof method.account === "number"
                      ? method.account
                      : method.account.id,
                  labels: labels.map((lbl) => lbl.id),
                  amount: Number(amountRef.current?.value),
                  date: dateToIsoString(date),
                });
              }
            }}
          >
            Save
          </MD3Button>
        </div>
      </Card>
    </Modal>
  );
}
