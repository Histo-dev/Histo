import { createRoot } from "react-dom/client";
import "./index.css";
import DashboardColumn from "./components/Dashboard/DashboardColumn";
import { UsageProvider } from "./store/UsageContext";

function OptionsApp() {
  return (
    <UsageProvider>
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "40px 24px",
            minHeight: "100vh",
          }}
        >
          <header style={{ marginBottom: "32px" }}>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>
              Histo - 브라우저 활동 분석
            </h1>
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "14px",
                color: "var(--muted)",
              }}
            >
              일일 브라우징 활동을 추적하고 분석합니다
            </p>
          </header>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
            }}
          >
            {/* 왼쪽: 대시보드 */}
            <div>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "16px",
                }}
              >
                오늘의 활동
              </h2>
              <DashboardColumn />
            </div>

            {/* 오른쪽: 설정 */}
            <div>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "16px",
                }}
              >
                설정
              </h2>
              <div
                style={{
                  background: "var(--card-bg)",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "8px",
                    }}
                  >
                    분석 기간
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid rgba(43,41,82,0.08)",
                      borderRadius: "8px",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    <option>오늘</option>
                    <option>이번 주</option>
                    <option>이번 달</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "8px",
                    }}
                  >
                    알림
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    <input type="checkbox" defaultChecked />
                    특정 시간 초과 시 알림
                  </label>
                </div>

                <div>
                  <button
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      background: "#7c63ff",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    데이터 초기화
                  </button>
                </div>

                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "rgba(124, 99, 255, 0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--muted)",
                  }}
                >
                  <p
                    style={{ margin: 0, marginBottom: "6px", fontWeight: 600 }}
                  >
                    💡 팁
                  </p>
                  <p style={{ margin: 0 }}>
                    매일 자정에 데이터가 자동으로 저장되고 초기화됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UsageProvider>
  );
}

createRoot(document.getElementById("root")!).render(<OptionsApp />);
