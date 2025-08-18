import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Collapse,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  GetApp,
  Close,
  Smartphone,
  Computer,
  Android,
  Apple
} from '@mui/icons-material';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // PWA 설치 가능 여부 확인
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowGuide(true);
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA 설치됨');
        setIsInstalled(true);
        setShowInstallButton(false);
      }
    } catch (error) {
      console.error('PWA 설치 실패:', error);
      setShowGuide(true);
    }
    
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowInstallButton(false);
    setShowGuide(false);
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* 설치 버튼 */}
      {showInstallButton && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: '90%',
            maxWidth: 400
          }}
        >
          <Card sx={{ boxShadow: 3 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <GetApp sx={{ mr: 1 }} />
                  앱 설치
                </Typography>
                <IconButton size="small" onClick={handleClose}>
                  <Close />
                </IconButton>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                더 나은 사용자 경험을 위해 앱을 설치하세요
              </Typography>
              <Button
                variant="contained"
                fullWidth
                startIcon={<GetApp />}
                onClick={handleInstallClick}
                sx={{ mb: 1 }}
              >
                앱 설치하기
              </Button>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                onClick={() => setShowGuide(true)}
              >
                설치 방법 보기
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* 설치 가이드 */}
      <Collapse in={showGuide}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.8)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2
          }}
        >
          <Card sx={{ maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                  <GetApp sx={{ mr: 1 }} />
                  앱 설치 방법
                </Typography>
                <IconButton onClick={handleClose}>
                  <Close />
                </IconButton>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                브라우저에 따라 설치 방법이 다릅니다
              </Alert>

              <List>
                {/* Android Chrome */}
                <ListItem>
                  <ListItemIcon>
                    <Android />
                  </ListItemIcon>
                  <ListItemText
                    primary="Android Chrome"
                    secondary="주소창 옆의 설치 아이콘(📱) 클릭 → '홈 화면에 추가' 선택"
                  />
                </ListItem>

                {/* iPhone Safari */}
                <ListItem>
                  <ListItemIcon>
                    <Apple />
                  </ListItemIcon>
                  <ListItemText
                    primary="iPhone Safari"
                    secondary="공유 버튼(📤) 클릭 → '홈 화면에 추가' 선택"
                  />
                </ListItem>

                {/* 데스크톱 Chrome */}
                <ListItem>
                  <ListItemIcon>
                    <Computer />
                  </ListItemIcon>
                  <ListItemText
                    primary="데스크톱 Chrome"
                    secondary="주소창 옆의 설치 아이콘(📱) 클릭 → '앱 설치' 선택"
                  />
                </ListItem>

                {/* 기타 브라우저 */}
                <ListItem>
                  <ListItemIcon>
                    <Computer />
                  </ListItemIcon>
                  <ListItemText
                    primary="기타 브라우저"
                    secondary="메뉴에서 '홈 화면에 추가' 또는 '앱 설치' 옵션 찾기"
                  />
                </ListItem>
              </List>

              <Button
                variant="contained"
                fullWidth
                onClick={handleClose}
                sx={{ mt: 2 }}
              >
                확인
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Collapse>
    </>
  );
};

export default InstallPWA;
