import { createRoot } from "react-dom/client";
import { useState } from "react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./index.css";
import HistoIntro from "./components/Home/HistoIntro";
import Loading from "./components/Home/Loading";
import Analysis from "./components/Analysis/Analysis";
import { UsageProvider } from "./store/UsageContext";

const MIN_LOADING_MS = 1000;

function PopUpRoutes() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const startAnalysis = () => {
    setIsLoading(true);
    const start = Date.now();

    chrome.runtime.sendMessage({ action: "start-analysis" }, () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      setTimeout(() => {
        setIsLoading(false);
        navigate("/analysis/overview");
      }, remaining);
    });
  };

  if (isLoading) return <Loading />;

  return (
    <Routes>
      <Route path="/" element={<HistoIntro onStart={startAnalysis} />} />
      <Route
        path="/analysis/*"
        element={<Analysis onBack={() => navigate("/")} />}
      />
    </Routes>
  );
}

function PopUpApp() {
  return (
    <UsageProvider>
      <div className="extension-root">
        <div className="extension-panel">
          <MemoryRouter>
            <PopUpRoutes />
          </MemoryRouter>
        </div>
      </div>
    </UsageProvider>
  );
}

createRoot(document.getElementById("root")!).render(<PopUpApp />);
