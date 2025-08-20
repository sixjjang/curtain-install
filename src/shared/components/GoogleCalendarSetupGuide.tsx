import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip
} from '@mui/material';
import {
  ExpandMore,
  Google,
  Settings,
  Code,
  Security,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';

const GoogleCalendarSetupGuide: React.FC = () => {
  const [expanded, setExpanded] = useState<string | false>('panel1');

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const checkEnvironmentVariables = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI;

    return {
      clientId: clientId && clientId !== 'your_google_client_id_here',
      clientSecret: clientSecret && clientSecret !== 'your_google_client_secret_here',
      redirectUri: redirectUri && redirectUri !== 'http://localhost:3000/google-callback'
    };
  };

  const envStatus = checkEnvironmentVariables();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Google color="primary" />
        구글 캘린더 연동 설정 가이드
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        구글 캘린더 연동을 위해서는 Google Cloud Console에서 OAuth 2.0 클라이언트를 설정해야 합니다.
      </Alert>

      {/* 환경 변수 상태 확인 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings />
            환경 변수 설정 상태
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {envStatus.clientId ? (
                <CheckCircle color="success" />
              ) : (
                <Error color="error" />
              )}
              <Typography variant="body2">
                REACT_APP_GOOGLE_CLIENT_ID: {envStatus.clientId ? '설정됨' : '설정 필요'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {envStatus.clientSecret ? (
                <CheckCircle color="success" />
              ) : (
                <Error color="error" />
              )}
              <Typography variant="body2">
                REACT_APP_GOOGLE_CLIENT_SECRET: {envStatus.clientSecret ? '설정됨' : '설정 필요'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {envStatus.redirectUri ? (
                <CheckCircle color="success" />
              ) : (
                <Error color="error" />
              )}
              <Typography variant="body2">
                REACT_APP_GOOGLE_REDIRECT_URI: {envStatus.redirectUri ? '설정됨' : '기본값 사용'}
              </Typography>
            </Box>
          </Box>

          {!envStatus.clientId && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              구글 캘린더 연동을 사용하려면 .env 파일에 실제 구글 클라이언트 ID를 설정해야 합니다.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 설정 단계 */}
      <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Google />
            1단계: Google Cloud Console 설정
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemIcon>
                <Info color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Google Cloud Console 접속"
                secondary="https://console.cloud.google.com/ 에 접속하여 새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Settings color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Google Calendar API 활성화"
                secondary="'API 및 서비스' > '라이브러리'에서 'Google Calendar API'를 검색하고 활성화합니다."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Security color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="OAuth 2.0 클라이언트 ID 생성"
                secondary="'API 및 서비스' > '사용자 인증 정보'에서 'OAuth 클라이언트 ID'를 생성합니다."
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Code />
            2단계: OAuth 클라이언트 설정
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              OAuth 클라이언트 설정:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="애플리케이션 유형"
                  secondary="웹 애플리케이션"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="이름"
                  secondary="Construction Management Calendar"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="승인된 리디렉션 URI"
                  secondary={
                    <Box>
                      <Chip label="http://localhost:3000/google-callback" size="small" sx={{ mr: 1 }} />
                      <Chip label="https://curtain-install.firebaseapp.com/google-callback" size="small" />
                    </Box>
                  }
                />
              </ListItem>
            </List>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings />
            3단계: 환경 변수 설정
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle1" gutterBottom>
            .env 파일에 다음 내용을 추가하세요:
          </Typography>
          
          <Box sx={{ 
            bgcolor: 'grey.100', 
            p: 2, 
            borderRadius: 1, 
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            overflow: 'auto'
          }}>
            <Typography component="pre" sx={{ m: 0 }}>
{`# Google Calendar Configuration
REACT_APP_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
REACT_APP_GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/google-callback`}
            </Typography>
          </Box>
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>주의:</strong> 실제 클라이언트 ID와 시크릿으로 교체해야 합니다. 
              Google Cloud Console에서 생성한 값을 사용하세요.
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle />
            4단계: 테스트 및 확인
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemIcon>
                <Info color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="개발 서버 재시작"
                secondary="환경 변수를 변경한 후 npm start로 개발 서버를 재시작합니다."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Google color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="연동 테스트"
                secondary="시공자 캘린더 뷰에서 '구글 캘린더 연동' 버튼을 클릭하여 테스트합니다."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="동기화 테스트"
                secondary="연동 완료 후 '구글 캘린더 동기화' 버튼으로 작업 동기화를 테스트합니다."
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 3 }} />

      <Alert severity="info">
        <Typography variant="body2">
          <strong>도움말:</strong> 설정 중 문제가 발생하면 브라우저 개발자 도구의 콘솔을 확인하여 
          오류 메시지를 확인하세요.
        </Typography>
      </Alert>
    </Box>
  );
};

export default GoogleCalendarSetupGuide;
