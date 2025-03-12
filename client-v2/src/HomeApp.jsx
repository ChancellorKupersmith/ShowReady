import React, { Suspense } from "react";
import { ThemeContextProvider } from "./views/Home/Theme.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/base.css";
import "./styles/theme.css";
import "./styles/layout/root.css";

const HomeView = React.lazy(() => import("./views/Home/HomeView.jsx"));

function HomeApp() {
  return (
    <ThemeContextProvider>
    <Suspense fallback={<div>Loading...</div>}>
        <ToastContainer />
        <HomeView />
    </Suspense>
    </ThemeContextProvider>
  );
}

export default HomeApp;
