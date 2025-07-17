import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import useRegisterFcmToken from '../hooks/useRegisterFcmToken';

export default function UseRegisterFcmTokenExample() {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Use the FCM registration hook
  const { token, loading, error, isRegistered } = useRegisterFcmToken(userId);

  useEffect(() => {
    // Listen for auth state changes
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          setUser(user);
          setUserId(user.uid);
        } else {
          setUser(null);
          setUserId(null);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleSignIn = async (): Promise<void> => {
    try {
      // You can implement your sign-in logic here
      // For example, using signInAnonymously or other auth methods
      console.log("Sign in functionality would go here");
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      if (auth) {
        await auth.signOut();
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">FCM 토큰 등록 예제</h1>
      
      {/* Authentication Status */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">인증 상태</h2>
        {user ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-medium">로그인됨</p>
                <p className="text-green-600 text-sm">User ID: {user.uid}</p>
                <p className="text-green-600 text-sm">Email: {user.email || 'Anonymous'}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                로그아웃
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-800 font-medium">로그인 필요</p>
                <p className="text-yellow-600 text-sm">FCM 토큰을 등록하려면 로그인이 필요합니다.</p>
              </div>
              <button
                onClick={handleSignIn}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                로그인
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FCM Registration Status */}
      {user && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">FCM 토큰 등록 상태</h2>
          
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">등록 상태</h3>
              <p className={`mt-1 text-lg font-semibold ${isRegistered ? 'text-green-600' : 'text-red-600'}`}>
                {isRegistered ? '등록됨' : '등록되지 않음'}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">처리 상태</h3>
              <p className={`mt-1 text-lg font-semibold ${loading ? 'text-yellow-600' : 'text-green-600'}`}>
                {loading ? '처리 중...' : '완료'}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-blue-800">FCM 토큰을 등록하는 중...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {isRegistered && token && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">등록 성공</h3>
                  <p className="mt-1 text-sm text-green-700">
                    FCM 토큰이 성공적으로 등록되었습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Token Display */}
          {token && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">FCM 토큰</h3>
              <div className="bg-gray-100 rounded-md p-3">
                <p className="text-xs text-gray-700 break-all font-mono">{token}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-800 mb-2">사용 방법</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>1. 사용자가 로그인하면 자동으로 FCM 토큰 등록을 시도합니다.</p>
          <p>2. 브라우저에서 알림 권한을 허용해야 합니다.</p>
          <p>3. 토큰이 성공적으로 등록되면 Firestore의 users 컬렉션에 저장됩니다.</p>
          <p>4. 등록된 토큰은 서버에서 푸시 알림을 보낼 때 사용됩니다.</p>
        </div>
      </div>
    </div>
  );
} 