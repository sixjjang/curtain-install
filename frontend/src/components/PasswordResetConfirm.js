import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

const PasswordResetConfirm = ({ onSuccess, onError }) => {
  const { clearError } = useAuth();
  const auth = getAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isValidCode, setIsValidCode] = useState(false);
  const [email, setEmail] = useState("");

  // Get action code from URL
  const getActionCode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('oobCode');
  };

  // Verify the password reset code
  useEffect(() => {
    const verifyCode = async () => {
      const actionCode = getActionCode();
      
      if (!actionCode) {
        setError("유효하지 않은 비밀번호 재설정 링크입니다.");
        return;
      }

      try {
        const email = await verifyPasswordResetCode(auth, actionCode);
        setEmail(email);
        setIsValidCode(true);
      } catch (err) {
        console.error("Code verification error:", err);
        setError("비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다. 새로운 링크를 요청해주세요.");
      }
    };

    verifyCode();
  }, [auth]);

  // Password validation
  const validatePassword = (password) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength,
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      strength: [
        password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      ].filter(Boolean).length
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    clearError();

    // Validate passwords
    if (!password.trim()) {
      setError("새 비밀번호를 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(`비밀번호는 최소 ${passwordValidation.minLength}자 이상이어야 합니다.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const actionCode = getActionCode();
      await confirmPasswordReset(auth, actionCode, password);
      
      setIsSuccess(true);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(email);
      }
      
    } catch (err) {
      console.error("Password reset confirmation error:", err);
      
      let errorMessage = "비밀번호 재설정에 실패했습니다.";
      
      switch (err.code) {
        case 'auth/expired-action-code':
          errorMessage = "비밀번호 재설정 링크가 만료되었습니다. 새로운 링크를 요청해주세요.";
          break;
        case 'auth/invalid-action-code':
          errorMessage = "유효하지 않은 비밀번호 재설정 링크입니다.";
          break;
        case 'auth/weak-password':
          errorMessage = "비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.";
          break;
        default:
          errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      
      // Call error callback if provided
      if (onError) {
        onError(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const passwordValidation = validatePassword(password);

  // Success state
  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            비밀번호가 성공적으로 변경되었습니다
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            새로운 비밀번호로 로그인하실 수 있습니다.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            <p className="text-xs text-green-800">
              ✅ <strong>완료:</strong> 보안을 위해 다른 기기에서 자동으로 로그아웃됩니다.
            </p>
          </div>
          
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  // Loading state while verifying code
  if (!isValidCode && !error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">비밀번호 재설정 링크를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // Error state for invalid code
  if (error && !isValidCode) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            링크 오류
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            {error}
          </p>
          
          <button
            onClick={() => window.location.href = '/password-reset'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            새로운 비밀번호 재설정 링크 요청
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          새 비밀번호 설정
        </h2>
        
        <p className="text-sm text-gray-600">
          <strong>{email}</strong> 계정의 새 비밀번호를 입력해주세요.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <svg
              className="h-4 w-4 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            새 비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="새 비밀번호 입력"
            required
            minLength={6}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          
          {/* Password strength indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      level <= passwordValidation.strength
                        ? passwordValidation.strength <= 2
                          ? 'bg-red-500'
                          : passwordValidation.strength <= 3
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs mt-1 ${
                passwordValidation.strength <= 2 ? 'text-red-600' :
                passwordValidation.strength <= 3 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {passwordValidation.strength <= 2 ? '약함' :
                 passwordValidation.strength <= 3 ? '보통' : '강함'}
              </p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            새 비밀번호 확인
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="새 비밀번호 재입력"
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-600 mt-1">비밀번호가 일치하지 않습니다.</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-800">
            🔒 <strong>보안 팁:</strong> 강한 비밀번호는 대소문자, 숫자, 특수문자를 포함합니다.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !password.trim() || !confirmPassword.trim() || password !== confirmPassword}
          className={`w-full py-2 px-4 rounded font-medium transition-colors ${
            isSubmitting || !password.trim() || !confirmPassword.trim() || password !== confirmPassword
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              비밀번호 변경 중...
            </div>
          ) : (
            '비밀번호 변경'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          문제가 있으시면{' '}
          <a href="mailto:support@curtaininstall.com" className="text-blue-600 hover:underline">
            고객센터
          </a>
          에 문의해주세요.
        </p>
      </div>
    </div>
  );
};

export default PasswordResetConfirm; 