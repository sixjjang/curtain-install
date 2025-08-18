import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { CloudUpload, CheckCircle, Error } from '@mui/icons-material';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase/config';

const StorageTest: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const testStorageConnection = async () => {
    setStatus('testing');
    setMessage('Firebase Storage 연결을 테스트하고 있습니다...');

    try {
      // 테스트 파일 생성
      const testContent = `Storage test at ${new Date().toISOString()}`;
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      
      // 테스트 파일 업로드
      const testFileName = `test-${Date.now()}.txt`;
      const testRef = ref(storage, `test/${testFileName}`);
      
      console.log('📤 테스트 파일 업로드 시도...');
      await uploadBytes(testRef, testBlob);
      console.log('✅ 테스트 파일 업로드 성공');
      
      // 다운로드 URL 가져오기
      console.log('📥 다운로드 URL 가져오기 시도...');
      const downloadUrl = await getDownloadURL(testRef);
      console.log('✅ 다운로드 URL 가져오기 성공:', downloadUrl);
      
      // 테스트 파일 삭제
      console.log('🗑️ 테스트 파일 삭제 시도...');
      await deleteObject(testRef);
      console.log('✅ 테스트 파일 삭제 성공');
      
      setStatus('success');
      setMessage('Firebase Storage 연결이 정상입니다! 이미지 업로드가 가능합니다.');
    } catch (error: any) {
      console.error('❌ Storage 테스트 실패:', error);
      setStatus('error');
      setMessage(`Firebase Storage 연결에 실패했습니다: ${error.message}`);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Firebase Storage 연결 테스트
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        이 페이지는 Firebase Storage 연결 상태를 확인하는 도구입니다.
        이미지 업로드 문제가 있을 때 사용하세요.
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Storage 연결 테스트
          </Typography>
          
          <Button
            variant="contained"
            onClick={testStorageConnection}
            disabled={status === 'testing'}
            startIcon={status === 'testing' ? <CircularProgress size={20} /> : <CloudUpload />}
            sx={{ mb: 2 }}
          >
            {status === 'testing' ? '테스트 중...' : 'Storage 연결 테스트'}
          </Button>

          {status === 'success' && (
            <Alert severity="success" icon={<CheckCircle />}>
              {message}
            </Alert>
          )}

          {status === 'error' && (
            <Alert severity="error" icon={<Error />}>
              {message}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => window.location.href = '/register'}
        >
          회원가입 페이지로
        </Button>
        <Button
          variant="outlined"
          onClick={() => window.location.href = '/test-accounts'}
        >
          테스트 계정 관리로
        </Button>
      </Box>
    </Box>
  );
};

export default StorageTest;
