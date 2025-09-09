import { DeleteTwoTone, CheckCircleTwoTone } from "@mui/icons-material";
import { Typography, IconButton, TextField } from "@mui/material";
import { useState, createRef } from "react";
import ProductAutoComplete from "src/components/autocompletes/product-autocomplete";
import Div from "src/components/div";
import { useAppSelector } from "src/redux/hooks";
import { ProductType, RecipeIngredientType } from "src/types/inventory";

export default function RecipeItemAdder(props: {
  recipe: RecipeIngredientType[];
  changeRecipe: React.Dispatch<React.SetStateAction<RecipeIngredientType[]>>;
}) {
  const [product, setProduct] = useState<ProductType | null>(null);
  const weightRef = createRef<HTMLInputElement>();
  const tokens = useAppSelector((state) => state.auth.tokens);

  const addCurrentStone = () => {
    if (
      weightRef.current &&
      weightRef.current.value !== "" &&
      !Number.isNaN(weightRef.current.value) &&
      product
    ) {
      props.changeRecipe([
        ...props.recipe,
        {
          percentage: Number(weightRef.current.value),
          product,
        },
      ]);
      weightRef.current.value = "";
    }
  };

  return (
    <>
      {props.recipe.map((ingredient, index) => (
        <Div sx={{ flexWrap: "nowrap", alignItems: "center" }}>
          <Typography sx={{ width: "100%" }} variant="button" align="center">
            {ingredient.product.name}
          </Typography>
          <Typography sx={{ width: "100%" }} variant="body1" align="center">
            {ingredient.percentage}%
          </Typography>
          <IconButton
            color="error"
            onClick={() => {
              props.changeRecipe(
                props.recipe
                  .slice(0, index)
                  .concat(props.recipe.slice(index + 1))
              );
            }}
          >
            <DeleteTwoTone />
          </IconButton>
        </Div>
      ))}
      <Div sx={{ flexWrap: "nowrap" }}>
        <ProductAutoComplete
          product={product}
          setProduct={setProduct}
          token={tokens ? tokens.access : null}
          finished={false}
        />
        <TextField
          sx={{ width: "100%", my: 1 }}
          variant="outlined"
          label="Percentage"
          inputRef={weightRef}
          onKeyDown={(evt) => {
            if (evt.key === "Enter") {
              evt.preventDefault();
              evt.stopPropagation();
              addCurrentStone();
            }
          }}
        />
        <IconButton
          color="success"
          onClick={addCurrentStone}
          sx={{ height: "min-content" }}
        >
          <CheckCircleTwoTone />
        </IconButton>
      </Div>
    </>
  );
}
