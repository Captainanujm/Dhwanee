import { Autocomplete, Stack, Typography, TextField, CircularProgress } from "@mui/material";
import { searchSuppliers } from "src/api/suppliers";
import StringAvatar from "src/components/string-avatar";
import { useState, useEffect } from "react";
import { SupplierType } from "src/types/suppliers";

export default 
function SupplierAutoComplete(props: {
  supplier: SupplierType | undefined;
  setSupplier: React.Dispatch<React.SetStateAction<SupplierType | undefined>>;
  token: string | null;
  disabled?:boolean;
}) {
  const { token, setSupplier, supplier } = props;
  const [searchResults, setSearchResults] = useState<SupplierType[]>([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState<string>(
    props.supplier ? props.supplier.name : ""
  );
  const [supplierError, setSupplierError] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setLoading(true);
      searchSuppliers(token, supplierSearchTerm, 1, 10).then((results) => {
        setLoading(false);
        setSearchResults(results.results);
      });
    }
  }, [supplierSearchTerm, token, setSupplier]);

  return (
    <Autocomplete
      freeSolo
      disabled={props.disabled}
      disableClearable
      sx={{ minWidth: "320px", mt: 1 }}
      options={searchResults}
      key={props.supplier ? props.supplier.id : null}
      getOptionLabel={(option) => {
        if (typeof option === "string") {
          setSupplierSearchTerm(option);
          return option;
        }
        return option.name;
      }}
      value={supplier}
      onChange={(_, val) => {
        if (typeof val !== "string") {
          setSupplier(val);
          setSupplierError(false);
        } else {
          setSupplierError(true);
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
          label="Supplier"
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
          error={supplierError}
          sx={{ minWidth: "320px" }}
          helperText={supplierError ? "Please select a valid supplier" : ""}
          value={supplierSearchTerm}
          onChange={(evt) => {
            setSupplierSearchTerm(evt.target.value);
            var found = false;
            for (var i = 0; i < searchResults.length; i++) {
              if (searchResults[i].name === evt.target.value) {
                found = true;
                break;
              }
            }
            setSupplierError(!found);
          }}
        />
      )}
    />
  );
}