import { useState, MouseEvent, useRef } from "react";
import { Paper, Popper, TextField, Typography } from "@mui/material";
import { EditTwoTone } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Div from "src/components/div";
import Button from "src/components/md3-button"

export default function NewBillDiscountEdit(props: { onAdd: (val: string) => any }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = open ? (Math.random() * 10).toString() : undefined;
  const discountRef = useRef<HTMLInputElement>();
  return (
    <div>
      <IconButton size="small" color="info" onClick={handleClick}>
        <EditTwoTone fontSize={"small"} />
      </IconButton>
      <Popper id={id} open={open} anchorEl={anchorEl} sx={{zIndex: 10000}}>
        <Paper elevation={12} sx={{ borderRadius: 3, px: 3, py: 2 }}>
          <Typography>Enter Discount Amount</Typography>

          <TextField
            variant="outlined"
            placeholder=""
            label="Discount"
            sx={{ my: 1, minWidth: "320px" }}
            inputRef={discountRef}
          />
          <Div sx={{ justifyContent: "space-around" }}>
            <Button
              variant="filled"
              color="secondary"
              size={"small"}
              onClick={() => setAnchorEl(null)}
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="primary"
              size={"small"}
              onClick={() => {
                if (discountRef.current) {
                    props.onAdd(discountRef.current.value)
                    setAnchorEl(null);
                }
              }}
            >
              Add
            </Button>
          </Div>
        </Paper>
      </Popper>
    </div>
  );
}
