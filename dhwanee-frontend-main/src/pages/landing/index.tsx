import { Container, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useAppSelector } from "src/redux/hooks";
import useEnsureAuth from "src/utils/ensure-login";
import LastNDaysReport from "./last-n-days-report";

export default function LandingPage() {
  const ensureAuth = useEnsureAuth();
  useEffect(ensureAuth, [ensureAuth]);

  const auth = useAppSelector((state) => state.auth);
  const [branch, setBranch] = useState(0);


  return (
    <Container sx={{px: 0, mx: 0}}>
      <Typography variant="h5">Welcome,</Typography>
      <Typography variant="h1" color="primary">{auth.body?.user_name}</Typography>
      <LastNDaysReport branch={branch} setBranch={setBranch} />
    </Container>
  );
}
