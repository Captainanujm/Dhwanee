import {
  Card,
  Divider,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
  FormControl,
} from "@mui/material";
import { createRef, useEffect, useState } from "react";
import { createAccount } from "src/api/accounting";
import MD3Button from "src/components/md3-button";
import { showSnackbar } from "src/components/snackbar/reducer";
import { useAppSelector, useAppDispatch } from "src/redux/hooks";
import { AccountTypeAtCreation } from "src/types/accounting";
import useApi from "src/utils/use-api";

export default function AddAccountModal(props: {
  open: boolean;
  onAdd: (account: AccountTypeAtCreation) => any;
  handleClose: (_?: any) => any;
}) {
  const [error, setError] = useState<null | string>(null);
  const nameRef = createRef<HTMLInputElement>();
  const balanceRef = createRef<HTMLInputElement>();

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

  const handleAccountCreate = (account: AccountTypeAtCreation) => {
    if (tokens) {
      call(createAccount(tokens.access, account))
        .then((res) => {
          props.onAdd(res);
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
          Add Account
        </Typography>
        {error && (
          <Typography color="error" fontSize="small">
            {error}
          </Typography>
        )}
        <Divider variant="middle" sx={{ my: 2, width: "70%" }} />
        <TextField
          variant="outlined"
          label="Account Name"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          required
          inputRef={nameRef}
        />
        <TextField
          variant="outlined"
          label="Opening Balance"
          type="number"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          required
          inputRef={balanceRef}
        />

        <FormControl sx={{ width: "80%", my: 1, minWidth: "320px" }}>
          <InputLabel id="account-item-rows-select-label">
            Account associated to which branch
          </InputLabel>
          <Select
            labelId="account-item-rows-select-label"
            id="account-item-rows-select"
            value={customerBranch}
            label="Account associated to which branch"
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
              if (
                balanceRef.current &&
                Number.isNaN(balanceRef.current.value)
              ) {
                setError("Please enter a valid number");
              }
              if (nameRef.current && nameRef.current.value !== "") {
                setError(null);
                handleAccountCreate({
                  name: nameRef.current?.value,
                  balance: Number(balanceRef.current?.value),
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
