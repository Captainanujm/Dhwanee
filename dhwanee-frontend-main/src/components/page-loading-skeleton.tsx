import { Box, Skeleton } from "@mui/material";

export default function LoadingState() {
  return (
    <Box sx={{ height: "100vh" }}>
      <Skeleton
        animation="wave"
        variant="rounded"
        width="30%"
        height={20}
        sx={{ my: 1 }}
      />
      <Skeleton
        animation="wave"
        variant="rounded"
        width="50%"
        height={100}
        sx={{ my: 1 }}
      />
      <Skeleton
        animation="wave"
        variant="rounded"
        width="20%"
        height={30}
        sx={{ my: 1 }}
      />
      <Box sx={{ display: "flex", mt: 3 }}>
        <Skeleton
          animation="wave"
          variant="rounded"
          width="30%"
          height="60vh"
          sx={{ mr: 1 }}
        />
        <Skeleton
          animation="wave"
          variant="rounded"
          width="70%"
          height="60vh"
          sx={{ ml: 1 }}
        />
      </Box>
    </Box>
  );
}
