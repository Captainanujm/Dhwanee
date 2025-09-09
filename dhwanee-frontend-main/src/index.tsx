import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import theme from "./theme";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Loader from "src/components/loader";
import Navbar from "src/components/navbar";
import SnackBar from "src/components/snackbar";
import PageLoadingSkeleton from "src/components/page-loading-skeleton";
import StoreProvider from "src/redux/store-provider";

const Landing = lazy(() => import("src/pages/landing"));
const Login = lazy(() => import("src/pages/login"));

const Customers = lazy(() => import("src/pages/people/customers"));
const CustomerDetail = lazy(() => import("src/pages/people/customers/detail"));
const Suppliers = lazy(() => import("src/pages/people/suppliers"));
const SupplierDetail = lazy(() => import("src/pages/people/suppliers/detail"));
const SupplierInvoice = lazy(
  () => import("src/pages/people/suppliers/supplier-invoice")
);
const ViewSupplierInvoice = lazy(
  () => import("src/pages/people/suppliers/view-supplier-invoice")
);
const Products = lazy(() => import("src/pages/inventory/products"));
const ProductDetail = lazy(() => import("src/pages/inventory/products/detail"));
const Categories = lazy(() => import("src/pages/inventory/categories"));
const CategoryDetail = lazy(
  () => import("src/pages/inventory/categories/detail")
);
const InitialStock = lazy(() => import("src/pages/inventory/initial-stock"));
const InventoryOverView = lazy(() => import("src/pages/inventory/overview"));
const NewBill = lazy(() => import("src/pages/billing/new"));
const OldBillsList = lazy(() => import("src/pages/billing/view"));
const OldBillDetail = lazy(() => import("src/pages/billing/view/detail"));
const BillPrint = lazy(() => import("src/pages/billing/print-view"));
const SalesReturn = lazy(() => import("src/pages/billing/returns"));
const SalesReturnPrint = lazy(() => import("src/pages/billing/returns/print"));
const SalesReturnDetail = lazy(
  () => import("src/pages/billing/returns/detail")
);
const SalesReturnNew = lazy(() => import("src/pages/billing/returns/new"));
const PurchaseReturnIndex = lazy(
  () => import("src/pages/inventory/purchase-return/index")
);
const PurchaseReturnNew = lazy(
  () => import("src/pages/inventory/purchase-return/new")
);
const PurchaseReturnOld = lazy(
  () => import("src/pages/inventory/purchase-return/old")
);
const PurchaseReturnOldDetails = lazy(
  () => import("src/pages/inventory/purchase-return/old-detail")
);
const DayReport = lazy(() => import("src/pages/reports/day"));
const GSTReport = lazy(() => import("src/pages/reports/gst"));
const Accounts = lazy(() => import("src/pages/accounting/accounts"));
const AccountDetails = lazy(
  () => import("src/pages/accounting/accounts/details")
);
const PaymentMethods = lazy(
  () => import("src/pages/accounting/payment-method")
);
const PaymentMethodDetails = lazy(
  () => import("src/pages/accounting/payment-method/details")
);
const PaymentLabels = lazy(() => import("src/pages/accounting/labels"));
const PaymentLabelDetails = lazy(
  () => import("src/pages/accounting/labels/details")
);
const AccountingOverview = lazy(() => import("src/pages/accounting/overview"));


const OldChallansList = lazy(() => import("src/pages/billing/challan"));
const CreateNewChallan = lazy(() => import("src/pages/billing/challan/new"));
const EditChallan = lazy(() => import("src/pages/billing/challan/edit"));
const ConvertChallan = lazy(() => import("src/pages/billing/challan/convert"));
const OldChallanDetail = lazy(() => import("src/pages/billing/challan/detail"));
const OldChallanPrint = lazy(() => import("src/pages/billing/challan/print-view"));

var routes = [
  {
    path: "/billing/print/:id",
    element: <BillPrint />,
  },
  {
    path: "billing/challan/print/:id",
    element: <OldChallanPrint />
  },
  {
    path: "/billing/returns/print/:id",
    element: <SalesReturnPrint />,
  },
  {
    path: "/",
    element: <Navbar />,
    children: [
      {
        path: "",
        element: <Landing />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "inventory",
        children: [
          {
            path: "overview",
            element: <InventoryOverView />,
          },
          {
            path: "products",
            element: <Products />,
            children: [
              {
                path: ":id",
                element: <ProductDetail />,
              },
            ],
          },
          {
            path: "categories",
            element: <Categories />,
            children: [
              {
                path: ":id",
                element: <CategoryDetail />,
              },
            ],
          },
          {
            path: "initial-stock",
            element: <InitialStock />,
          },
          {
            path: "supplier-invoice",
            element: <SupplierInvoice />,
          },
          {
            path: "supplier-invoice/view/:id",
            element: <ViewSupplierInvoice />,
          },
          {
            path: "purchase-return",
            element: <PurchaseReturnIndex />,
            children: [
              {
                path: "",
                element: <PurchaseReturnNew />,
              },
              {
                path: "old",
                element: <PurchaseReturnOld />,
                children: [
                  {
                    path: ":id",
                    element: <PurchaseReturnOldDetails />,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "people",
        children: [
          {
            path: "customers",
            element: <Customers />,
            children: [
              {
                path: ":id",
                element: <CustomerDetail />,
              },
            ],
          },
          {
            path: "suppliers",
            element: <Suppliers />,
            children: [
              {
                path: ":id",
                element: <SupplierDetail />,
              },
            ],
          },
        ],
      },
      {
        path: "billing",
        children: [
          {
            path: "old",
            element: <OldBillsList />,
            children: [
              {
                path: ":id",
                element: <OldBillDetail />,
              },
            ],
          },
          {
            path: "new",
            element: <NewBill />,
          },
          {
            path: "returns/new",
            element: <SalesReturnNew />,
          },
          {
            path: "returns",
            element: <SalesReturn />,
            children: [
              {
                path: ":id",
                element: <SalesReturnDetail />,
              },
            ],
          },
    
          {
            path: "challan",
            element: <OldChallansList />,
            children: [
              {
                path: ":id",
                element: <OldChallanDetail />
              }
            ]
          },
          {
            path: "challan/new",
            element: <CreateNewChallan />,
          },
          {
            path: "challan/edit/:id",
            element: <EditChallan />,
          },
          {
            path: "challan/convert/:id",
            element: <ConvertChallan />,
          },
        ]
      },
      {
        path: "reports",
        children: [
          {
            path: "day",
            element: <DayReport />,
          },
          {
            path: "gst",
            element: <GSTReport />,
          },
        ],
      },
      {
        path: "accounting",
        children: [
          {
            path: "accounts",
            element: <Accounts />,
            children: [
              {
                path: ":id",
                element: <AccountDetails />,
              },
            ],
          },
          {
            path: "methods",
            element: <PaymentMethods />,
            children: [
              {
                path: ":id",
                element: <PaymentMethodDetails />,
              },
            ],
          },
          {
            path: "labels",
            element: <PaymentLabels />,
            children: [
              {
                path: ":id",
                element: <PaymentLabelDetails />,
              },
            ],
          },
          {
            path: "overview",
            element: <AccountingOverview />,
          },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StoreProvider>
        <Loader />
        <SnackBar />
        <Suspense fallback={<PageLoadingSkeleton />}>
          <RouterProvider router={router} />
        </Suspense>
      </StoreProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
