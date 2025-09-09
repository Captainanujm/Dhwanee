import { md3Theme } from "src/theme";
import { CssVarsProvider, Button, ButtonProps } from "@mui/material-next";

export default function MD3Button(props: ButtonProps) {
  return (
    <CssVarsProvider theme={md3Theme}>
      <Button {...props}></Button>
    </CssVarsProvider>
  );
}
