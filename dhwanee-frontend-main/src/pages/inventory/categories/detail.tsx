import {
  Box,
  Button,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { hideLoader, showLoader } from "src/components/loader/reducer";
import { showSnackbar } from "src/components/snackbar/reducer";
import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { useParams } from "react-router-dom";
import Div from "src/components/div";
import AccentCard from "src/components/accent-card";
import DataTable from "src/components/data-table";
import {
  AddTwoTone,
  DeleteTwoTone,
  EditTwoTone,
  LaunchTwoTone,
} from "@mui/icons-material";
import {
  createSubCategory,
  getOneCategory,
  getProductsByCategory,
  getSubCategoriesByCategory,
} from "src/api/inventory";
import AddSubCategoryModal from "./add-subcategory-modal";
import { CategoryType, SubCategoryType } from "src/types/inventory";
import { Link } from "react-router-dom";

export default function CategoryDetails() {
  const [category, setCategory] = useState<CategoryType | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [subcategoriesData, setSubcategoriesData] = useState<
    Array<SubCategoryType>
  >([]);
  const [addSubCategoryModalOpen, setAddSubCategoryModalOpen] = useState(false);
  const [productsByCategory, setProductsByCategory] = useState<
    Array<{ name: string; id: number; current_stock: number }>
  >([]);
  const [totalItems, setTotalItems] = useState<number>(0);

  const { id } = useParams();
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const refreshSubCategories = useCallback(() => {
    if (tokens && id) {
      setLoading(true);
      getSubCategoriesByCategory(tokens.access, id)
        .then((subcategories) => {
          setSubcategoriesData(subcategories.results);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to create sub category" }))
        )
        .finally(() => setLoading(false));
    }
  }, [dispatch, tokens, id]);

  const refreshProducts = useCallback(() => {
    if (tokens && id) {
      setLoading(true);
      getProductsByCategory(tokens.access, id)
        .then((products) => {
          setProductsByCategory(products);
          var total = 0;
          products.forEach(prod => {total += Number(prod.current_stock)})
          setTotalItems(total)
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to load products" }))
        )
        .finally(() => setLoading(false));
    }
  }, [dispatch, tokens, id]);

  const handleSubCategoryCreate = useCallback(
    (data: { name: string }) => {
      if (tokens && id && category) {
        dispatch(showLoader("Creating Sub Category"));
        createSubCategory(tokens.access, { name: data.name, category: id, branch: category.branch })
          .then((_category) => {
            setCategory(_category);
            refreshSubCategories();
          })
          .catch(() =>
            dispatch(showSnackbar({ text: "failed to create sub category" }))
          )
          .finally(() => dispatch(hideLoader()));
      }
    },
    [tokens, id, dispatch, refreshSubCategories, category]
  );

  useEffect(refreshSubCategories, [refreshSubCategories]);
  useEffect(refreshProducts, [refreshProducts]);

  useEffect(() => {
    if (tokens && id) {
      setLoading(true);
      getOneCategory(tokens.access, id)
        .then((_category) => {
          setCategory(_category);
        })
        .catch(() =>
          dispatch(showSnackbar({ text: "failed to load category details" }))
        )
        .finally(() => setLoading(false));
    }
  }, [tokens, dispatch, id]);

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backdropFilter: "blur(8px)",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          display: loading ? "flex" : "none",
        }}
      >
        <CircularProgress />
      </Box>
      <Grid container sx={{ position: "relative", zIndex: 900 }}>
        <Grid item xs={8} sx={{ px: 1 }}>
          <Div sx={{ mb: 1 }}>
            <Typography variant="h5">Sub Categories</Typography>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AddTwoTone fontSize="small" />}
              onClick={() => setAddSubCategoryModalOpen(true)}
            >
              Add
            </Button>
          </Div>
          <DataTable
            header={["id", "name", "actions"]}
            rows={subcategoriesData.map((subcategory) => [
              subcategory.id,
              subcategory.name,
              <>
                <IconButton size="small" color="info">
                  <EditTwoTone fontSize="inherit" />
                </IconButton>
                <IconButton size="small" color="error">
                  <DeleteTwoTone fontSize="inherit" />
                </IconButton>
              </>,
            ])}
          />
        </Grid>
        <Grid item xs={4}>
          <AccentCard>
            <CardContent
              sx={{
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                padding: 2,
              }}
            >
              <Typography variant="button">Category Details</Typography>
              <Typography variant="h4" gutterBottom>
                {category ? category.name : "NA"}
              </Typography>
              <Div>
                <Typography variant="button">Sub categories </Typography>
                <Typography variant="button">
                  {subcategoriesData.length}
                </Typography>
              </Div>
              <Div>
                <Typography variant="button">Products</Typography>
                <Typography variant="button">
                  {productsByCategory.length}
                </Typography>
              </Div>
              <Div>
                <Typography variant="button">Items in stock</Typography>
                <Typography variant="button">
                  {totalItems}
                </Typography>
              </Div>
            </CardContent>
          </AccentCard>
        </Grid>
      </Grid>
      <Typography variant="h5" my={1}>
        Products with this category
      </Typography>
      <DataTable
        header={["id", "product", "stock", "actions"]}
        rows={productsByCategory.map((elem) => [
          elem.id,
          elem.name,
          elem.current_stock,
          <Link to={`/store/inventory/products/${elem.id}`}>
            <IconButton size="small">
              <LaunchTwoTone fontSize="small" />
            </IconButton>
          </Link>,
        ])}
      />
      <AddSubCategoryModal
        open={addSubCategoryModalOpen}
        handleClose={() => setAddSubCategoryModalOpen(false)}
        onAdd={(subcat) => {
          setAddSubCategoryModalOpen(false);
          handleSubCategoryCreate(subcat);
        }}
      />
    </>
  );
}
