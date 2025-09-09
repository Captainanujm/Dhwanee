"use client";
import { createTheme } from "@mui/material/styles";
import { extendTheme } from "@mui/material-next";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#6F43C0",
    },
    secondary: {
      main: "#7D7291",
    },
  },
  typography: {
    fontFamily: "Raleway",
  },
  components: {
    MuiAlert: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState.severity === "info" && {
            backgroundColor: "#60a5fa",
          }),
        }),
      },
    },
  },
});

export const md3Theme = extendTheme({
  ref: {
    typeface: {
        plain: "Raleway",
        brand: "Raleway",
    },
    palette: {
      primary: {
        "0": "#000000",
        "10": "#250059",
        "20": "#3F008D",
        "30": "#5727A6",
        "40": "#6F43C0",
        "50": "#895EDB",
        "60": "#A478F7",
        "70": "#BC99FF",
        "80": "#D3BBFF",
        "90": "#EBDDFF",
        "95": "#F7EDFF",
        "99": "#FFFBFF",
        "100": "#FFFFFF",
      },
      secondary: {
        "0": "#000000",
        "10": "#201731",
        "20": "#352C47",
        "30": "#4C425E",
        "40": "#645977",
        "50": "#7D7291",
        "60": "#978BAB",
        "70": "#B2A6C7",
        "80": "#CEC1E3",
        "90": "#EBDDFF",
        "95": "#F7EDFF",
        "99": "#FFFBFF",
        "100": "#FFFFFF",
      },
      tertiary: {
        "0": "#000000",
        "10": "#370B1B",
        "20": "#512030",
        "30": "#6C3646",
        "40": "#874D5D",
        "50": "#A46576",
        "60": "#C17E8F",
        "70": "#DE97AA",
        "80": "#FDB2C5",
        "90": "#FFD9E1",
        "95": "#FFECEF",
        "99": "#FFFBFF",
        "100": "#FFFFFF",
      },
    },
  },
});

export default theme;
