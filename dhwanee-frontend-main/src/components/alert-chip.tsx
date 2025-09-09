import { alpha, Box, Typography } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import {
  CheckTwoTone,
  ErrorOutlineTwoTone,
  InfoTwoTone,
  WarningAmberTwoTone,
} from "@mui/icons-material";

export default function AlertChip(props: {
  children: string;
  level: "error" | "success" | "warning" | "info";
}) {
  return (
    <Box
      sx={{
        display: "flex",
        background: (theme) => alpha(theme.palette[props.level].main, 0.2),
        height: 30,
        borderRadius: 2,
        alignItems: "center",
        width: "fit-content",
        p: "12px 8px 12px 0",
      }}
    >
      <IconButton size="small" color={props.level}>
        {(() => ({
          error: <ErrorOutlineTwoTone fontSize="small" />,
          success: <CheckTwoTone fontSize="small" />,
          warning: <WarningAmberTwoTone fontSize="small" />,
          info: <InfoTwoTone fontSize="small" />
        }[props.level]))()}
      </IconButton>
      <Typography variant="body1" color={props.level} fontSize="small">
        {props.children}
      </Typography>
    </Box>
  );
}
