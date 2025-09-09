import { showSnackbar } from "src/components/snackbar/reducer";
import { refresh } from "src/api/auth";
import { useAppSelector, useAppDispatch } from "src/redux/hooks";
import verifyJwt from "src/utils/verify-jwt";
import { login as loginReducer } from "src/redux/auth-reducer";
import useApi from "src/utils/use-api";
import { useNavigate } from "react-router-dom";

export default function useEnsureAuth() {
  const auth = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const call = useApi();
  return () => {
    if (auth.tokens) {
      switch (verifyJwt(auth.tokens)) {
        case 0:
          navigate("/login");
          break;
        case -1:
          call(refresh(auth.tokens.refresh), "Refreshing your session", true)
            .then((r) => {
              dispatch(loginReducer(r));
            })
            .catch((err) => {
              dispatch(
                showSnackbar({
                  text: "Failed to reload your session. Please login again.",
                  severity: "error",
                })
              );
              navigate("/login");
            });
          break;
        case 1:
          break;
      }
    } else {
      navigate("/login");
    }
  };
}
