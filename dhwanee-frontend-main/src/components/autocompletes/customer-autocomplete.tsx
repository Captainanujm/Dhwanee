import { Autocomplete, Stack, Typography, TextField, CircularProgress } from "@mui/material";
import { searchCustomers } from "src/api/customers";
import StringAvatar from "src/components/string-avatar";
import { useState, useEffect } from "react";
import { CustomerType } from "src/types/customer";

export default 
function CustomerAutoComplete(props: {
  customer: CustomerType | undefined;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerType | undefined>>;
  token: string | null;
}) {
  const { token, setCustomer, customer } = props;
  const [searchResults, setSearchResults] = useState<CustomerType[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>(
    props.customer ? props.customer.name : ""
  );
  const [customerError, setCustomerError] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setLoading(true);
      searchCustomers(token, customerSearchTerm, 1, 10).then((results) => {
        setLoading(false);
        setSearchResults(results.results);
      });
    }
  }, [customerSearchTerm, token, setCustomer]);

  return (
    <Autocomplete
      freeSolo
      disableClearable
      sx={{ minWidth: "320px", mt: 1 }}
      options={searchResults}
      key={props.customer ? props.customer.id : null}
      getOptionLabel={(option) => {
        if (typeof option === "string") {
          setCustomerSearchTerm(option);
          return option;
        }
        return option.name;
      }}
      value={customer}
      onChange={(_, val) => {
        if (typeof val !== "string") {
          setCustomer(val);
          setCustomerError(false);
        } else {
          setCustomerError(true);
        }
      }}
      renderOption={(props, option) => (
        <li {...props}>
          <Stack gap={2} direction="row">
            <StringAvatar>{option.name}</StringAvatar>
            <Stack>
              <Typography variant="body1" color="text.primary">
                {option.name}
              </Typography>
              <Typography
                variant="body2"
                fontSize="small"
                color="text.secondary"
              >
                {option.number}
              </Typography>
            </Stack>
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Customer"
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
          error={customerError}
          sx={{ minWidth: "320px" }}
          helperText={customerError ? "Please select a valid customer" : ""}
          value={customerSearchTerm}
          onChange={(evt) => {
            setCustomerSearchTerm(evt.target.value);
            var found = false;
            for (var i = 0; i < searchResults.length; i++) {
              if (searchResults[i].name === evt.target.value) {
                found = true;
                break;
              }
            }
            setCustomerError(!found);
          }}
        />
      )}
    />
  );
}