import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fixUserRole, checkUserRole } from '../utils/fixUserRole';

export default function RoleFixer() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentRole, setCurrentRole] = useState(null);

  const checkCurrentRole = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const roleInfo = await checkUserRole(user.uid);
      setCurrentRole(roleInfo);
      setMessage(`현재 역할: ${roleInfo.primaryRole || roleInfo.role || '설정되지 않음'}`);
    } catch (error) {
      setMessage('역할 확인 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fixRole = async (newRole) => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      await fixUserRole(user.uid, newRole);
      setMessage(`역할이 '${newRole}'로 수정되었습니다. 페이지를 새로고침하세요.`);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage('역할 수정 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-4 text-center text-gray-600">로그인이 필요합니다.</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow border">
      <h3 className="text-lg font-semibold mb-4">🔧 역할 수정 도구</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">현재 사용자: {user.email}</p>
          <p className="text-sm text-gray-600">사용자 ID: {user.uid}</p>
        </div>

        <button
          onClick={checkCurrentRole}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '확인 중...' : '현재 역할 확인'}
        </button>

        {currentRole && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">현재 역할 정보:</h4>
            <ul className="text-sm space-y-1">
              <li>Primary Role: {currentRole.primaryRole || '없음'}</li>
              <li>Role: {currentRole.role || '없음'}</li>
              <li>Roles: {currentRole.roles?.join(', ') || '없음'}</li>
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">역할 수정:</h4>
          <div className="flex space-x-2">
            <button
              onClick={() => fixRole('seller')}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              판매자로 변경
            </button>
            <button
              onClick={() => fixRole('contractor')}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              시공자로 변경
            </button>
            <button
              onClick={() => fixRole('customer')}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              고객으로 변경
            </button>
          </div>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
} 