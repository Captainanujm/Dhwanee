import { Box, Grid, TextField, Typography } from "@mui/material";
import { createRef, useCallback } from "react";
import { login } from "src/api/auth";
import LoginBG from "./bg.jpeg";
import { login as loginReducer } from "src/redux/auth-reducer";
import { useAppDispatch } from "src/redux/hooks";
import MD3Button from "src/components/md3-button";
import { showSnackbar } from "src/components/snackbar/reducer";
import useApi from "src/utils/use-api";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const call = useApi();

  const usernameRef = createRef<HTMLInputElement>();
  const passwordRef = createRef<HTMLInputElement>();

  const onLoginCallback = useCallback(() => {
    if (usernameRef.current && passwordRef.current) {
      if (usernameRef.current.value === "") {
        dispatch(
          showSnackbar({ text: "please enter username", severity: "warning" })
        );
        return;
      }
      if (passwordRef.current.value === "") {
        dispatch(
          showSnackbar({ text: "please enter password", severity: "warning" })
        );
        return;
      }
      call(
        login(usernameRef.current.value, passwordRef.current.value),
        "Logging in",
        true
      )
        .then((r) => {
          dispatch(loginReducer(r));
          dispatch(
            showSnackbar({ text: "Login succesful", severity: "success" })
          );
        })
        .catch((err) => {
          dispatch(showSnackbar({ text: "Login failed", severity: "error" }));
        });
    }
  }, [dispatch, usernameRef, passwordRef, call]);

  return (
    <Grid
      container
      spacing={0}
      sx={{
        height: "100vh",
      }}
    >
      <Grid
        item
        md={5}
        xs={12}
        sx={{
          backgroundImage: `url(${LoginBG})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          minHeight: "400px",
          backgroundPosition: "center",
        }}
      />

      <Grid
        item
        md={7}
        xs={12}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <Typography variant="h1" color="primary" mb={8}>
          Login
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
          onKeyUp={(evt) => {
            if (evt.key === "Enter") {
              onLoginCallback();
            }
          }}
        >
          <TextField
            variant="filled"
            label="Username"
            sx={{ my: 2, minWidth: "350px" }}
            inputRef={usernameRef}
          />
          <TextField
            variant="filled"
            label="Password"
            type="password"
            sx={{ my: 2, minWidth: "350px" }}
            inputRef={passwordRef}
          />
          <MD3Button
            variant="filled"
            sx={{ my: 1, minWidth: "300px" }}
            onClick={onLoginCallback}
          >
            Login
          </MD3Button>
          <MD3Button variant="text" sx={{ my: 1, minWidth: "300px" }}>
            Forgot Password?
          </MD3Button>
        </Box>
      </Grid>
    </Grid>
  );
}
