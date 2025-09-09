import {
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
import MD3Button from "src/components/md3-button";
import { showSnackbar } from "src/components/snackbar/reducer";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { CategoryTypeAtCreation } from "src/types/inventory";

export default function AddCategoryModal(props: {
  open: boolean;
  onAdd: (category: CategoryTypeAtCreation) => any;
  handleClose: (_?: any) => any;
}) {
  const [error, setError] = useState<null | string>(null);
  const nameRef = createRef<HTMLInputElement>();
  const authBody = useAppSelector((state) => state.auth.body);
  const [categoryBranch, setCategoryBranch] = useState<number>(0);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (authBody) {
      if (authBody.branch.length === 1) {
        setCategoryBranch(authBody.branch[0].id);
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
          Add Category
        </Typography>
        <Divider variant="middle" sx={{ my: 2, width: "70%" }} />
        <TextField
          variant="outlined"
          placeholder=""
          label="Name"
          error={error !== null}
          helperText={error || ""}
          sx={{ my: 1, width: "80%", minWidth: "320px" }}
          required
          inputRef={nameRef}
        />

        <FormControl sx={{ width: "80%", my: 1, minWidth: "320px" }}>
          <InputLabel id="product-item-rows-select-label">
            Category associated to which branch
          </InputLabel>
          <Select
            labelId="product-item-rows-select-label"
            id="product-item-rows-select"
            value={categoryBranch}
            label="Category associated to which branch"
            onChange={(ev) => setCategoryBranch(Number(ev.target.value))}
          >
            {(authBody ? authBody.branch : []).map((e) => (
              <MenuItem value={e.id} key={e.id}>
                {e.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Divider variant="middle" sx={{ my: 1, width: "70%" }} />
        <div style={{ width: "100%", display: "flex",justifyContent: "space-between",gap: 4 }}>
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
              if (nameRef.current && nameRef.current.value !== "") {
                setError(null);
                props.onAdd({ name: nameRef.current?.value, branch: categoryBranch });
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
