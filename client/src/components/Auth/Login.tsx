import { useState } from "react";
import styles from "./Login.module.css";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // TODO: Google OAuth 로그인 구현
      console.log("Google login clicked");

      // 임시: 로그인 성공 시뮬레이션 (1초 후)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 로그인 성공 표시를 storage에 저장
      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.local.set({
          isLoggedIn: true,
          loginTime: Date.now(),
        });
      }

      // Popup 환경에서는 popup.html로 리다이렉트
      window.location.href = "./popup.html";
    } catch (error) {
      console.error("Login failed:", error);
      alert("로그인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.icon}>
            <svg viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#7c63ff" />
              <path
                d="M16 18h4v12h-4zm6 0h4v12h-4zm6 0h4v12h-4z"
                fill="white"
              />
            </svg>
          </div>
          <h1 className={styles.title}>브라우저 활동 분석</h1>
          <p className={styles.subtitle}>
            웹 사용 패턴을 분석하여 생산성을 높이세요
          </p>
        </div>

        <button
          className={styles.googleButton}
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {!isLoading ? (
            <>
              <svg viewBox="0 0 24 24" className={styles.googleIcon}>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google 계정으로 로그인
            </>
          ) : (
            <>
              <div className={styles.spinner}></div>
              로그인 중...
            </>
          )}
        </button>

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📊</div>
            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>카테고리별 분석</h3>
              <p className={styles.featureText}>
                소셜미디어, 개발, 뉴스 등 카테고리별 웹 사용 시간 확인
              </p>
            </div>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>🏆</div>
            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>TOP 3 사이트</h3>
              <p className={styles.featureText}>
                가장 많이 방문한 사이트 순위와 시간 추적
              </p>
            </div>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>☁️</div>
            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>클라우드 동기화</h3>
              <p className={styles.featureText}>
                안전한 서버에 저장되어 모든 기기에서 확인 가능
              </p>
            </div>
          </div>
        </div>

        <p className={styles.footer}>
          로그인하면{" "}
          <a href="#" className={styles.link}>
            서비스 약관
          </a>{" "}
          및{" "}
          <a href="#" className={styles.link}>
            개인정보처리방침
          </a>
          에 동의하게 됩니다
        </p>
      </div>
    </div>
  );
}
