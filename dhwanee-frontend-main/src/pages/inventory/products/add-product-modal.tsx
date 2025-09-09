import {
  Card,
  CardContent,
  Checkbox,
  Collapse,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createRef, useEffect, useState } from "react";
import MD3Button from "src/components/md3-button";
import {
  CategoryType,
  ProductType,
  ProductTypeAtCreation,
  RecipeIngredientType,
  SubCategoryType,
} from "src/types/inventory";
import { createProduct } from "src/api/inventory";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import roundOff from "src/utils/round-off";
import { showSnackbar } from "src/components/snackbar/reducer";
import CategoryAutoComplete from "src/components/autocompletes/category-autocomplete";
import SubCategoryAutoComplete from "src/components/autocompletes/subcategory-autocomplete";
import RecipeItemAdder from "./recipe-item-adder";
import useApi from "src/utils/use-api";

export default function AddProductModal(props: {
  open: boolean;
  onAdd: (product: ProductType) => any;
  handleClose: (_?: any) => any;
}) {
  const [error, setError] = useState<{
    location: null | string;
    message: string;
  }>({ location: null, message: "" });

  const [category, setCategory] = useState<CategoryType>();
  const [subcategory, setSubCategory] = useState<SubCategoryType>();
  const [recipe, setRecipe] = useState<RecipeIngredientType[]>([]);
  const [isPieces, setIsPieces] = useState(true);
  const [isBulk, setIsBulk] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const authBody = useAppSelector((state) => state.auth.body);
  const [supplierBranch, setSupplierBranch] = useState<number>(0);

  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();
  const call = useApi();

  const refs = {
    name: createRef<HTMLInputElement>(),
    hsn: createRef<HTMLInputElement>(),
    default_selling_price: createRef<HTMLInputElement>(),
    default_buying_price: createRef<HTMLInputElement>(),
    default_tax: createRef<HTMLInputElement>(),
  };

  useEffect(() => {
    if (authBody) {
      if (authBody.branch.length === 1) {
        setSupplierBranch(authBody.branch[0].id);
      }
    } else {
      dispatch(
        showSnackbar({
          text: "Could not load user branch data. Are you logged in?",
          severity: "error",
        })
      );
    }
  }, [authBody, dispatch]);

  const handleProductCreate = (product: ProductTypeAtCreation) => {
    if (tokens) {
      call(createProduct(tokens.access, product)).then((res) => {
        props.onAdd(res);
      });
    }
  };

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
          Add Product
        </Typography>
        <Divider variant="middle" sx={{ my: 2, width: "70%" }} />
        <CardContent
          sx={{ maxHeight: "60vh", overflowY: "auto", maxWidth: 500 }}
        >
          <TextField
            variant="outlined"
            placeholder=""
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
            token={tokens ? tokens.access : null}
          />
          <SubCategoryAutoComplete
            subcategory={subcategory}
            setSubCategory={setSubCategory}
            category={category && category.id}
            token={tokens ? tokens.access : null}
          />
          <TextField
            variant="outlined"
            placeholder=""
            label="HSN"
            error={error.location === "hsn"}
            helperText={error.location === "hsn" ? error.message : ""}
            sx={{ my: 1, width: "100%", minWidth: "320px" }}
            required
            inputRef={refs.hsn}
          />
          <Stack direction="row" alignItems="center" gap={0}>
            <Checkbox
              checked={isFinished}
              onChange={(evt) => setIsFinished(evt.target.checked)}
              inputProps={{ "aria-label": "controlled" }}
            />
            <Typography>
              Is this product finished? (availale for sale)
            </Typography>
          </Stack>

          <Collapse in={isFinished}>
            <Stack direction="row" alignItems="center" gap={0}>
              <Checkbox
                checked={isPieces}
                onChange={(evt) => setIsPieces(evt.target.checked)}
                inputProps={{ "aria-label": "controlled" }}
              />
              <Typography>Is this product sold per pieces?</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" gap={0}>
              <Checkbox
                checked={isBulk}
                disabled={!isPieces}
                onChange={(evt) => setIsBulk(evt.target.checked)}
                inputProps={{ "aria-label": "controlled" }}
              />
              <Typography color={isPieces ? "CaptionText" : "GrayText"}>
                Is product sold in bulk?
              </Typography>
            </Stack>
            <TextField
              variant="outlined"
              placeholder=""
              label="Default Tax"
              error={error.location === "tax"}
              helperText={error.location === "tax" ? error.message : ""}
              sx={{ my: 1, width: "100%", minWidth: "320px" }}
              required
              inputRef={refs.default_tax}
            />
            <TextField
              variant="outlined"
              placeholder=""
              label="Default selling Price"
              error={error.location === "selling_price"}
              helperText={
                error.location === "selling_price" ? error.message : ""
              }
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
            <Typography>Recipe</Typography>
            <RecipeItemAdder recipe={recipe} changeRecipe={setRecipe} />
          </Collapse>

          <FormControl sx={{ width: "100%", my: 1, minWidth: "320px" }}>
            <InputLabel id="product-item-rows-select-label">
              Product associated to which branch
            </InputLabel>
            <Select
              labelId="product-item-rows-select-label"
              id="product-item-rows-select"
              value={supplierBranch}
              label="Product associated to which branch"
              onChange={(ev) => setSupplierBranch(Number(ev.target.value))}
            >
              {(authBody ? authBody.branch : []).map((e) => (
                <MenuItem value={e.id} key={e.id}>
                  {e.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
        <Divider variant="middle" sx={{ my: 1, width: "70%" }} />
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            gap: 4,
          }}
        >
          <MD3Button
            sx={{ float: "left", width: "100%" }}
            variant="filledTonal"
            onClick={() => {
              setError({ location: null, message: "" });
              props.handleClose();
            }}
          >
            Cancel
          </MD3Button>
          <MD3Button
            variant="filled"
            sx={{ width: "100%" }}
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
              if (category && subcategory)
                handleProductCreate({
                  name: refs.name.current?.value || "",
                  hsn: refs.hsn.current?.value || "",
                  default_selling_price: Number(
                    refs.default_selling_price.current?.value
                  ),
                  bulk: isBulk,
                  finished: isFinished,
                  is_pieces: isPieces,
                  default_tax: Number(refs.default_tax.current?.value),
                  category: category.id,
                  subcategory: subcategory.id,
                  recipe: recipe,
                  branch: supplierBranch,
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
