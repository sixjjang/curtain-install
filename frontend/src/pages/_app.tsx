import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // PWA Install Prompt
    let deferredPrompt: any;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button or notification
      console.log('PWA install prompt available');
    });

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      deferredPrompt = null;
    });

    // Service Worker Registration for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <>
      <Head>
        <title>커튼 설치 매칭 - 전문 시공기사 매칭 플랫폼</title>
        <meta name="description" content="전문 시공기사와 고객을 연결하는 커튼 설치 매칭 플랫폼입니다. 간편한 견적 요청부터 전문적인 시공까지 모든 과정을 관리해드립니다." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="커튼매칭" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="커튼 설치 매칭" />
        
        {/* PWA Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Kakao SDK */}
        <script src="https://developers.kakao.com/sdk/js/kakao.js"></script>
        
        {/* Naver SDK */}
        <script src="https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js"></script>
        
        {/* Open Graph */}
        <meta property="og:title" content="커튼 설치 매칭" />
        <meta property="og:description" content="전문 시공기사와 고객을 연결하는 커튼 설치 매칭 플랫폼" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ko_KR" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="커튼 설치 매칭" />
        <meta name="twitter:description" content="전문 시공기사와 고객을 연결하는 커튼 설치 매칭 플랫폼" />
        
        {/* Additional mobile optimizations */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Prevent zoom on input focus for iOS */}
        <style jsx global>{`
          input[type="text"],
          input[type="email"],
          input[type="password"],
          input[type="number"],
          input[type="tel"],
          textarea,
          select {
            font-size: 16px !important;
          }
          
          /* Prevent pull-to-refresh on mobile */
          html, body {
            overscroll-behavior: none;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Smooth scrolling */
          html {
            scroll-behavior: smooth;
          }
          
          /* Better touch targets */
          button, a, input, select, textarea {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Prevent text selection on buttons */
          button {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
        `}</style>
      </Head>
      <Component {...pageProps} />
    </>
  );
} 