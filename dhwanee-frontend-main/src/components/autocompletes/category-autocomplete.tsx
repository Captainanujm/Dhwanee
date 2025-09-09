import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import { searchCategories } from "src/api/inventory";
import { CategoryType } from "src/types/inventory";

function CategoryAutoComplete(props: {
  category: CategoryType | undefined;
  setCategory: React.Dispatch<React.SetStateAction<CategoryType | undefined>>;
  token: string | null;
}) {
  const [searchResults, setSearchResults] = useState<CategoryType[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>("");
  const [categoryError, setCategoryError] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (props.token && categorySearchTerm !== "") {
      setLoading(true);
      searchCategories(props.token, categorySearchTerm, 1, 10).then(
        (results) => {
          setLoading(false);
          setSearchResults(results.results);
        }
      );
    }
  }, [categorySearchTerm, props.token]);

  return (
    <Autocomplete
      freeSolo
      disableClearable
      sx={{ width: "100%", minWidth: "320px", mt: 1 }}
      options={searchResults}
      getOptionLabel={(option) => {
        if (typeof option === "string") {
          setCategorySearchTerm(option);
          return option;
        }
        return option.name;
      }}
      value={props.category}
      onChange={(_, val) => {
        if (typeof val !== "string") {
          props.setCategory(val);
          setCategoryError(false);
        } else {
          setCategoryError(true);
        }
      }}
      renderOption={(props, option) => <li {...props}>{option.name}</li>}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Category Name"
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
          error={categoryError}
          sx={{ minWidth: "320px" }}
          helperText={
            categoryError ? "Please select a valid category" : "Required"
          }
          onChange={(evt) => {
            setCategorySearchTerm(evt.target.value);
            var found = false;
            for (var i = 0; i < searchResults.length; i++) {
              if (searchResults[i].name === evt.target.value) {
                found = true;
                break;
              }
            }
            setCategoryError(!found);
          }}
        />
      )}
    />
  );
}

export default CategoryAutoComplete;