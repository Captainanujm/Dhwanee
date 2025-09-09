import { Autocomplete, Stack, Typography, TextField, CircularProgress } from "@mui/material";
import { searchBills } from "src/api/billing";
import { format } from "date-fns";
import { useState, useEffect } from "react";
// import { any } from "src/types/bill";

export default 
function BillAutoComplete(props: {
  bill: any | undefined;
  setBill: React.Dispatch<React.SetStateAction<any | undefined>>;
  token: string | null;
}) {
  const { token, setBill, bill } = props;
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [billSearchTerm, setBillSearchTerm] = useState<string>(
    props.bill ? props.bill.name : ""
  );
  const [billError, setBillError] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setLoading(true);
      searchBills(token, billSearchTerm, 1, 10).then((results) => {
        setLoading(false);
        setSearchResults(results.results);
      });
    }
  }, [billSearchTerm, token, setBill]);

  return (
    <Autocomplete
      freeSolo
      disableClearable
      sx={{ minWidth: "320px", maxWidth: '400px', mt: 1 }}
      options={searchResults}
      key={props.bill ? props.bill.id : null}
      getOptionLabel={(option) => {
        if (typeof option === "string") {
          setBillSearchTerm(option);
          return option;
        }
        return option.number;
      }}
      value={bill}
      onChange={(_, val) => {
        if (typeof val !== "string") {
          setBill(val);
          setBillError(false);
        } else {
          setBillError(true);
        }
      }}
      renderOption={(props, option) => (
        <li {...props}>
            <Stack>
              <Typography variant="body1" color="text.primary">
                {option.number}
              </Typography>
              <Typography
                variant="body2"
                fontSize="small"
                color="text.secondary"
              >
                {format(new Date(option.date), "dd MMM yyyy HH:mm")}
              </Typography>
            </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Bill"
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
          error={billError}
          sx={{ minWidth: "320px" }}
          helperText={billError ? "Please select a valid bill" : ""}
          value={billSearchTerm}
          onChange={(evt) => {
            setBillSearchTerm(evt.target.value);
            var found = false;
            for (var i = 0; i < searchResults.length; i++) {
              if (searchResults[i].name === evt.target.value) {
                found = true;
                break;
              }
            }
            setBillError(!found);
          }}
        />
      )}
    />
  );
}