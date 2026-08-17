import React from "react";
import { createRoot } from "react-dom/client";
import Perde from "../app/page";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Perde uygulama alanı oluşturulamadı.");
}

createRoot(root).render(
  <React.StrictMode>
    <Perde />
  </React.StrictMode>,
);
