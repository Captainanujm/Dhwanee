import { Alert, Button, IconButton, Snackbar } from "@mui/material";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { Close as CloseIcon } from "@mui/icons-material";
import { hideSnackbar } from "./reducer";

export default function GlobalSnackBar() {
  const state = useAppSelector((state) => state.snackbar);
  const dispatch = useAppDispatch();
  const handleClose = () => {
    dispatch(hideSnackbar());
    if (state.onCloseCallback) {
      state.onCloseCallback();
    }
  };
  if (state.severity) {
    return (
      <Snackbar
        open={state.open}
        autoHideDuration={state.autoCloseTimout || 3000}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity={state.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {state.text}
        </Alert>
      </Snackbar>
    );
  }
  return (
    <Snackbar
      open={state.open}
      autoHideDuration={state.autoCloseTimout || 3000}
      onClose={handleClose}
      message={state.text}
      action={
        <>
          {state.actionButtonText && (
            <Button
              color="secondary"
              size="small"
              onClick={() => {
                state.action && state.action();
                handleClose();
              }}
            >
              {state.actionButtonText}
            </Button>
          )}
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </>
      }
    />
  );
}
