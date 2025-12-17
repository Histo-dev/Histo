import { useRef } from "react";
import html2canvas from "html2canvas";
import styles from "./Analysis.module.css";
import Header from "./AnalysisMeta/Header";
import InnerTabs, { type TabKey } from "./InnerTabs";
import StatCards from "./AnalysisMeta/StatCards";
import { useLocation, useNavigate, Routes, Route } from "react-router-dom";
import Overview from "./Overview/Overview";
import TopN from "./TopN/TopN";
import Detail from "./Detail/Detail";
import Advice from "./Advice/Advice";

type Props = {
  onBack?: () => void;
};

export default function Analysis({ onBack }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = location.pathname.split("/").pop() || "overview";
  const captureRef = useRef<HTMLDivElement>(null);

  const changeTab = (t: TabKey) => navigate(`/analysis/${t}`);

  const downloadImage = async () => {
    if (!captureRef.current) return;

    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        ignoreElements: (element) => {
          // 문제가 될 수 있는 요소 제외
          return element.classList?.contains("recharts-surface") || false;
        },
        onclone: (clonedDoc) => {
          // 그라디언트가 있는 요소들의 스타일 단순화
          const elements = clonedDoc.querySelectorAll("*");
          elements.forEach((el: any) => {
            const style = window.getComputedStyle(el);
            if (
              style.backgroundImage &&
              style.backgroundImage.includes("gradient")
            ) {
              // 그라디언트를 단색으로 대체
              el.style.backgroundImage = "none";
              el.style.backgroundColor = style.backgroundColor || "#ffffff";
            }
          });
        },
      });

      // 패딩을 추가한 새 캔버스 생성
      const padding = 40;
      const paddedCanvas = document.createElement("canvas");
      paddedCanvas.width = canvas.width + padding * 2;
      paddedCanvas.height = canvas.height + padding * 2;
      const ctx = paddedCanvas.getContext("2d");

      if (ctx) {
        // 배경색 채우기
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
        // 원본 이미지를 패딩만큼 떨어진 위치에 그리기
        ctx.drawImage(canvas, padding, padding);
      }

      const link = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      link.download = `histo-${currentTab}-${date}.png`;
      link.href = paddedCanvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("이미지 저장 실패:", error);
      alert("이미지 저장에 실패했습니다.");
    }
  };

  const copyToClipboard = async () => {
    if (!captureRef.current) return;

    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        ignoreElements: (element) => {
          // 문제가 될 수 있는 요소 제외
          return element.classList?.contains("recharts-surface") || false;
        },
        onclone: (clonedDoc) => {
          // 그라디언트가 있는 요소들의 스타일 단순화
          const elements = clonedDoc.querySelectorAll("*");
          elements.forEach((el: any) => {
            const style = window.getComputedStyle(el);
            if (
              style.backgroundImage &&
              style.backgroundImage.includes("gradient")
            ) {
              // 그라디언트를 단색으로 대체
              el.style.backgroundImage = "none";
              el.style.backgroundColor = style.backgroundColor || "#ffffff";
            }
          });
        },
      });

      // 패딩을 추가한 새 캔버스 생성
      const padding = 40;
      const paddedCanvas = document.createElement("canvas");
      paddedCanvas.width = canvas.width + padding * 2;
      paddedCanvas.height = canvas.height + padding * 2;
      const ctx = paddedCanvas.getContext("2d");

      if (ctx) {
        // 배경색 채우기
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
        // 원본 이미지를 패딩만큼 떨어진 위치에 그리기
        ctx.drawImage(canvas, padding, padding);
      }

      paddedCanvas.toBlob(async (blob) => {
        if (!blob) {
          alert("이미지 변환에 실패했습니다.");
          return;
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          alert("클립보드에 복사되었습니다! 🎉");
        } catch (err) {
          console.error("클립보드 복사 실패:", err);
          alert("클립보드 복사에 실패했습니다.");
        }
      });
    } catch (error) {
      console.error("이미지 생성 실패:", error);
      alert("이미지 생성에 실패했습니다.");
    }
  };

  // Detail 페이지는 전체 화면으로 렌더링
  const isDetailPage = currentTab === "detail";

  if (isDetailPage) {
    return (
      <Routes>
        <Route path="detail" element={<Detail />} />
      </Routes>
    );
  }

  return (
    <div className={styles.shell}>
      <div ref={captureRef}>
        <div className={styles.headerWrapper}>
          <Header
            onBack={onBack}
            title="브라우저 활동"
            subtitle="오늘의 웹 사용 분석"
            icon="network.svg"
          />
          <div className={styles.actionButtons}>
            <button
              className={styles.copyBtn}
              onClick={copyToClipboard}
              title="클립보드에 복사"
            >
              📋 복사
            </button>
            <button
              className={styles.downloadBtn}
              onClick={downloadImage}
              title="이미지로 저장"
            >
              📷 저장
            </button>
          </div>
        </div>
        <StatCards />
        <InnerTabs
          selected={currentTab as TabKey}
          onSelect={(t) => changeTab(t)}
        />

        <Routes>
          <Route path="overview" element={<Overview />} />
          <Route path="topN" element={<TopN />} />
          <Route path="advice" element={<Advice />} />
        </Routes>
      </div>
    </div>
  );
}
