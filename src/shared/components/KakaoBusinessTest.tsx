import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Send,
  Settings,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { KakaoBusinessService } from '../services/kakaoBusinessService';

const KakaoBusinessTest: React.FC = () => {
  const [accessToken, setAccessToken] = useState('');
  const [channelId, setChannelId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleInitialize = () => {
    if (!accessToken || !channelId || !templateId) {
      setResult({
        success: false,
        message: '모든 필드를 입력해 주세요.'
      });
      return;
    }

    try {
      KakaoBusinessService.initialize({
        accessToken,
        channelId,
        templateId
      });
      setIsInitialized(true);
      setResult({
        success: true,
        message: '카카오톡 비즈니스 서비스가 초기화되었습니다.'
      });
    } catch (error) {
      setResult({
        success: false,
        message: '초기화에 실패했습니다: ' + (error as Error).message
      });
    }
  };

  const handleTestMessage = async () => {
    if (!isInitialized) {
      setResult({
        success: false,
        message: '먼저 서비스를 초기화해 주세요.'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const success = await KakaoBusinessService.sendTestMessage();
      
      if (success) {
        setResult({
          success: true,
          message: '테스트 메시지가 성공적으로 전송되었습니다!'
        });
      } else {
        setResult({
          success: false,
          message: '테스트 메시지 전송에 실패했습니다.'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: '오류가 발생했습니다: ' + (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom align="center">
        🚀 카카오톡 비즈니스 API 테스트
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings />
            설정
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Access Token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="카카오 비즈니스에서 발급받은 Access Token"
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Channel ID"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="카카오 비즈니스 채널 ID"
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Template ID"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              placeholder="메시지 템플릿 ID"
              variant="outlined"
              size="small"
            />
          </Box>

          <Button
            variant="contained"
            onClick={handleInitialize}
            disabled={!accessToken || !channelId || !templateId}
            fullWidth
          >
            서비스 초기화
          </Button>
        </CardContent>
      </Card>

      {isInitialized && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              초기화 완료
            </Typography>
            <Typography variant="body2" color="textSecondary">
              카카오톡 비즈니스 서비스가 성공적으로 초기화되었습니다.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Send />
            테스트 메시지 전송
          </Typography>
          
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            만족도 평가 링크가 포함된 테스트 메시지를 전송합니다.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={handleTestMessage}
            disabled={!isInitialized || loading}
            fullWidth
            sx={{ mb: 2 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                전송 중...
              </>
            ) : (
              '테스트 메시지 전송'
            )}
          </Button>

          {result && (
            <Alert 
              severity={result.success ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              {result.message}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 설정 가이드
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            1. 카카오 비즈니스 홈페이지에서 계정 생성
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            2. 채널 생성 및 인증 완료
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            3. API 키 발급 및 템플릿 설정
          </Typography>
          
          <Typography variant="body2" color="textSecondary">
            4. 위 필드에 정보 입력 후 초기화
          </Typography>
          
          <Button
            variant="outlined"
            href="https://business.kakao.com"
            target="_blank"
            fullWidth
            sx={{ mt: 2 }}
          >
            카카오 비즈니스 홈페이지
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default KakaoBusinessTest;
