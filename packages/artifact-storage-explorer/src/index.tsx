import "./styles/app.css";
import { autoMount } from "./auto-mount.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => queueMicrotask(autoMount));
} else {
  queueMicrotask(autoMount);
}
