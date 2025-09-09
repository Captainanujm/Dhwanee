import { useMemo } from "react";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";
import { useAppDispatch } from "src/redux/hooks";

/**
 * Function to attach general loader and failure snackbar to network requests
 */
export default function useApi() {
  const dispatch = useAppDispatch();
  const returnFn = useMemo(() => {
    return <T>(
      fn: Promise<T>,
      loadingText?: string,
      disableCaptureError?: boolean
    ): Promise<T> =>
      new Promise((resolve, reject) => {
        dispatch(showLoader(loadingText));
        fn.then(resolve)
          .catch((e) => {
            if (!disableCaptureError) {
              if (typeof e === "object" && typeof e.response === "object") {
                if (e.response.length > 0) {
                  dispatch(
                    showSnackbar({
                      text: "Error: " + e.response[0],
                      severity: "error",
                    })
                  );
                } else if (
                  Object.values(e.response).length > 0 &&
                  Object.values<any>(e.response)[0].length > 0
                ) {
                  dispatch(
                    showSnackbar({
                      text: "Error: " + Object.keys(e.response)[0] + ": " + Object.values<any>(e.response)[0],
                      severity: "error",
                    })
                  );
                } else {
                  dispatch(
                    showSnackbar({
                      text: "Failed to perform the given request",
                      severity: "error",
                    })
                  );
                }
              } else {
                dispatch(
                  showSnackbar({
                    text: "Failed to perform the given request",
                    severity: "error",
                  })
                );
              }
            } else {
              reject(e);
            }
          })
          .finally(() => dispatch(hideLoader()));
      });
  }, [dispatch]);
  return returnFn;
}
