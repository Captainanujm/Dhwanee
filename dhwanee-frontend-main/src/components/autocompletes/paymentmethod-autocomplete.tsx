import {
  Autocomplete,
  Typography,
  TextField,
  CircularProgress,
  Stack,
} from "@mui/material";
import { searchPaymentMethods } from "src/api/accounting";
import { useState, useEffect } from "react";
import { PaymentMethodType } from "src/types/accounting";
// import { any } from "src/types/accounts";

export default function PaymentMethodsAutoComplete(props: {
  paymentmethods: PaymentMethodType | undefined;
  setPaymentMethods: React.Dispatch<
    React.SetStateAction<PaymentMethodType | undefined>
  >;
  token: string | null;
}) {
  const { token, setPaymentMethods, paymentmethods } = props;
  const [searchResults, setSearchResults] = useState<PaymentMethodType[]>([]);
  const [paymentmethodsSearchTerm, setPaymentMethodsSearchTerm] =
    useState<string>(props.paymentmethods ? props.paymentmethods.name : "");
  const [paymentmethodsError, setPaymentMethodsError] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setLoading(true);
      searchPaymentMethods(token, paymentmethodsSearchTerm, 1, 10).then(
        (results) => {
          setLoading(false);
          setSearchResults(results.results);
        }
      );
    }
  }, [paymentmethodsSearchTerm, token, setPaymentMethods]);

  return (
    <Autocomplete
      freeSolo
      disableClearable
      sx={{ my: 1, width: "80%", minWidth: "320px" }}
      options={searchResults}
      key={props.paymentmethods ? props.paymentmethods.id : null}
      getOptionLabel={(option) => {
        if (typeof option === "string") {
          setPaymentMethodsSearchTerm(option);
          return option;
        }
        return option.name;
      }}
      value={paymentmethods}
      onChange={(_, val) => {
        if (typeof val !== "string") {
          setPaymentMethods(val);
          setPaymentMethodsError(false);
        } else {
          setPaymentMethodsError(true);
        }
      }}
      renderOption={(props, option) => (
        <li {...props}>
          <Stack>
            <Typography variant="body1" color="text.primary">
              {option.name}
            </Typography>

            <Typography variant="caption" color="gray">
              {typeof option.branch === "number"
                ? option.branch
                : option.branch.name}{" "}
              branch
            </Typography>
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Method"
          required
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            type: "search",
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          error={paymentmethodsError}
          sx={{ minWidth: "320px" }}
          helperText={
            paymentmethodsError ? "Please select a valid paymentmethod" : ""
          }
          value={paymentmethodsSearchTerm}
          onChange={(evt) => {
            setPaymentMethodsSearchTerm(evt.target.value);
            var found = false;
            for (var i = 0; i < searchResults.length; i++) {
              if (searchResults[i].name === evt.target.value) {
                found = true;
                break;
              }
            }
            setPaymentMethodsError(!found);
          }}
        />
      )}
    />
  );
}
