import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Switch,
  FormControlLabel,
  LinearProgress
} from '@mui/material';
import { 
  Storage, 
  CheckCircle, 
  Error, 
  Info, 
  Warning,
  Link as LinkIcon,
  ExpandMore,
  CloudUpload,
  Settings,
  Security,
  Refresh,
  CloudOff
} from '@mui/icons-material';
import { StorageService } from '../services/storageService';

const FirebaseStorageGuide: React.FC = () => {
  const [corsStatus, setCorsStatus] = useState(StorageService.getCORSStatus());
  const [forceLocalMode, setForceLocalMode] = useState(corsStatus.forceLocalMode);

  // CORS 상태 모니터링
  useEffect(() => {
    const interval = setInterval(() => {
      const status = StorageService.getCORSStatus();
      setCorsStatus(status);
      setForceLocalMode(status.forceLocalMode);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleForceLocalMode = (enabled: boolean) => {
    if (enabled) {
      // 강제 로컬 모드 활성화
      StorageService.resetCORSStatus();
      const status = StorageService.getCORSStatus();
      status.forceLocalMode = true;
      setForceLocalMode(true);
      setCorsStatus(status);
    } else {
      // 강제 로컬 모드 비활성화
      StorageService.resetCORSStatus();
      setForceLocalMode(false);
      setCorsStatus(StorageService.getCORSStatus());
    }
  };

  const handleResetCORSStatus = () => {
    StorageService.resetCORSStatus();
    setCorsStatus(StorageService.getCORSStatus());
    setForceLocalMode(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Firebase Storage CORS 오류 해결 가이드
      </Typography>
      
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="body1">
          <strong>🚨 Firebase Storage CORS 오류가 발생하고 있습니다.</strong><br />
          이는 Firebase Storage가 제대로 설정되지 않았거나 CORS 설정에 문제가 있을 때 발생합니다.
        </Typography>
      </Alert>

      {/* CORS 상태 모니터링 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 CORS 오류 상태 모니터링
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              CORS 오류 발생 횟수: {corsStatus.errorCount} / {corsStatus.threshold}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(corsStatus.errorCount / corsStatus.threshold) * 100}
              sx={{ mb: 1 }}
            />
            {corsStatus.forceLocalMode && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                자동 로컬 모드가 활성화되었습니다.
              </Alert>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              icon={<Error />} 
              label={`CORS 오류: ${corsStatus.errorCount}회`} 
              color={corsStatus.errorCount > 0 ? "error" : "default"}
              sx={{ mr: 1, mb: 1 }} 
            />
            <Chip 
              icon={forceLocalMode ? <CloudOff /> : <CloudUpload />} 
              label={forceLocalMode ? "로컬 모드" : "서버 모드"} 
              color={forceLocalMode ? "warning" : "success"}
              sx={{ mr: 1, mb: 1 }} 
            />
            <Chip 
              icon={<CheckCircle />} 
              label="회원가입 가능" 
              color="success" 
              sx={{ mb: 1 }} 
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleResetCORSStatus}
              size="small"
            >
              CORS 상태 리셋
            </Button>
            <FormControlLabel
              control={
                <Switch
                  checked={forceLocalMode}
                  onChange={(e) => handleForceLocalMode(e.target.checked)}
                  color="warning"
                />
              }
              label="강제 로컬 모드"
            />
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 현재 상황
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>임시 해결책:</strong> 이미지 없이도 회원가입이 가능하며, 이미지는 로컬에 임시 저장됩니다.
            </Typography>
          </Alert>
          
          <Alert severity="success">
            <Typography variant="body2">
              <strong>회원가입:</strong> CORS 오류가 발생해도 회원가입은 정상적으로 진행됩니다.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">
            🔧 CORS 설정 방법 (관리자용)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" gutterBottom>
            <strong>방법 1: Firebase Console에서 설정 (권장)</strong>
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><LinkIcon /></ListItemIcon>
              <ListItemText 
                primary="Firebase Console 접속" 
                secondary="https://console.firebase.google.com/"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Settings /></ListItemIcon>
              <ListItemText 
                primary="프로젝트 선택" 
                secondary="curtain-install"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Storage /></ListItemIcon>
              <ListItemText 
                primary="Storage → Rules 탭으로 이동"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Security /></ListItemIcon>
              <ListItemText 
                primary="CORS 설정 추가"
                secondary="Storage Rules 아래에 CORS 설정을 추가하세요"
              />
            </ListItem>
          </List>
          
          <Typography variant="body2" sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <strong>CORS 설정 예시:</strong><br />
            <code>
              {`[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
  }
]`}
            </code>
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">
            🚨 즉시 해결 방법 (사용자용)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" gutterBottom>
            CORS 설정이 완료될 때까지 다음 방법을 사용할 수 있습니다:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText 
                primary="이미지 없이 회원가입" 
                secondary="프로필 이미지 없이도 회원가입이 가능합니다."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CloudUpload color="info" /></ListItemIcon>
              <ListItemText 
                primary="로컬 저장" 
                secondary="이미지는 브라우저에 임시 저장되어 사용할 수 있습니다."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Info color="warning" /></ListItemIcon>
              <ListItemText 
                primary="나중에 업로드" 
                secondary="CORS 설정 완료 후 프로필에서 이미지를 다시 업로드할 수 있습니다."
              />
            </ListItem>
          </List>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>강제 로컬 모드:</strong> 위의 스위치를 활성화하면 Firebase Storage 업로드를 완전히 건너뛰고 로컬에만 저장합니다.
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📝 현재 상태
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText 
                primary="이미지 최적화" 
                secondary="정상 작동"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText 
                primary="로컬 저장" 
                secondary="CORS 오류 시에도 dataURL로 저장"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText 
                primary="사용자 경험" 
                secondary="오류 없이 프로필 이미지 업로드 가능"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Warning color="warning" /></ListItemIcon>
              <ListItemText 
                primary="Firebase Storage" 
                secondary="CORS 설정 완료 후 활성화 예정"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔍 문제 해결
          </Typography>
          
          <Typography variant="body2" gutterBottom>
            CORS 설정 후에도 문제가 지속되면:
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemText primary="1. 브라우저 캐시 삭제" />
            </ListItem>
            <ListItem>
              <ListItemText primary="2. Firebase 프로젝트 설정 확인" />
            </ListItem>
            <ListItem>
              <ListItemText primary="3. Storage Rules 확인" />
            </ListItem>
            <ListItem>
              <ListItemText primary="4. 5-10분 대기 후 다시 시도 (설정 적용에 시간이 걸릴 수 있음)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="5. 강제 로컬 모드 활성화 (위의 스위치 사용)" />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FirebaseStorageGuide;
