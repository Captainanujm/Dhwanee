import {
  ArrowDownward,
  ArrowUpward,
  DownloadTwoTone,
  ErrorOutlineTwoTone,
} from "@mui/icons-material";
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
} from "@mui/material";
import { ReactNode, useState } from "react";

interface DataTablePropsType {
  header: string[];
  rows: ReactNode[][];
  noMinWidth?: boolean;
  loading?: boolean;
  limitHeight?: number | string;
  moreOptions?: { name: string; icon: ReactNode; onClick: () => any }[];
  sortOptions?: {
    headers: string[];
    onSortChange: (option: string, asc: boolean) => any;
    initialValue: number;
  };
}

export default function DataTable(props: DataTablePropsType) {
  const [showOptions, setShowOptions] = useState(false);
  const { sortOptions } = props;
  const [sortBy, setSortBy] = useState<number>(
    props.sortOptions ? props.sortOptions.initialValue : 0
  );

  return (
    <Box
      component="div"
      sx={{ position: "relative" }}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <Paper
        elevation={3}
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          transform: "translateY(-50%)",
          py: 1,
          px: 1,
          zIndex: 100,
          display: showOptions ? "flex" : "none",
          gap: 1,
        }}
      >
        <Button
          startIcon={<DownloadTwoTone />}
          color="inherit"
          size="small"
          onClick={() => {
            let csvData = [];

            // Get headers
            let heads = props.header.map((el) => el.replace(/"/g, '"'));

            // Add headers to csvData
            csvData.push(heads.join(","));

            // Traveres through each row
            for (let row of props.rows) {
              // Get values from each row
              let rowValues = row.map((el) => {
                // Get value according to the header
                if (typeof el === "string" || typeof el === "number") {
                  let final = el.toString().replace(/"/g, '"');
                  return `"${final}"`;
                }
                return "";
              });
              console.log(rowValues);
              // Push values in csvData
              csvData.push(rowValues.join(","));
            }
            // Call function to download CSV file
            let _csvData = csvData.join("\n");
            console.log(csvData, _csvData);
            let anchor = document.createElement("a");
            anchor.href =
              "data:text/csv;charset=utf-8," + encodeURIComponent(_csvData);
            anchor.target = "_blank";
            anchor.download = "data.csv";
            anchor.click();
          }}
        >
          Download as CSV
        </Button>

        {props.sortOptions && (
          <FormControl sx={{ width: "150px" }} size="small">
            <InputLabel id="account-item-rows-select-label">Sort By</InputLabel>
            <Select
              labelId="account-item-rows-select-label"
              id="account-item-rows-select"
              value={sortBy}
              label="Rows per page"
              onChange={(ev) => {
                setSortBy(Number(ev.target.value));
                if (sortOptions) {
                  sortOptions.onSortChange(
                    sortOptions.headers[
                      (Number(ev.target.value) > 0 ? 1 : -1) *
                        Number(ev.target.value) -
                        1
                    ],
                    Number(ev.target.value) > 0
                  );
                }
              }}
            >
              {props.sortOptions.headers.map((e, i) => [
                <MenuItem value={i + 1}>
                  {e} <ArrowUpward fontSize="small" />
                </MenuItem>,
                <MenuItem value={-i - 1}>
                  {e} <ArrowDownward fontSize="small" />
                </MenuItem>,
              ])}
            </Select>
          </FormControl>
        )}
        {props.moreOptions &&
          props.moreOptions.map((el) => (
            <Button
              startIcon={el.icon}
              color="inherit"
              size="small"
              onClick={el.onClick}
              sx={{ pl: 1 }}
            >
              {el.name}
            </Button>
          ))}
      </Paper>
      <TableContainer
        component={Paper}
        elevation={0}
        variant="outlined"
        sx={props.limitHeight ? { maxHeight: props.limitHeight } : {}}
      >
        <Table
          sx={{ minWidth: props.noMinWidth ? "auto" : 650 }}
          aria-label="simple table"
          stickyHeader
        >
          <TableHead>
            <TableRow>
              {props.header.map((elem, index) => (
                <TableCell
                  key={index}
                  sx={{ textTransform: "uppercase", fontWeight: 600 }}
                >
                  {elem}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {props.loading ? (
              <TableRow>
                {props.header.map((e, index) => (
                  <TableCell
                    key={index}
                    sx={{ textTransform: "uppercase", fontWeight: 600 }}
                  >
                    <Skeleton animation="wave" />
                  </TableCell>
                ))}
              </TableRow>
            ) : props.rows.length > 0 ? (
              props.rows.map((row, index) => (
                <TableRow
                  key={"row-" + index}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  {row.map((col, colindex) => (
                    <TableCell
                      component="th"
                      scope="row"
                      key={"row-" + index + "-col-" + colindex}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={props.header.length}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      gap: 4,
                      color: "gray",
                      justifyContent: "center",
                    }}
                  >
                    <ErrorOutlineTwoTone fontSize="small" />
                    <i>No data to show</i>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
