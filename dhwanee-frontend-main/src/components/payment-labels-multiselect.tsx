import {
  Stack,
  Chip,
  TextField,
  Box,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "src/redux/hooks";
import { hideLoader } from "./loader/reducer";
import { showSnackbar } from "./snackbar/reducer";
import { PaymentLabelType } from "src/types/accounting";
import { searchLabels } from "src/api/accounting";

export default function PaymentLabelsMultiSelect(props: {
  selected: PaymentLabelType[];
  setSelected: (labels: PaymentLabelType[]) => any;
}) {
  const tokens = useAppSelector((state) => state.auth.tokens);
  const dispatch = useAppDispatch();

  const [searchResults, setSearchResults] = useState<PaymentLabelType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { selected, setSelected } = props;

  useEffect(() => {
    if (tokens) {
      searchLabels(tokens.access, searchTerm, 1, 10)
        .then((results) => {
          setSearchResults(results.results);
        })
        .catch(() => {
          dispatch(
            showSnackbar({
              text: "some error occurred while trying to load the results",
            })
          );
        })
        .finally(() => dispatch(hideLoader()));
    }
  }, [tokens, dispatch, searchTerm]);
  return (
    <>
      <TextField
        variant="outlined"
        label="Labels"
        value={searchTerm}
        onChange={(evt) => setSearchTerm(evt.target.value)}
        sx={{ my: 1, width: "80%", minWidth: "320px" }}
        InputProps={{
          startAdornment: (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((value) => (
                <Chip
                  key={value.id}
                  label={value.name}
                  onDelete={() => {
                    if (selected.includes(value)) {
                      const index = selected.indexOf(value);
                      setSelected(
                        selected
                          .slice(0, index)
                          .concat(selected.slice(index + 1))
                      );
                    }
                  }}
                />
              ))}
            </Box>
          ),
        }}
      />
      <Stack
        direction="row"
        gap={1}
        flexWrap={"nowrap"}
        sx={{ mb: 1, mt: 0, width: "80%", minWidth: "320px" }}
      >
        {searchResults.map((cat) => (
          <Chip
            label={cat.name}
            variant="outlined"
            size="small"
            onClick={() => {
              if (selected.includes(cat)) {
                const index = selected.indexOf(cat);
                setSelected(
                  selected.slice(0, index).concat(selected.slice(index + 1))
                );
              } else {
                setSelected([...selected, cat]);
              }
            }}
          />
        ))}
      </Stack>
    </>
  );
}
