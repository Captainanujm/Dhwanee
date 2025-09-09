import { Autocomplete, Typography, TextField, CircularProgress } from "@mui/material";
import { searchAccounts } from "src/api/accounting";
import { useState, useEffect } from "react";
// import { any } from "src/types/accounts";

export default 
function AccountsAutoComplete(props: {
  accounts: any | undefined;
  setAccounts: React.Dispatch<React.SetStateAction<any | undefined>>;
  token: string | null;
}) {
  const { token, setAccounts, accounts } = props;
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [accountsSearchTerm, setAccountsSearchTerm] = useState<string>(
    props.accounts ? props.accounts.name : ""
  );
  const [accountsError, setAccountsError] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setLoading(true);
      searchAccounts(token, accountsSearchTerm, 1, 10).then((results) => {
        setLoading(false);
        setSearchResults(results.results);
      });
    }
  }, [accountsSearchTerm, token, setAccounts]);

  return (
    <Autocomplete
      freeSolo
      disableClearable
      sx={{ minWidth: "320px", width: "80%", my: 1 }}
      options={searchResults}
      key={props.accounts ? props.accounts.id : null}
      getOptionLabel={(option) => {
        if (typeof option === "string") {
          setAccountsSearchTerm(option);
          return option;
        }
        return option.name;
      }}
      value={accounts}
      onChange={(_, val) => {
        if (typeof val !== "string") {
          setAccounts(val);
          setAccountsError(false);
        } else {
          setAccountsError(true);
        }
      }}
      renderOption={(props, option) => (
        <li {...props}>
              <Typography variant="body1" color="text.primary">
                {option.name}
              </Typography>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Account"
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
          error={accountsError}
          sx={{ minWidth: "320px" }}
          helperText={accountsError ? "Please select a valid account" : ""}
          value={accountsSearchTerm}
          onChange={(evt) => {
            setAccountsSearchTerm(evt.target.value);
            var found = false;
            for (var i = 0; i < searchResults.length; i++) {
              if (searchResults[i].name === evt.target.value) {
                found = true;
                break;
              }
            }
            setAccountsError(!found);
          }}
        />
      )}
    />
  );
}