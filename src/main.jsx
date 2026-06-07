import React from "react";
import { createRoot } from "react-dom/client";
import "../styles/styles.css";
import "@google/model-viewer";
import App from "./app.jsx";

createRoot(document.getElementById("root")).render(<App />);
