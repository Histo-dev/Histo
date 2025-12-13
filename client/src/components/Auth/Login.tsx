import { useState } from 'react';
import { BACKEND_URL } from '../../config';
import styles from './Login.module.css';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Chrome Identity API로 Google OAuth 토큰 발급
      console.log('Requesting Google auth token...');

      if (typeof chrome === 'undefined' || !chrome.identity) {
        throw new Error('Chrome Identity API not available');
      }

      // interactive: true - 사용자에게 로그인 팝업 표시
      const result = await chrome.identity.getAuthToken({ interactive: true });

      if (!result || !result.token) {
        throw new Error('Failed to get auth token');
      }

      const accessToken = result.token;
      console.log('Access token received:', accessToken.substring(0, 20) + '...');

      // 백엔드로 accessToken 전송하여 JWT 발급받기
      const backendUrl = `${BACKEND_URL}/auth/google/login`;
      console.log('Sending access token to backend...');

      const backendResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}));
        throw new Error(
          `Backend authentication failed: ${errorData.message || backendResponse.statusText}`
        );
      }

      const backendData = await backendResponse.json();
      console.log('Backend response:', backendData);

      if (!backendData || !backendData.user) {
        throw new Error('Invalid backend response format');
      }

      // JWT 토큰과 사용자 정보를 storage에 저장
      await chrome.storage.local.set({
        isLoggedIn: true,
        loginTime: Date.now(),
        jwtToken: backendData.accessToken, // 백엔드에서 발급한 JWT
        user: {
          userId: backendData.user.userId, // 백엔드 DB의 user ID
          email: backendData.user.email,
          name: backendData.user.name,
        },
      });

      console.log('Login successful, redirecting to popup...');

      // Popup으로 리다이렉트
      window.location.href = './popup.html';
    } catch (error) {
      console.error('Login failed:', error);

      // 토큰 캐시 제거 후 재시도
      if (chrome.identity) {
        try {
          const cachedResult = await chrome.identity.getAuthToken({
            interactive: false,
          });
          if (cachedResult?.token) {
            await chrome.identity.removeCachedAuthToken({
              token: cachedResult.token,
            });
          }
        } catch (e) {
          console.error('Failed to clear cached token:', e);
        }
      }

      alert(
        '로그인에 실패했습니다. \n' +
          (error instanceof Error ? error.message : '다시 시도해주세요.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.icon}>
            <svg viewBox='0 0 48 48' fill='none'>
              <rect width='48' height='48' rx='12' fill='#7c63ff' />
              <path d='M16 18h4v12h-4zm6 0h4v12h-4zm6 0h4v12h-4z' fill='white' />
            </svg>
          </div>
          <h1 className={styles.title}>HISTO</h1>
          <p className={styles.subtitle}>웹 사용 패턴을 분석하여 생산성을 높이세요</p>
        </div>

        <button className={styles.googleButton} onClick={handleGoogleLogin} disabled={isLoading}>
          {!isLoading ? (
            <>
              <svg viewBox='0 0 24 24' className={styles.googleIcon}>
                <path
                  fill='#4285F4'
                  d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                />
                <path
                  fill='#34A853'
                  d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                />
                <path
                  fill='#FBBC05'
                  d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                />
                <path
                  fill='#EA4335'
                  d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
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

        <p className={styles.footer}>
          로그인하면{' '}
          <a href='#' className={styles.link}>
            서비스 약관
          </a>{' '}
          및{' '}
          <a href='#' className={styles.link}>
            개인정보처리방침
          </a>
          에 동의하게 됩니다
        </p>
      </div>
    </div>
  );
}
