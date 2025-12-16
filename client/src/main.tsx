import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

function DevPreview() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
      }}
    >
      <div style={{ padding: 20, background: "#fff", borderRadius: 12 }}>
        <h2>Histo Dev Preview</h2>
        <p>Use popup.html or options.html</p>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DevPreview />
  </StrictMode>
);
