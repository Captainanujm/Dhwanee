import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import { searchSubCategoriesByCategory } from "src/api/inventory";
import { SubCategoryType } from "src/types/inventory";

function SubCategoryAutoComplete(props: {
  subcategory: SubCategoryType | undefined;
  category: number | string | undefined;
  setSubCategory: React.Dispatch<
    React.SetStateAction<SubCategoryType | undefined>
  >;
  token: string | null;
}) {
  const [searchResults, setSearchResults] = useState<SubCategoryType[]>([]);
  const [subcategorySearchTerm, setSubCategorySearchTerm] =
    useState<string>("");
  const [subcategoryError, setSubCategoryError] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (props.token && props.category) {
      setLoading(true);
      searchSubCategoriesByCategory(
        props.token,
        subcategorySearchTerm,
        props.category,
        1,
        10
      ).then((results) => {
        setLoading(false);
        setSearchResults(results.results);
      });
    }
  }, [subcategorySearchTerm, props.token, props.category]);

  useEffect(() => {
    if (props.subcategory && props.category) setSubCategoryError(false);
  }, [props.category, props.subcategory]);

  return (
    <Autocomplete
      freeSolo
      disableClearable
      sx={{ width: "100%", minWidth: "320px", mt: 1 }}
      options={searchResults}
      getOptionLabel={(option) => {
        if (typeof option === "string") {
          setSubCategorySearchTerm(option);
          return option;
        }
        return option.name;
      }}
      value={props.subcategory}
      onChange={(_, val) => {
        if (typeof val !== "string") {
          props.setSubCategory(val);
          setSubCategoryError(false);
        } else {
          setSubCategoryError(true);
        }
      }}
      renderOption={(props, option) => <li {...props}>{option.name}</li>}
      renderInput={(params) => (
        <TextField
          {...params}
          label="SubCategory Name"
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
          error={subcategoryError}
          sx={{ minWidth: "320px" }}
          helperText={
            subcategoryError ? "Please select a valid subcategory" : "Required"
          }
          onChange={(evt) => {
            setSubCategorySearchTerm(evt.target.value);
            var found = false;
            for (var i = 0; i < searchResults.length; i++) {
              if (searchResults[i].name === evt.target.value) {
                found = true;
                break;
              }
            }
            setSubCategoryError(!found);
          }}
        />
      )}
    />
  );
}

export default SubCategoryAutoComplete;
