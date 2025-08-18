import React, { useState, useEffect } from 'react';
import { testFirebaseConnection } from '../../firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

const FirebaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [testResult, setTestResult] = useState<string>('');

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
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Firebase 연결 테스트</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testConnection} style={{ marginRight: '10px' }}>
          연결 상태 확인
        </button>
        <button onClick={testFirestoreWrite}>
          Firestore 읽기/쓰기 테스트
        </button>
      </div>

      {connectionStatus && (
        <div style={{ 
          padding: '15px', 
          border: '1px solid #ccc', 
          borderRadius: '5px',
          backgroundColor: connectionStatus.error ? '#ffebee' : '#e8f5e8'
        }}>
          <h3>연결 상태:</h3>
          <pre>{JSON.stringify(connectionStatus, null, 2)}</pre>
        </div>
      )}

      {testResult && (
        <div style={{ 
          padding: '15px', 
          border: '1px solid #ccc', 
          borderRadius: '5px',
          marginTop: '10px',
          backgroundColor: testResult.includes('실패') ? '#ffebee' : '#e8f5e8'
        }}>
          <h3>테스트 결과:</h3>
          <p>{testResult}</p>
        </div>
      )}
    </div>
  );
};

export default FirebaseTest;
