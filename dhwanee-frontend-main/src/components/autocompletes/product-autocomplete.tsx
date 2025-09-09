import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import { searchProducts } from "src/api/inventory";
import { useState, useEffect } from "react";
import { ProductType } from "src/types/inventory";

export default function ProductAutoComplete(props: {
    product: ProductType | null;
    setProduct: React.Dispatch<React.SetStateAction<ProductType | null>>;
    token: string | null;
    finished?:boolean;
  }) {
    const { token, setProduct, finished } = props;
    const [searchResults, setSearchResults] = useState<ProductType[]>([]);
    const [productSearchTerm, setProductSearchTerm] = useState<string>("");
    const [productError, setProductError] = useState(false);
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
      if (token) {
        setLoading(true);
        searchProducts(token, productSearchTerm, 1, 10, finished).then((results) => {
          setLoading(false);
          if (results.results.length === 1) {
            setProduct(results.results[0]);
            setSearchResults([]);
            setProductError(false);
          } else {
            setSearchResults(results.results);
          }
        });
      }
    }, [productSearchTerm, token, setProduct, finished]);
  
    useEffect(() => {
      if (!props.product) setProductSearchTerm("");
    }, [props.product]);
  
    return (
      <Autocomplete
        freeSolo
        disableClearable
        key={props.product ? props.product.id : null}
        sx={{ width: "100%", minWidth: "320px", mt: 1 }}
        options={searchResults}
        getOptionLabel={(option) => {
          if (typeof option === "string") {
            setProductSearchTerm(option);
            return option;
          }
          return option.name;
        }}
        value={props.product ? props.product : undefined}
        onChange={(_, val) => {
          if (typeof val !== "string") {
            props.setProduct(val);
            setProductError(false);
          } else {
            setProductError(true);
          }
        }}
        renderOption={(props, option) => <li {...props}>{option.name}</li>}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Product Name"
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
                if (searchResults[i].name === evt.target.value) {
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
  