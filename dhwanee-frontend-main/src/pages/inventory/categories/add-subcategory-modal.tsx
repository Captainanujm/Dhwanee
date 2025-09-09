import {
  Card,
  Divider,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { createRef, useState } from "react";
import MD3Button from "src/components/md3-button";

export default function AddSubCategoryModal(props: {
  open: boolean;
  onAdd: (category: {name: string}) => any;
  handleClose: (_?: any) => any;
}) {
  const [error, setError] = useState<null | string>(null);
  const nameRef = createRef<HTMLInputElement>();

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
          Add Sub Category
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
                props.onAdd({ name: nameRef.current?.value });
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
