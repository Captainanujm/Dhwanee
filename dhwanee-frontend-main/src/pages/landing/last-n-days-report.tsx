import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { getBillsOverview } from "src/api/reports";
import { useEffect, useState } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from "recharts";
import { useAppSelector } from "src/redux/hooks";
// import ENDPOINTS from "api/endpoints";
import dateToIsoString from "src/utils/date-to-string";
import { endOfDay, subDays, startOfDay } from "date-fns";
import useApi from "src/utils/use-api";
import roundOff from "src/utils/round-off";
import AccentCard from "src/components/accent-card";
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

const CustomTooltipRadarChart = (props: TooltipProps<ValueType, NameType>) => {
  if (props.active && props.payload && props.payload.length) {
    return (
      <Paper elevation={2} sx={{ px: 2, py: 1 }}>
        <Typography variant="h5" color="primary" fontWeight="600">
          {props.payload[0].payload.method__name.split(" ")[1]}
        </Typography>
        <Typography variant="body1">
          ₹{props.payload[0].value?.toLocaleString("en-IN")}
        </Typography>
      </Paper>
    );
  }

  return null;
};

export default function Sales(props: {
  branch: number;
  setBranch: React.Dispatch<React.SetStateAction<number>>;
}) {
  const theme = useTheme();
  const { branch, setBranch } = props;
  const tokens = useAppSelector((state) => state.auth.tokens);
  const [data, setData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<{
    sum: number;
    count: number;
    pSum: number;
    pCount: number;
    itemCount: number;
    pItemCount: number;
  }>({
    sum: 0,
    count: 0,
    pSum: 0,
    pCount: 0,
    itemCount: 0,
    pItemCount: 0,
  });
  const [dateDiff, setDateDiff] = useState(0);
  const call = useApi();
  const authBody = useAppSelector((state) => state.auth.body);



  useEffect(() => {
    if (tokens) {
      call(
        getBillsOverview(
          tokens.access,
          dateToIsoString(subDays(startOfDay(new Date()), dateDiff)),
          dateToIsoString(endOfDay(new Date())),
          branch ? { branch: branch.toString() } : {}
        )
      )
        .then((data: any) => {
          setData(
            data.data.payment_methods.map((e: any) => ({
              ...e,
              method__name: e.method + " " + e.method__name,
            }))
          );
          setSalesData({
            sum: data.data.sales.sum,
            count: data.data.sales.count,
            itemCount: data.data.products.total_products || 0,
            pSum: 0,
            pCount: 0,
            pItemCount: 0,
          });
        })
        .then(() => {
          call(
            getBillsOverview(
              tokens.access,
              dateToIsoString(
                subDays(startOfDay(new Date()), 2 * dateDiff || 1)
              ),
              dateToIsoString(subDays(endOfDay(new Date()), dateDiff || 1)),
              branch ? { branch: branch.toString() } : {}
            )
          ).then((newdata: any) => {
            setSalesData((d) => ({
              ...d,
              pSum: newdata.data.sales.sum,
              pCount: newdata.data.sales.count,
              pItemCount: newdata.data.products.total_products || 0,
            }));
            setData((localData) => {
              return localData;
            });
          });
        });
    }
  }, [tokens, dateDiff, call, branch]);
  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
      >
        <Typography variant="h6" my={3}>
          Sales Charts
        </Typography>

        <Stack direction="row">
          <FormControl sx={{ width: "200px", mx: 1 }}>
            <InputLabel id="customer-item-rows-select-label">Branch</InputLabel>
            <Select
              labelId="customer-item-rows-select-label"
              id="customer-item-rows-select"
              value={branch}
              label="Branch"
              onChange={(ev) => setBranch(Number(ev.target.value))}
            >
              <MenuItem value={0}>All Branches</MenuItem>
              {(authBody ? authBody.branch : []).map((e) => (
                <MenuItem value={e.id} key={e.id}>
                  {e.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel id="customer-item-rows-select-label">
              Time Period
            </InputLabel>
            <Select
              labelId="customer-item-rows-select-label"
              id="customer-item-rows-select"
              value={dateDiff}
              label="Time Period"
              onChange={(ev) => setDateDiff(Number(ev.target.value))}
            >
              <MenuItem value={0}>Today</MenuItem>
              <MenuItem value={7}>Last 7 Days</MenuItem>
              <MenuItem value={14}>Last 14 Days</MenuItem>
              <MenuItem value={30}>Last 30 Days</MenuItem>
              <MenuItem value={90}>Last 90 Days</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>
      <Grid container>
        <Grid item xs={12} md={8} lg={9}>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="method__name" />
              <PolarRadiusAxis />
              <Tooltip content={CustomTooltipRadarChart} />
              <Legend verticalAlign="top" />
              <Radar
                name="Sales amount"
                dataKey="total"
                stroke={theme.palette.primary.dark}
                fill={theme.palette.primary.light}
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Grid>
        <Grid item xs={12} md={4} lg={3}>
          <Stack gap={2}>
            <AccentCard
              sx={{
                px: 3,
                py: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body1" textAlign="center">
                Total Bills
              </Typography>
              <Typography variant="h3" textAlign="center">
                {salesData.count.toLocaleString("en-IN")}
              </Typography>

              {(() => {
                var inc =
                  ((salesData.count - salesData.pCount) /
                    (salesData.pCount || 1)) *
                  100;
                const isNegative = Math.abs(inc) !== inc;
                inc = roundOff(isNegative ? -inc : inc);
                return (
                  <Typography
                    component="span"
                    textAlign="center"
                    px={1}
                    color={(theme) =>
                      isNegative
                        ? theme.palette.error.main
                        : theme.palette.success.main
                    }
                    fontWeight={600}
                  >
                    ({isNegative ? "-" : "+"}
                    {inc}%)
                  </Typography>
                );
              })()}
            </AccentCard>
            <AccentCard
              sx={{
                px: 3,
                py: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body1" textAlign="center">
                Total Sales Amount
              </Typography>
              <Typography variant="h3" textAlign="center">
                ₹{(salesData.sum || 0).toLocaleString("en-IN")}
              </Typography>
              {(() => {
                var inc =
                  ((salesData.sum - salesData.pSum) / (salesData.pSum || 1)) *
                  100;
                const isNegative = Math.abs(inc) !== inc;
                inc = roundOff(isNegative ? -inc : inc);
                return (
                  <Typography
                    component="span"
                    textAlign="center"
                    px={1}
                    color={(theme) =>
                      isNegative
                        ? theme.palette.error.main
                        : theme.palette.success.main
                    }
                    fontWeight={600}
                  >
                    ({isNegative ? "-" : "+"}
                    {inc}%)
                  </Typography>
                );
              })()}
            </AccentCard>
            <AccentCard
              sx={{
                px: 3,
                py: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body1" textAlign="center">
                Total Items
              </Typography>
              <Typography variant="h3" textAlign="center">
                {(salesData.itemCount).toLocaleString(
                  "en-IN"
                )}
              </Typography>
              {(() => {
                var inc =
                  ((salesData.itemCount -
                    salesData.pItemCount) /
                    (salesData.pItemCount || 1)) *
                  100;
                const isNegative = Math.abs(inc) !== inc;
                inc = roundOff(isNegative ? -inc : inc);
                return (
                  <Typography
                    component="span"
                    textAlign="center"
                    px={1}
                    color={(theme) =>
                      isNegative
                        ? theme.palette.error.main
                        : theme.palette.success.main
                    }
                    fontWeight={600}
                  >
                    ({isNegative ? "-" : "+"}
                    {inc}%)
                  </Typography>
                );
              })()}
            </AccentCard>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
