import {
  Autocomplete,
  TextField,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { searchProductByUUID } from "src/api/inventory";
import { useState, useEffect, useRef } from "react";
import { ProductItemType, ProductType } from "src/types/inventory";

export default function ProductItemAutoComplete(props: {
  product: ProductItemType | null;
  setProduct: React.Dispatch<React.SetStateAction<ProductItemType | null>>;
  token: string | null;
  disabled?: boolean;
  finished?: boolean;
}) {
  const { token, setProduct, finished } = props;
  const [searchResults, setSearchResults] = useState<ProductItemType[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState<string>("");
  const [productError, setProductError] = useState(false);

  const [loading, setLoading] = useState(false);

  const ref = useRef<HTMLInputElement>();

  useEffect(() => {
    if (token) {
      setLoading(true);
      searchProductByUUID(token, productSearchTerm, 1, 10, finished).then(
        (results) => {
          setLoading(false);
          if (results.results.length === 1) {
            setProduct(results.results[0]);
            setSearchResults([]);
            setProductError(false);
            ref.current && ref.current.focus();
          } else {
            setSearchResults(results.results);
          }
        }
      );
    }
  }, [productSearchTerm, token, setProduct, finished]);
  useEffect(() => {
    if (!props.product) {
      setProductSearchTerm("");
      ref.current && ref.current.focus();
    }
  }, [props.product]);
  return (
    <Autocomplete
      freeSolo
      disableClearable
      disabled={props.disabled}
      key={props.product ? props.product.id : null}
      sx={{ width: "100%", minWidth: "320px", mt: 1 }}
      options={searchResults}
      getOptionLabel={(option) => {
        if (typeof option === "string") {
          setProductSearchTerm(option);
          return option;
        }
        return option.uuid + (option.product as ProductType).name + String(option.id);
      }}
      value={props.product ? props.product : undefined}
      onChange={(_, val) => {
        if (typeof val !== "string") {
          setProduct(val);
          setProductError(false);
        } else {
          setProductError(true);
        }
      }}
      renderOption={(props, option) => (
        <li {...props}>
          <Stack>
            <Typography>
              {(option.product as ProductType).name} ({option.uuid})
            </Typography>
            {(option.product as ProductType).is_pieces && (
              <Typography variant="caption" color="gray">
                {option.original_size}kg packet
              </Typography>
            )}
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={ref}
          label="Product UUID"
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
          error={productError}
          sx={{ minWidth: "320px" }}
          helperText={
            productError ? "Please select a valid product" : "Required"
          }
          value={productSearchTerm}
          onChange={(evt) => {
            setProductSearchTerm(evt.target.value);
            var found = false;
            for (var i = 0; i < searchResults.length; i++) {
              if (searchResults[i].uuid === evt.target.value) {
                found = true;
                break;
              }
            }
            setProductError(!found);
          }}
        />
      )}
    />
  );
}
