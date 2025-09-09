import {
  Backdrop,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { useAppSelector } from "src/redux/hooks";
import { md3Theme } from "src/theme";
import { CssVarsProvider } from "@mui/material-next";
import LinearProgress from "@mui/material-next/LinearProgress";

export default function Loader() {
  const state = useAppSelector((state) => state.loader);
  return (
    <div>
      <Backdrop open={state.queue.length > 0} sx={{ zIndex: 10000 }}>
        <Card>
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pb: "16px !important",
            }}
          >
          <Typography variant="h5">{state.queue[0]}</Typography>
            <CssVarsProvider theme={md3Theme}>
              <LinearProgress sx={{width: "60%", minWidth: "240px", mx: 4, my: 2}} fourColor variant="indeterminate" />
            </CssVarsProvider>
          </CardContent>
        </Card>
      </Backdrop>
    </div>
  );
}
