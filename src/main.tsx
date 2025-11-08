import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { RouterProvider } from "./components/common/Router";
import "./index.css";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider>
    <App />
    </RouterProvider>
  </React.StrictMode>
);