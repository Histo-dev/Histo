import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./index.css";
import HistoIntro from "./components/Home/HistoIntro";
import Loading from "./components/Home/Loading";
import Analysis from "./components/Analysis/Analysis";
import { UsageProvider } from "./store/UsageContext";

const MIN_LOADING_MS = 1000;

// 로그인 상태 확인
const checkLoginStatus = async (): Promise<boolean> => {
  if (typeof chrome === "undefined" || !chrome.storage) return false;

  const result = await chrome.storage.local.get(["isLoggedIn"]);
  return result.isLoggedIn === true;
};

function PopUpRoutes({ onRefresh }: { onRefresh: () => void }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const startAnalysis = () => {
    setIsLoading(true);
    const start = Date.now();

    chrome.runtime.sendMessage({ action: "start-analysis" }, (response) => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);

      setTimeout(() => {
        if (response?.ok) {
          // Trigger data reload in UsageProvider
          onRefresh();
          // Give time for data to load before navigating
          setTimeout(() => {
            setIsLoading(false);
            navigate("/analysis/overview");
          }, 300);
        } else {
          // 에러 처리
          console.error("[popup] analysis failed:", response?.error);
          setIsLoading(false);
          onRefresh();
          navigate("/analysis/overview");
        }
      }, remaining);
    });
  };

  const viewSavedAnalysis = () => {
    // Just refresh data (GET only, no POST) and navigate
    onRefresh();
    navigate("/analysis/overview");
  };

  if (isLoading) return <Loading />;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HistoIntro onStart={startAnalysis} onViewSaved={viewSavedAnalysis} />
        }
      />
      <Route
        path="/analysis/*"
        element={<Analysis onBack={() => navigate("/")} />}
      />
    </Routes>
  );
}

function PopUpApp() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // 로그인 상태 확인
    checkLoginStatus().then((isLoggedIn) => {
      if (!isLoggedIn) {
        // 로그인 안 되어 있으면 login.html로 리다이렉트
        window.location.href = "./login.html";
      } else {
        setIsCheckingAuth(false);
      }
    });
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="extension-root">
        <div className="extension-panel">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <UsageProvider triggerRefresh={refreshTrigger}>
      <div className="extension-root">
        <div className="extension-panel">
          <MemoryRouter>
            <PopUpRoutes
              onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
            />
          </MemoryRouter>
        </div>
      </div>
    </UsageProvider>
  );
}

createRoot(document.getElementById("root")!).render(<PopUpApp />);
