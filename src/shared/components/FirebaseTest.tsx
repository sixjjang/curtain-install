import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { testFirebaseConnection } from '../../firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useTheme } from '../../shared/contexts/ThemeContext';

const FirebaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [testResult, setTestResult] = useState<string>('');
  const { mode } = useTheme();

  const testConnection = async () => {
    try {
      const result = await testFirebaseConnection();
      setConnectionStatus(result);
      console.log('Firebase 연결 테스트 결과:', result);
    } catch (error) {
      console.error('연결 테스트 실패:', error);
      setConnectionStatus({ error: error });
    }
  };

  const testFirestoreWrite = async () => {
    try {
      console.log('Firestore 쓰기 테스트 시작...');
      const testData = {
        test: true,
        timestamp: new Date(),
        message: 'Firestore 연결 테스트'
      };
      
      const docRef = await addDoc(collection(db, 'test'), testData);
      console.log('✅ Firestore 쓰기 성공:', docRef.id);
      
      // 읽기 테스트
      const snapshot = await getDocs(collection(db, 'test'));
      console.log('✅ Firestore 읽기 성공:', snapshot.size, '개 문서');
      
      setTestResult('Firestore 읽기/쓰기 테스트 성공!');
    } catch (error) {
      console.error('❌ Firestore 테스트 실패:', error);
      setTestResult(`Firestore 테스트 실패: ${error}`);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Box sx={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Firebase 연결 테스트
      </Typography>
      
      <Box sx={{ marginBottom: '20px' }}>
        <Button 
          onClick={testConnection} 
          variant="contained" 
          sx={{ marginRight: '10px' }}
        >
          연결 상태 확인
        </Button>
        <Button 
          onClick={testFirestoreWrite}
          variant="contained"
        >
          Firestore 읽기/쓰기 테스트
        </Button>
      </Box>

      {connectionStatus && (
        <Box sx={{ 
          padding: '15px', 
          border: '1px solid #ccc', 
          borderRadius: '5px',
          backgroundColor: connectionStatus.error ? 
            (mode === 'light' ? '#ffebee' : '#2d1b1b') : 
            (mode === 'light' ? '#e8f5e8' : '#1b2d1b')
        }}>
          <Typography variant="h6" gutterBottom>
            연결 상태:
          </Typography>
          <pre>{JSON.stringify(connectionStatus, null, 2)}</pre>
        </Box>
      )}

      {testResult && (
        <Box sx={{ 
          padding: '15px', 
          border: '1px solid #ccc', 
          borderRadius: '5px',
          marginTop: '10px',
          backgroundColor: testResult.includes('실패') ? 
            (mode === 'light' ? '#ffebee' : '#2d1b1b') : 
            (mode === 'light' ? '#e8f5e8' : '#1b2d1b')
        }}>
          <Typography variant="h6" gutterBottom>
            테스트 결과:
          </Typography>
          <Typography>{testResult}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default FirebaseTest;
