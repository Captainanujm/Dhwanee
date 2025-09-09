import { useState, MouseEvent, useRef, useCallback } from "react";
import { Paper, Popper, Stack, TextField, Typography } from "@mui/material";
import { AddShoppingCartTwoTone } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Div from "src/components/div";
import { ProductType } from "src/types/inventory";
import MD3Button from "src/components/md3-button";
import { useAppSelector } from "src/redux/hooks";
import useApi from "src/utils/use-api";
import { addProductItemsToStock } from "src/api/inventory";

export default function AddProductToStock(props: {
  product: ProductType;
  onAdd: (val: any) => any;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = open ? (Math.random() * 10).toString() : undefined;
  const packetSizeRef = useRef<HTMLInputElement>();
  const numPacketRef = useRef<HTMLInputElement>();
  const rateRef = useRef<HTMLInputElement>();

  const tokens = useAppSelector((state) => state.auth.tokens);
  const call = useApi();

  const handleCreate = useCallback(
    (data: { packet_size?: number; num_packets: number; price: number }) => {
      if (tokens) {
        call(
          addProductItemsToStock(tokens.access, props.product.id, data)
        ).then((res) => {
          props.onAdd(res);
          setAnchorEl(null);
        });
      }
    },
    [props, tokens, call]
  );

  if (!props.product.finished) return null;
  return (
    <div>
      <IconButton size="small" color="primary" onClick={handleClick}>
        <AddShoppingCartTwoTone fontSize={"small"} />
      </IconButton>
      <Popper id={id} open={open} anchorEl={anchorEl} sx={{ zIndex: 10000 }}>
        <Paper elevation={12} sx={{ borderRadius: 3, px: 3, py: 2 }}>
          <Typography variant="h6">Add Product To Stock</Typography>
          <Stack>
            <TextField
              variant="outlined"
              placeholder=""
              label={
                props.product.is_pieces
                  ? "Number of packets"
                  : "Total amount to be added (in kg or m)"
              }
              sx={{ my: 1, minWidth: "320px" }}
              inputRef={numPacketRef}
              autoFocus
            />

            {props.product.is_pieces && (
              <TextField
                variant="outlined"
                placeholder=""
                type="number"
                label="Size of each packet (in kg)"
                sx={{ my: 1, minWidth: "320px" }}
                inputRef={packetSizeRef}
              />
            )}

            <TextField
              variant="outlined"
              placeholder=""
              label="Selling Price (/packet/gm)"
              sx={{ my: 1, minWidth: "320px" }}
              defaultValue={props.product.default_selling_price}
              inputRef={rateRef}
            />
          </Stack>
          <Div sx={{ justifyContent: "space-around", flexWrap: "nowrap" }}>
            <MD3Button
              sx={{ width: "100%" }}
              variant="filledTonal"
              size={"small"}
              onClick={() => setAnchorEl(null)}
            >
              Cancel
            </MD3Button>
            <MD3Button
              sx={{ width: "100%" }}
              variant="filled"
              size={"small"}
              onClick={() => {
                if (numPacketRef.current && rateRef.current) {
                  handleCreate({
                    num_packets: Number(numPacketRef.current.value),
                    packet_size: packetSizeRef.current ? Number(packetSizeRef.current.value) : undefined,
                    price: Number(rateRef.current.value)
                  });
                }
              }}
            >
              Add
            </MD3Button>
          </Div>
        </Paper>
      </Popper>
    </div>
  );
}
