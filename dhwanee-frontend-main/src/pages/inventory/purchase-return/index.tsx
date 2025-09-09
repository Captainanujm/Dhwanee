import { AddTwoTone, FolderOpenTwoTone } from "@mui/icons-material";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";

export default function NewBill() {
  const [currentPage, setCurrentPage] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    if (/.+\/old\/?/.test(pathname) || /.+\/[0-9]+\/?/.test(pathname))
      setCurrentPage(1);
    else setCurrentPage(0);
  }, [pathname]);

  return (
    <>
      <Typography variant="h1" color="primary">
        Purchase Returns
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={currentPage}
          onChange={(evt, newVal) => setCurrentPage(newVal)}
        >
          <Tab
            label="Create New"
            icon={<AddTwoTone />}
            iconPosition="start"
            component={Link}
            to="/store/inventory/purchase-return/"
          />
          <Tab
            label="Browse Old"
            icon={<FolderOpenTwoTone />}
            iconPosition="start"
            component={Link}
            to="/store/inventory/purchase-return/old"
          />
        </Tabs>
      </Box>
        <Outlet />
    </>
  );
}
