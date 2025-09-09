import { ReactNode, Suspense, useState } from "react";
import { styled, Theme, CSSObject } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import {
  ExpandLess,
  ExpandMore,
  PeopleOutlineTwoTone,
  BadgeTwoTone,
  LocalShippingTwoTone,
  ShoppingCartTwoTone,
  Inventory2TwoTone,
  BookmarksTwoTone,
  AddTwoTone,
  FolderTwoTone,
  CurrencyRupeeTwoTone,
  AccountBalanceWalletTwoTone,
  RemoveCircleTwoTone,
  PollTwoTone,
  ReceiptLongTwoTone,
  PrintTwoTone,
  StyleTwoTone,
  StorefrontTwoTone,
  Diversity1TwoTone,
  CheckCircleTwoTone,
  AddShoppingCartTwoTone,
  PaymentTwoTone,
  LabelTwoTone,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { logout } from "src/redux/auth-reducer";
import {
  Collapse,
  ListItemAvatar,
  ListItemSecondaryAction,
} from "@mui/material";
import { Link, Outlet, useNavigate } from "react-router-dom";
import verifyJwt from "src/utils/verify-jwt";
import StringAvatar from "src/components/string-avatar";
import MD3Button from "src/components/md3-button";
import PageLoadingSkeleton from "./page-loading-skeleton";

const drawerWidth = 300;

interface ListItemType {
  name: string;
  icon: ReactNode;
  path?: string;
  sublists?: ListItemType[];
}

const allUserOptions: ListItemType[] = [
  {
    name: "Home",
    icon: <StorefrontTwoTone />,
    path: "/",
  },
  {
    name: "People",
    icon: <PeopleOutlineTwoTone />,
    sublists: [
      {
        name: "Customers",
        icon: <Diversity1TwoTone />,
        path: "/people/customers",
      },
      {
        name: "Staff",
        icon: <BadgeTwoTone />,
      },
      {
        name: "Suppliers",
        icon: <LocalShippingTwoTone />,
        path: "/people/suppliers",
      },
    ],
  },
  {
    name: "Inventory",
    icon: <Inventory2TwoTone />,
    sublists: [
      {
        name: "Products",
        icon: <ShoppingCartTwoTone />,
        path: "/inventory/products",
      },
      {
        name: "Brands",
        icon: <StyleTwoTone />,
        path: "/inventory/brands",
      },
      {
        name: "Categories",
        icon: <BookmarksTwoTone />,
        path: "/inventory/categories",
      },
      {
        name: "Print Labels",
        icon: <PrintTwoTone />,
        path: "/inventory/print-labels",
      },
      // {
      //   name: "Initial Inventory",
      //   icon: <AddCircleTwoTone />,
      //   path: "/inventory/initial-stock",
      // },
      {
        name: "Add Inventory",
        icon: <LocalShippingTwoTone />,
        path: "/inventory/supplier-invoice",
      },
    ],
  },
  {
    name: "Sales",
    icon: <ReceiptLongTwoTone />,
    sublists: [
      {
        name: "New Bill",
        icon: <AddTwoTone />,
        path: "/billing/new",
      },
      {
        name: "Old Bills",
        icon: <FolderTwoTone />,
        path: "/billing/old",
      },
      {
        name: "New Challan",
        icon: <AddShoppingCartTwoTone />,
        path: "/billing/challan/new",
      },
      {
        name: "Delivery Challans",
        icon: <LocalShippingTwoTone />,
        path: "/billing/challan",
      },
    ],
  },
  {
    name: "Reports",
    icon: <PollTwoTone />,
    sublists: [
      {
        name: "By Day",
        icon: <PollTwoTone />,
        path: "/reports/day/",
      },
      {
        name: "GST Report",
        icon: <PollTwoTone />,
        path: "/reports/gst/",
      },
    ],
  },
  {
    name: "Accounting",
    icon: <CurrencyRupeeTwoTone />,
    sublists: [
      {
        name: "Overview",
        icon: <CheckCircleTwoTone />,
        path: "/accounting/overview"
      },
      {
        name: "Accounts",
        icon: <AccountBalanceWalletTwoTone />,
        path: "/accounting/accounts"
      },
      {
        name: "Labels",
        icon: <LabelTwoTone />,
        path: "/accounting/labels"
      },
      {
        name: "Payment Methods",
        icon: <PaymentTwoTone />,
        path: "/accounting/methods"
      },
      {
        name: "Expenses",
        icon: <RemoveCircleTwoTone />,
      },
    ],
  },
];

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

function ExpandableListItem(props: {
  title: string;
  icon: React.ReactNode;
  path?: string;
  menuopen: boolean;
  sublist: ListItemType[];
  level: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListItemButton
        onClick={() => setOpen(!open)}
        sx={{
          minHeight: 48,
          justifyContent: props.menuopen ? "initial" : "center",
          pr: 2.5,
          ml: props.level * 2,
        }}
        selected={window.window.location.pathname === props.path}
      >
        <ListItemIcon
          sx={(theme) => ({
            minWidth: 0,
            mr: props.menuopen ? 3 : "auto",
            justifyContent: "center",
            color: open ? theme.palette.primary.main : "default",
          })}
        >
          {props.icon}
        </ListItemIcon>
        <ListItemText
          primary={props.title}
          sx={{ opacity: props.menuopen ? 1 : 0 }}
        />
        {open ? (
          <ExpandLess sx={{ display: props.menuopen ? "block" : "none" }} />
        ) : (
          <ExpandMore sx={{ display: props.menuopen ? "block" : "none" }} />
        )}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {props.sublist.map((sublistitem, index) =>
            sublistitem.sublists ? (
              <ExpandableListItem
                key={sublistitem.name}
                title={sublistitem.name}
                icon={sublistitem.icon}
                path={sublistitem.path}
                sublist={sublistitem.sublists}
                menuopen={props.menuopen}
                level={props.level + 1}
              />
            ) : (
              <Link
                to={sublistitem.path || "#"}
                style={{ color: "black", textDecoration: "none" }}
                key={sublistitem.name}
              >
                <ListItemButton
                  sx={{ ml: (props.level + 1) * 2 }}
                  key={index}
                  selected={window.location.pathname === sublistitem.path}
                >
                  <ListItemIcon
                    sx={(theme) => ({
                      color:
                        window.location.pathname === sublistitem.path
                          ? theme.palette.primary.light
                          : "default",
                    })}
                  >
                    {sublistitem.icon}
                  </ListItemIcon>
                  <ListItemText primary={sublistitem.name} />
                </ListItemButton>
              </Link>
            )
          )}
        </List>
      </Collapse>
    </>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);

  // dont show navbar if not logged in
  if (
    auth.tokens === undefined ||
    auth.body === undefined ||
    verifyJwt(auth.tokens) !== 1
  ) {
    return <Outlet />;
  }

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={open ? { display: "none" } : {}}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            onClick={handleDrawerClose}
            sx={!open ? { display: "none" } : {}}
          >
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <List>
          {allUserOptions.map((item) =>
            item.sublists ? (
              <ExpandableListItem
                key={item.name}
                title={item.name}
                icon={item.icon}
                path={item.path}
                sublist={item.sublists}
                menuopen={open}
                level={0}
              />
            ) : (
              <Link
                to={item.path || "#"}
                style={{ color: "black", textDecoration: "none" }}
                key={item.name}
              >
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? "initial" : "center",
                    px: 2.5,
                  }}
                  selected={window.location.pathname === item.path}
                >
                  <ListItemIcon
                    sx={(theme) => ({
                      minWidth: 0,
                      mr: open ? 3 : "auto",
                      justifyContent: "center",
                      color:
                        window.location.pathname === item.path
                          ? theme.palette.primary.light
                          : "default",
                    })}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    sx={{ opacity: open ? 1 : 0 }}
                  />
                </ListItemButton>
              </Link>
            )
          )}
        </List>
        <div style={{ flexGrow: 1 }}></div>
        <List>
          <ListItem
            disablePadding
            sx={{
              minHeight: 48,
              justifyContent: open ? "initial" : "center",
              px: 2.5,
            }}
          >
            <ListItemAvatar
              sx={{
                minWidth: 0,
                mr: open ? 3 : "auto",
                justifyContent: "center",
              }}
            >
              <StringAvatar>{auth.body.user_name}</StringAvatar>
            </ListItemAvatar>
            <ListItemText
              primary={auth.body.user_name}
              secondary={
                auth.body.branch.length > 1
                  ? auth.body.branch.length + " branches"
                  : auth.body.branch[0].name + " branch"
              }
              sx={{ opacity: open ? 1 : 0 }}
            />
            <ListItemSecondaryAction sx={{ display: open ? "block" : "none" }}>
              <MD3Button
                variant="filledTonal"
                onClick={(evt) => {
                  evt.preventDefault();
                  dispatch(logout());
                  navigate("/login");
                }}
                size="small"
              >
                Logout
              </MD3Button>
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Suspense fallback={<PageLoadingSkeleton />}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
}
