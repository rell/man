import "bootstrap/dist/css/bootstrap.min.css";
import "leaflet/dist/leaflet.css";
import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";

const rootCont = document.getElementById("root");
if (rootCont) {
  const root = createRoot(rootCont);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
