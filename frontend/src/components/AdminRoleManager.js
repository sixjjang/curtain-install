import React, { useState } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';

const AdminRoleManager = () => {
  const [uid, setUid] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { grantAdminRole, revokeAdminRole, checkAdminRole } = useAdminAuth();

  const handleGrantAdmin = async () => {
    if (!uid.trim()) {
      setMessage('사용자 UID를 입력해주세요.');
      return;
    }

    setLoading(true);
    setMessage('관리자 권한을 부여하는 중...');
    
    try {
      const result = await grantAdminRole(uid);
      setMessage(result.message);
      if (result.success) {
        setUid('');
      }
    } catch (error) {
      setMessage('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAdmin = async () => {
    if (!uid.trim()) {
      setMessage('사용자 UID를 입력해주세요.');
      return;
    }

    setLoading(true);
    setMessage('관리자 권한을 제거하는 중...');
    
    try {
      const result = await revokeAdminRole(uid);
      setMessage(result.message);
      if (result.success) {
        setUid('');
      }
    } catch (error) {
      setMessage('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAdmin = async () => {
    if (!uid.trim()) {
      setMessage('사용자 UID를 입력해주세요.');
      return;
    }

    setLoading(true);
    setMessage('관리자 권한을 확인하는 중...');
    
    try {
      const result = await checkAdminRole(uid);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage(`사용자 ${uid}의 관리자 권한: ${result.isAdmin ? '있음' : '없음'}`);
      }
    } catch (error) {
      setMessage('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">관리자 권한 관리</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          사용자 UID
        </label>
        <input
          type="text"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="사용자 UID를 입력하세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleGrantAdmin}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          관리자 권한 부여
        </button>
        
        <button
          onClick={handleRevokeAdmin}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          관리자 권한 제거
        </button>
        
        <button
          onClick={handleCheckAdmin}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          권한 확인
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded ${
          message.includes('성공') || message.includes('완료') 
            ? 'bg-green-100 text-green-800' 
            : message.includes('오류') || message.includes('실패')
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminRoleManager; 