import {
  Autocomplete,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { createRef, useEffect, useState } from "react";
import MD3Button from "src/components/md3-button";
import {
  CategoryType,
  ProductType,
  ProductTypeAtCreation,
  SubCategoryType,
} from "src/types/inventory";
import {
  editProduct,
  searchCategories,
  searchSubCategoriesByCategory,
} from "src/api/inventory";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import Div from "src/components/div";
import roundOff from "src/utils/round-off";
import { showLoader, hideLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";

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
    if (
      props.subcategory &&
      props.category &&
      props.subcategory?.category.id !== props.category
    )
      setSubCategoryError(true);
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

export default function EditProductModal(props: {
  open: boolean;
  initialData: ProductType;
  onAdd: (product: ProductType) => any;
  handleClose: (_?: any) => any;
}) {
  const [error, setError] = useState<{
    location: null | string;
    message: string;
  }>({ location: null, message: "" });

  const [category, setCategory] = useState<CategoryType>();
  const [subcategory, setSubCategory] = useState<SubCategoryType>();
  const [unit, setUnit] = useState<"pc" | "m">("pc");
  const [isBulk, setIsBulk] = useState(false);

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const { initialData } = props;

  const refs = {
    name: createRef<HTMLInputElement>(),
    hsn: createRef<HTMLInputElement>(),
    default_selling_price: createRef<HTMLInputElement>(),
    default_buying_price: createRef<HTMLInputElement>(),
    default_tax: createRef<HTMLInputElement>(),
  };

  const handleProductEdit = (product: ProductTypeAtCreation & { id: any }) => {
    if (tokens) {
      dispatch(showLoader("Updating Product"));
      editProduct(tokens.access, product.id, product)
        .then((res) => {
          props.onAdd(res);
        })
        .catch((err) => {
          if (err.status === 400) {
            dispatch(
              showSnackbar({
                // shows the first error in the auto response by drf
                //@ts-ignore
                text: ("Error: " + Object.values(err.response)[0][0]) as string,
              })
            );
          } else dispatch(showSnackbar({ text: "failed to update product" }));
        })
        .finally(() => {
          dispatch(hideLoader());
        });
    }
  };

  useEffect(() => {
    setCategory(
      typeof initialData.subcategory === "object"
        ? initialData.subcategory.category
        : undefined
    );
    setSubCategory(
      typeof initialData.subcategory === "object"
        ? initialData.subcategory
        : undefined
    );
    setUnit((initialData as any).unit || "");
    setIsBulk(initialData.bulk);
  }, [initialData]);

  return (
    <Modal
      open={props.open}
      onClose={() => {
        setError({ location: null, message: "" });
        props.handleClose();
      }}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Card
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "background.paper",
          p: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          minWidth: "30%",
          maxWidth: "60%",
        }}
      >
        <Typography
          id="modal-modal-title"
          variant="h4"
          component="h2"
          sx={{ textAlign: "center" }}
        >
          Edit Product
        </Typography>
        <Divider variant="middle" sx={{ my: 2, width: "70%" }} />
        <CardContent
          sx={{ maxHeight: "60vh", overflowY: "auto", maxWidth: 500 }}
        >
          <TextField
            variant="outlined"
            defaultValue={initialData.name}
            label="Name"
            error={error.location === "name"}
            helperText={error.location === "name" ? error.message : ""}
            sx={{ my: 1, width: "100%", minWidth: "320px" }}
            required
            inputRef={refs.name}
          />
          <CategoryAutoComplete
            category={category}
            setCategory={setCategory}
            token={tokens?tokens.access:null}
          />
          <SubCategoryAutoComplete
            subcategory={subcategory}
            setSubCategory={setSubCategory}
            category={category && category.id}
            token={tokens?tokens.access:null}
          />
          <TextField
            variant="outlined"
            defaultValue={initialData.hsn}
            label="HSN"
            error={error.location === "hsn"}
            helperText={error.location === "hsn" ? error.message : ""}
            sx={{ my: 1, width: "100%", minWidth: "320px" }}
            required
            inputRef={refs.hsn}
          />
          <FormControl fullWidth sx={{ my: 2 }}>
            <InputLabel id="new-product-unit-select-label">Unit</InputLabel>
            <Select
              labelId="new-product-unit-select-label"
              id="new-product-unit-select"
              value={unit}
              label="Unit"
              onChange={(ev) => setUnit(ev.target.value as "pc" | "m")}
            >
              <MenuItem value={"pc"}>Pieces (pc)</MenuItem>
              <MenuItem value={"m"}>Meter (m)</MenuItem>
            </Select>
          </FormControl>
          <Div>
            <Typography variant="body1">Is bulk product?</Typography>
            <Switch
              checked={isBulk}
              onChange={(evt) => setIsBulk(evt.target.checked)}
              inputProps={{ "aria-label": "controlled" }}
            />
          </Div>
          
          <TextField
              variant="outlined"
              placeholder=""
              defaultValue={initialData.default_tax}
              label="Default Tax"
              error={error.location === "tax"}
              helperText={error.location === "tax" ? error.message : ""}
              sx={{ my: 1, width: "100%", minWidth: "320px" }}
              required
              inputRef={refs.default_tax}
            />
          <TextField
            variant="outlined"
            defaultValue={initialData.default_selling_price}
            label="Default buying Price"
            error={error.location === "buying_price"}
            helperText={error.location === "buying_price" ? error.message : ""}
            sx={{ my: 1, width: "100%", minWidth: "320px" }}
            required
            inputRef={refs.default_buying_price}
            onChange={(evt) => {
              if (
                refs.default_buying_price.current &&
                refs.default_selling_price.current &&
                !Number.isNaN(refs.default_buying_price.current.value)
              ) {
                refs.default_selling_price.current.value = roundOff(
                  Number(refs.default_buying_price.current.value) * (13 / 10)
                ).toString();
              }
            }}
          />
          <TextField
            variant="outlined"
            defaultValue={initialData.default_selling_price}
            label="Default selling Price"
            error={error.location === "selling_price"}
            helperText={error.location === "selling_price" ? error.message : ""}
            sx={{ my: 1, width: "100%", minWidth: "320px" }}
            required
            inputRef={refs.default_selling_price}
            onChange={(evt) => {
              if (
                refs.default_buying_price.current &&
                refs.default_selling_price.current &&
                !Number.isNaN(refs.default_selling_price.current.value)
              ) {
                refs.default_buying_price.current.value = roundOff(
                  Number(refs.default_selling_price.current.value) * (10 / 13)
                ).toString();
              }
            }}
          />
        </CardContent>
        <Divider variant="middle" sx={{ my: 1, width: "70%" }} />
        <div style={{ width: "100%", display: "flex",justifyContent: "space-between",gap: 4 }}>
          <MD3Button
            sx={{ float: "left", width: "100%" }}
            variant="filled"
            color="secondary"
            onClick={() => {
              setError({ location: null, message: "" });
              props.handleClose();
            }}
          >
            Cancel
          </MD3Button>
          <MD3Button
            variant="filled"
            color="primary"
            size="large"
            onClick={() => {
              if (refs.name.current && refs.name.current.value === "") {
                setError({
                  location: "name",
                  message: "This is a required Field",
                });

                return;
              }
              if (refs.hsn.current && refs.hsn.current.value === "") {
                setError({
                  location: "hsn",
                  message: "This is a required Field",
                });

                return;
              }
              if (
                refs.default_buying_price.current &&
                (refs.default_buying_price.current.value === "" ||
                  Number.isNaN(refs.default_buying_price.current.value))
              ) {
                setError({
                  location: "buying_price",
                  message: "Enter a valid numerical value",
                });
                return;
              }
              if (
                refs.default_selling_price.current &&
                (refs.default_selling_price.current.value === "" ||
                  Number.isNaN(refs.default_selling_price.current.value))
              ) {
                setError({
                  location: "selling_price",
                  message: "Enter a valid numerical value",
                });
                return;
              }
              
              if (
                refs.default_tax.current &&
                (refs.default_tax.current.value === "" ||
                  Number.isNaN(refs.default_tax.current.value))) {
                setError({
                  location: "tax",
                  message: "Enter a valid numerical value",
                });
                return;
              }
              if (category && subcategory)
                handleProductEdit({
                  name: refs.name.current ? refs.name.current.value : "",
                  hsn: refs.hsn.current ? refs.hsn.current.value : "",
                  default_selling_price: Number(refs.default_selling_price.current?.value),
                  bulk: isBulk,
                  unit: unit,
                  default_tax: Number(refs.default_tax.current?.value),
                  subcategory: subcategory.id,
                  category: category.id,
                  branch: initialData.branch,
                  is_pieces: initialData.is_pieces,
                  finished: initialData.finished,
                  recipe: initialData.recipe,
                  id: initialData.id,
                });
            }}
          >
            Save
          </MD3Button>
        </div>
      </Card>
    </Modal>
  );
}
