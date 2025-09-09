import {
  Alert,
  Autocomplete,
  Card,
  Divider,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { createRef, useState } from "react";
import { editSupplier } from "src/api/suppliers";
import MD3Button from "src/components/md3-button";
import { useAppSelector } from "src/redux/hooks";
import { SupplierType } from "src/types/suppliers";
import states from "src/utils/state-codes";
import useApi from "src/utils/use-api";

export default function EditSupplierModal(props: {
  open: boolean;
  initialValue: SupplierType;
  onAdd: (brand: SupplierType) => any;
  handleClose: (_?: any) => any;
}) {
  const [error, setError] = useState<null | string>(null);
  const nameRef = createRef<HTMLInputElement>();
  const numberRef = createRef<HTMLInputElement>();
  const addressRef = createRef<HTMLInputElement>();
  const gstinRef = createRef<HTMLInputElement>();
  const [currentUserState, setCurrentUserState] = useState(
    props.initialValue.state
  );
  const tokens = useAppSelector((state) => state.auth.tokens);
  const call = useApi();
  const { id } = props.initialValue;

  const handleSupplierUpdate = (supplier: Partial<SupplierType>) => {
    if (tokens) {
      call(editSupplier(tokens.access, supplier, id)).then((res) => {
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
          defaultValue={props.initialValue.name}
          inputRef={nameRef}
        />
        <TextField
          variant="outlined"
          placeholder=""
          label="Number"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          required
          defaultValue={props.initialValue.number}
          inputRef={numberRef}
        />
        <TextField
          variant="outlined"
          placeholder=""
          label="Address"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          defaultValue={props.initialValue.address}
          inputRef={addressRef}
        />
        <TextField
          variant="outlined"
          placeholder=""
          label="GSTIN"
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          defaultValue={props.initialValue.gstin}
          inputRef={gstinRef}
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
                handleSupplierUpdate({
                  name: nameRef.current?.value,
                  number: numberRef.current?.value,
                  address: addressRef.current?.value || "",
                  gstin: gstinRef.current?.value || "",
                  state: currentUserState,
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
