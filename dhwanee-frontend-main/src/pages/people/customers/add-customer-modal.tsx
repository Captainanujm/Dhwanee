import {
  Alert,
  Card,
  Divider,
  Modal,
  TextField,
  Autocomplete,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { createRef, useEffect, useState } from "react";
import MD3Button from "src/components/md3-button";
import { createCustomer, editCustomer } from "src/api/customers";
import { showSnackbar } from "src/components/snackbar/reducer";
import { useAppSelector, useAppDispatch } from "src/redux/hooks";
import { CustomerType, CustomerTypeAtCreation } from "src/types/customer";
import states from "src/utils/state-codes";
import useApi from "src/utils/use-api";

export default function AddCustomerModal(props: {
  open: boolean;
  onAdd: (brand: CustomerType) => any;
  handleClose: (_?: any) => any;
  initialData?: CustomerType;
}) {
  const [error, setError] = useState<null | string>(null);
  const nameRef = createRef<HTMLInputElement>();
  const numberRef = createRef<HTMLInputElement>();
  const addressRef = createRef<HTMLInputElement>();
  const shippingAddressRef = createRef<HTMLInputElement>();
  const gstinRef = createRef<HTMLInputElement>();
  const balanceRef = createRef<HTMLInputElement>();
  const markdownRef = createRef<HTMLInputElement>();
  const [currentUserState, setCurrentUserState] =
    useState("UTTAR PRADESH - 09");

  const authBody = useAppSelector((state) => state.auth.body);
  const [customerBranch, setCustomerBranch] = useState<number>(0);

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();
  const call = useApi();

  const handleCustomerCreate = (customer: CustomerTypeAtCreation) => {
    if (tokens) {
      call(createCustomer(tokens.access, customer)).then((res) => {
        props.onAdd(res);
      });
    }
  };

  const handleCustomerEdit = (id:number|string,customer: Partial<CustomerType>) => {
    if (tokens) {
      call(editCustomer(tokens.access, id, customer)).then((res) => {
        props.onAdd(res);
      });
    }
  };

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

  useEffect(() => {
    if (props.initialData) {
      setCustomerBranch(
        typeof props.initialData.branch === "number"
          ? props.initialData.branch
          : Number(props.initialData.branch.id)
      );
      setCurrentUserState(props.initialData.state);
    }
  }, [props.initialData]);

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
          {props.initialData ? "Edit" : "Add"} Customer
        </Typography>
        <Divider variant="middle" sx={{ my: 2, width: "70%" }} />
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          variant="outlined"
          placeholder=""
          label="Name"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          defaultValue={props.initialData ? props.initialData.name : undefined}
          required
          inputRef={nameRef}
        />
        <TextField
          variant="outlined"
          placeholder=""
          label="Number"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          defaultValue={
            props.initialData ? props.initialData.number : undefined
          }
          required
          inputRef={numberRef}
        />
        <TextField
          variant="outlined"
          placeholder=""
          label="Address"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          defaultValue={
            props.initialData ? props.initialData.address : undefined
          }
          inputRef={addressRef}
        />
        <TextField
          variant="outlined"
          placeholder=""
          label="Shipping Address"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          defaultValue={
            props.initialData ? props.initialData.shipping_address : undefined
          }
          inputRef={shippingAddressRef}
        />
        <TextField
          variant="outlined"
          placeholder=""
          label="GSTIN"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          defaultValue={props.initialData ? props.initialData.gstin : undefined}
          inputRef={gstinRef}
        />
        {props.initialData === null && (
          <TextField
            variant="outlined"
            placeholder=""
            label="Opening Balance"
            sx={{ my: 1, width: "80%", minWidth: "320px" }}
            inputRef={balanceRef}
          />
        )}
        <TextField
          variant="outlined"
          placeholder=""
          label="Markdown"
          type="number"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          defaultValue={
            props.initialData ? props.initialData.markdown : undefined
          }
          inputRef={markdownRef}
        />
        <Autocomplete
          freeSolo
          id="free-solo-2-demo"
          disableClearable
          options={states}
          value={currentUserState}
          sx={{ width: "80%", minWidth: "320px", my: 1 }}
          onChange={(_, val) => {
            setCurrentUserState(val);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="State"
              required
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                type: "search",
              }}
              onChange={(evt) => {
                setCurrentUserState(evt.target.value);
              }}
            />
          )}
        />

        <FormControl sx={{ width: "80%", my: 1, minWidth: "320px" }} disabled={props.initialData !== null}>
          <InputLabel id="customer-item-rows-select-label">
            Customer associated to which branch
          </InputLabel>
          <Select
            labelId="customer-item-rows-select-label"
            id="customer-item-rows-select"
            value={customerBranch}
            label="Customer associated to which branch"
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
                nameRef.current &&
                nameRef.current.value !== "" &&
                numberRef.current &&
                numberRef.current.value !== ""
              ) {
                setError(null);
                if (props.initialData) {
                  handleCustomerEdit(props.initialData.id, {
                    name: nameRef.current?.value,
                    number: numberRef.current?.value,
                    address: addressRef.current?.value || "",
                    shipping_address: shippingAddressRef.current?.value || "",
                    gstin: gstinRef.current?.value || "",
                    state: currentUserState,
                    branch: customerBranch,
                    markdown: Number(markdownRef.current?.value) || 0,
                  });
                } else {
                  handleCustomerCreate({
                    name: nameRef.current?.value,
                    number: numberRef.current?.value,
                    address: addressRef.current?.value || "",
                    shipping_address: shippingAddressRef.current?.value || "",
                    gstin: gstinRef.current?.value || "",
                    balance: Number(balanceRef.current?.value) || 0,
                    state: currentUserState,
                    branch: customerBranch,
                    markdown: Number(markdownRef.current?.value) || 0,
                  });
                }
              } else setError("Please enter a valid name and number");
            }}
          >
            Save
          </MD3Button>
        </div>
      </Card>
    </Modal>
  );
}
