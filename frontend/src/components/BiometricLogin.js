import React, { useState, useEffect } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase/firebase';

const BiometricLogin = ({ onLoginSuccess, onLoginError, className = "" }) => {
  const [loading, setLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
    // Firebase auth가 초기화되지 않았으면 생체인증 비활성화
    if (!auth) {
      console.warn('Firebase auth not available, biometric login disabled');
      setIsSupported(false);
      return;
    }

    // WebAuthn 지원 여부 확인
    const checkBiometricSupport = async () => {
      try {
        // WebAuthn API 지원 확인
        if (!window.PublicKeyCredential) {
          console.log('WebAuthn이 지원되지 않습니다.');
          setIsSupported(false);
          return;
        }

        // 사용 가능한 인증 방식 확인
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsSupported(true);
        setIsAvailable(available);

        if (available) {
          console.log('생체인증이 사용 가능합니다.');
        } else {
          console.log('생체인증이 사용 불가능합니다.');
        }
      } catch (error) {
        console.error('생체인증 지원 확인 실패:', error);
        setIsSupported(false);
      }
    };

    checkBiometricSupport();
  }, []);

  // 생체인증 등록
  const registerBiometric = async () => {
    try {
      setLoading(true);

      // 서버에서 등록 옵션 요청
      const response = await fetch('/api/generateBiometricRegistrationOptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: auth.currentUser?.uid,
          email: auth.currentUser?.email,
        }),
      });

      if (!response.ok) {
        throw new Error('등록 옵션 요청 실패');
      }

      const options = await response.json();

      // PublicKeyCredential 생성 옵션 변환
      const publicKeyOptions = {
        challenge: new Uint8Array(options.challenge),
        rp: {
          name: options.rp.name,
          id: options.rp.id,
        },
        user: {
          id: new Uint8Array(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams,
        timeout: options.timeout,
        attestation: options.attestation,
        authenticatorSelection: options.authenticatorSelection,
      };

      // 생체인증 등록
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      });

      // 서버에 등록 완료 알림
      const registerResponse = await fetch('/api/completeBiometricRegistration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: {
            id: credential.id,
            type: credential.type,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
            },
          },
          userId: auth.currentUser?.uid,
        }),
      });

      if (registerResponse.ok) {
        alert('생체인증이 등록되었습니다!');
        setCredentials(credential);
      } else {
        throw new Error('생체인증 등록 실패');
      }
    } catch (error) {
      console.error('생체인증 등록 실패:', error);
      alert('생체인증 등록에 실패했습니다: ' + error.message);
      if (onLoginError) {
        onLoginError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 생체인증 로그인
  const loginWithBiometric = async () => {
    try {
      setLoading(true);

      // 서버에서 인증 옵션 요청
      const response = await fetch('/api/generateBiometricAuthenticationOptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: auth.currentUser?.email || 'guest',
        }),
      });

      if (!response.ok) {
        throw new Error('인증 옵션 요청 실패');
      }

      const options = await response.json();

      // PublicKeyCredential 요청 옵션 변환
      const publicKeyOptions = {
        challenge: new Uint8Array(options.challenge),
        rpId: options.rpId,
        allowCredentials: options.allowCredentials.map(cred => ({
          ...cred,
          id: new Uint8Array(cred.id),
        })),
        timeout: options.timeout,
        userVerification: options.userVerification,
      };

      // 생체인증 인증
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      });

      // 서버에 인증 완료 알림
      const authenticateResponse = await fetch('/api/completeBiometricAuthentication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assertion: {
            id: assertion.id,
            type: assertion.type,
            rawId: Array.from(new Uint8Array(assertion.rawId)),
            response: {
              authenticatorData: Array.from(new Uint8Array(assertion.response.authenticatorData)),
              clientDataJSON: Array.from(new Uint8Array(assertion.response.clientDataJSON)),
              signature: Array.from(new Uint8Array(assertion.response.signature)),
            },
          },
        }),
      });

      if (authenticateResponse.ok) {
        const data = await authenticateResponse.json();
        
        if (data.firebaseToken) {
          // Firebase Custom Token으로 로그인
          const userCredential = await signInWithCustomToken(auth, data.firebaseToken);
          console.log('생체인증 로그인 성공:', userCredential.user);

          if (onLoginSuccess) {
            onLoginSuccess({
              user: userCredential.user,
              method: 'biometric',
              message: '생체인증으로 로그인되었습니다.'
            });
          }
        } else {
          throw new Error('Firebase 토큰을 받지 못했습니다.');
        }
      } else {
        throw new Error('생체인증 인증 실패');
      }
    } catch (error) {
      console.error('생체인증 로그인 실패:', error);
      
      let errorMessage = '생체인증 로그인에 실패했습니다.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = '생체인증이 거부되었습니다.';
      } else if (error.name === 'SecurityError') {
        errorMessage = '보안 오류가 발생했습니다.';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = '인증 상태가 유효하지 않습니다.';
      }

      alert(errorMessage);
      
      if (onLoginError) {
        onLoginError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 생체인증 지원하지 않는 경우
  if (!isSupported) {
    return (
      <div className={`text-center p-4 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-gray-600 mb-2">🔒</div>
        <p className="text-sm text-gray-600">이 브라우저는 생체인증을 지원하지 않습니다.</p>
      </div>
    );
  }

  // 생체인증 사용 불가능한 경우
  if (!isAvailable) {
    return (
      <div className={`text-center p-4 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-gray-600 mb-2">📱</div>
        <p className="text-sm text-gray-600">생체인증을 사용할 수 없습니다.</p>
        <p className="text-xs text-gray-500 mt-1">지문 또는 얼굴인식을 설정해주세요.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 생체인증 등록 버튼 */}
      {!credentials && (
        <button
          onClick={registerBiometric}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
            loading
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              등록 중...
            </div>
          ) : (
            <>
              <span className="mr-2">🔐</span>
              생체인증 등록
            </>
          )}
        </button>
      )}

      {/* 생체인증 로그인 버튼 */}
      <button
        onClick={loginWithBiometric}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
          loading
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600 text-white"
        }`}
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            인증 중...
          </div>
        ) : (
          <>
            <span className="mr-2">👆</span>
            생체인증으로 로그인
          </>
        )}
      </button>

      {/* 상태 표시 */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          {credentials ? '✅ 생체인증 등록됨' : '📝 생체인증을 등록해주세요'}
        </p>
      </div>
    </div>
  );
};

export default BiometricLogin; 