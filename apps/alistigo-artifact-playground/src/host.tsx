import "./styles/host.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import HostPage from "./components/HostPage";

const el = document.getElementById("host-root");
if (el) {
  createRoot(el).render(
    <StrictMode>
      <HostPage />
    </StrictMode>,
  );
}
