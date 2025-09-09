import { Card, Divider, FormControl, InputLabel, MenuItem, Modal, Select, TextField, Typography } from "@mui/material";
import { createRef, useEffect, useState } from "react";
import MD3Button from "src/components/md3-button";
import { AccountType, PaymentMethodTypeAtCreation } from "src/types/accounting";
import AccountsAutoComplete from "src/components/autocompletes/accounts-autocomplete";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { createPaymentMethod } from "src/api/accounting";
import { showSnackbar } from "src/components/snackbar/reducer";
import useApi from "src/utils/use-api";

export default function AddPaymentMethodModal(props: {
  open: boolean;
  onAdd: (paymentmethod: PaymentMethodTypeAtCreation) => any;
  handleClose: (_?: any) => any;
}) {
  const [error, setError] = useState<null | string>(null);
  const [account, setAccount] = useState<AccountType>();
  const nameRef = createRef<HTMLInputElement>();

  const authBody = useAppSelector((state) => state.auth.body);
  const [customerBranch, setCustomerBranch] = useState<number>(0);

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();
  const call = useApi();

  useEffect(() => {
    if (authBody) {
      if (authBody.branch.length === 1) {
        setCustomerBranch(authBody.branch[0].id);
      }
    } else {
      dispatch(
        showSnackbar({
          text: "Could not load user branch data. Are you logged in?",
          severity: "error",
        })
      );
    }
  }, [authBody, dispatch]);


  const handlePaymentMethodCreate = (paymentmethod: PaymentMethodTypeAtCreation) => {
    if (tokens) {
      call(createPaymentMethod(tokens.access, paymentmethod))
        .then((res) => {
          props.onAdd(res)
        })
    }
  };


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
          Add Payment Method
        </Typography>
        {error && (
          <Typography color="error" fontSize="small">
            {error}
          </Typography>
        )}
        <Divider variant="middle" sx={{ my: 2, width: "70%" }} />
        <TextField
          variant="outlined"
          label="Payment Method Name"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          required
          inputRef={nameRef}
        />
        <AccountsAutoComplete
          accounts={account}
          token={tokens ? tokens.access : null}
          setAccounts={setAccount}
        />

        <FormControl sx={{ width: "80%", my: 1, minWidth: "320px" }}>
          <InputLabel id="account-item-rows-select-label">
            Payment Method associated to which branch
          </InputLabel>
          <Select
            labelId="account-item-rows-select-label"
            id="account-item-rows-select"
            value={customerBranch}
            label="Payment Method associated to which branch"
            onChange={(ev) => setCustomerBranch(Number(ev.target.value))}
          >
            {(authBody ? authBody.branch : []).map((e) => (
              <MenuItem value={e.id} key={e.id}>
                {e.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
              if (account === undefined) {
                setError("Please select a valid account");
                return;
              }
              if (nameRef.current && nameRef.current.value !== "") {
                setError(null);
                handlePaymentMethodCreate({
                  name: nameRef.current?.value,
                  account: account.id,
                  branch: customerBranch,
                });
              } else setError("Please enter a valid name");
            }}
          >
            Save
          </MD3Button>
        </div>
      </Card>
    </Modal>
  );
}
