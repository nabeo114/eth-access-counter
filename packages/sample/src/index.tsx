
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import { MetamaskProvider } from "./contexts/MetamaskContext";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <MetamaskProvider>
      <App />
    </MetamaskProvider>
  );
}
