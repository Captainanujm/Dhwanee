import {
  Alert,
  Autocomplete,
  Card,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { createRef, useEffect, useState } from "react";
import { createSupplier } from "src/api/suppliers";
import MD3Button from "src/components/md3-button";
import { showSnackbar } from "src/components/snackbar/reducer";
import { useAppSelector, useAppDispatch } from "src/redux/hooks";
import { SupplierType, SupplierTypeAtCreation } from "src/types/suppliers";
import states from "src/utils/state-codes";
import useApi from "src/utils/use-api";

export default function AddSupplierModal(props: {
  open: boolean;
  onAdd: (brand: SupplierType) => any;
  handleClose: (_?: any) => any;
}) {
  const [error, setError] = useState<null | string>(null);
  const nameRef = createRef<HTMLInputElement>();
  const numberRef = createRef<HTMLInputElement>();
  const addressRef = createRef<HTMLInputElement>();
  const gstinRef = createRef<HTMLInputElement>();
  const balanceRef = createRef<HTMLInputElement>();
  const [currentUserState, setCurrentUserState] =
    useState("UTTAR PRADESH - 09");
  const authBody = useAppSelector((state) => state.auth.body);
  const [supplierBranch, setSupplierBranch] = useState<number>(0);

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();
  const call = useApi();

  useEffect(() => {
    if (authBody) {
      if (authBody.branch.length === 1) {
        setSupplierBranch(authBody.branch[0].id);
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

  const handleSupplierCreate = (supplier: SupplierTypeAtCreation) => {
    if (tokens) {
      call(createSupplier(tokens.access, supplier)).then((res) => {
        props.onAdd(res);
      });
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
          Add Supplier
        </Typography>
        <Divider variant="middle" sx={{ my: 2, width: "70%" }} />
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          variant="outlined"
          placeholder=""
          label="Name"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          required
          inputRef={nameRef}
        />
        <TextField
          variant="outlined"
          placeholder=""
          label="Number"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          required
          inputRef={numberRef}
        />
        <TextField
          variant="outlined"
          placeholder=""
          label="Address"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          inputRef={addressRef}
        />
        <TextField
          variant="outlined"
          placeholder=""
          label="GSTIN"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          inputRef={gstinRef}
        />
        <TextField
          variant="outlined"
          placeholder=""
          label="Opening Balance"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          inputRef={balanceRef}
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

        <FormControl sx={{ width: "80%", my: 1, minWidth: "320px" }}>
          <InputLabel id="product-item-rows-select-label">
            Supplier associated to which branch
          </InputLabel>
          <Select
            labelId="product-item-rows-select-label"
            id="product-item-rows-select"
            value={supplierBranch}
            label="Supplier associated to which branch"
            onChange={(ev) => setSupplierBranch(Number(ev.target.value))}
          >
            {(authBody ? authBody.branch : []).map((e) => (
              <MenuItem value={e.id} key={e.id}>{e.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Divider variant="middle" sx={{ my: 1, width: "70%" }} />
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <MD3Button
            sx={{ float: "left", width: "45%" }}
            variant="filledTonal"
            onClick={() => {
              setError(null);
              props.handleClose();
            }}
          >
            Cancel
          </MD3Button>
          <MD3Button
            variant="filled"
            sx={{ width: "45%" }}
            onClick={() => {
              if (
                nameRef.current &&
                nameRef.current.value !== "" &&
                numberRef.current &&
                numberRef.current.value !== ""
              ) {
                setError(null);
                handleSupplierCreate({
                  name: nameRef.current?.value,
                  number: numberRef.current?.value,
                  address: addressRef.current?.value || "",
                  gstin: gstinRef.current?.value || "",
                  balance: Number(balanceRef.current?.value) || 0,
                  state: currentUserState,
                  branch: supplierBranch,
                });
              } else setError("Please enter a valid value in required fields");
            }}
          >
            Save
          </MD3Button>
        </div>
      </Card>
    </Modal>
  );
}
