import { useState, useEffect } from 'react';
import { PWASettingsService, PWASettings } from '../services/pwaSettingsService';

export const usePWASettings = () => {
  const [settings, setSettings] = useState<PWASettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const pwaSettings = await PWASettingsService.getPWASettings();
      setSettings(pwaSettings);
      applyPWASettings(pwaSettings);
    } catch (error) {
      console.error('PWA 설정 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyPWASettings = (pwaSettings: PWASettings) => {
    // 매니페스트 링크 업데이트
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }

    // 동적 매니페스트 생성
    const manifest = {
      short_name: pwaSettings.appName,
      name: pwaSettings.appName,
      description: pwaSettings.appDescription,
      icons: [
        {
          src: pwaSettings.appIcon,
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: pwaSettings.appIcon,
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ],
      start_url: window.location.origin,
      scope: window.location.origin,
      display: "standalone",
      orientation: "portrait",
      theme_color: pwaSettings.themeColor,
      background_color: pwaSettings.backgroundColor,
      categories: ["business", "productivity"],
      lang: "ko",
      dir: "ltr"
    };

    // 매니페스트 파일을 Blob으로 생성하고 URL 생성
    const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json'
    });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    manifestLink.href = manifestUrl;

    // 테마 색상 메타 태그 업데이트
    let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = pwaSettings.themeColor;

    // 애플 모바일 웹 앱 메타 태그 업데이트
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.href = pwaSettings.appIcon;

    // 애플 모바일 웹 앱 제목 업데이트
    let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
    if (!appleTitleMeta) {
      appleTitleMeta = document.createElement('meta');
      appleTitleMeta.name = 'apple-mobile-web-app-title';
      document.head.appendChild(appleTitleMeta);
    }
    appleTitleMeta.content = pwaSettings.appName;

    // 애플 모바일 웹 앱 상태바 스타일 업데이트
    let appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
    if (!appleStatusBarMeta) {
      appleStatusBarMeta = document.createElement('meta');
      appleStatusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
      document.head.appendChild(appleStatusBarMeta);
    }
    appleStatusBarMeta.content = 'default';

    // 페이지 제목 업데이트
    document.title = pwaSettings.appName;

    // 파비콘 업데이트
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = pwaSettings.appIcon;
  };

  return {
    settings,
    loading,
    reload: loadSettings
  };
};
