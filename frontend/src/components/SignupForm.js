import { useState } from "react";
import { useRouter } from "next/router";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import Navigation from "./Navigation";
import KakaoLoginButton from "./KakaoLoginButton";
import NaverLoginButton from "./NaverLoginButton";
import { getRoleColors } from "../utils/roleColors";

const SignupForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [role, setRole] = useState("seller"); // seller, contractor
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState("seller");

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // 역할 선택 확인
    if (!selectedRole) {
      setMessage("역할을 선택해주세요.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      // Firebase 설정 확인
      if (!auth || typeof auth.createUserWithEmailAndPassword !== 'function') {
        throw new Error('Firebase가 초기화되지 않았습니다. Firebase 프로젝트를 설정해주세요.');
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, pw);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Save user data to Firestore
      const userData = {
        email: user.email,
        role: selectedRole,
        roles: [selectedRole],
        primaryRole: selectedRole,
        createdAt: new Date(),
        emailVerified: false,
        displayName: email.split('@')[0], // 기본 이름 설정
        isActive: true,
        approvalStatus: 'pending' // 승인 대기 상태로 설정
      };
      
      await setDoc(doc(db, "users", user.uid), userData);
      
      // 디버깅: 사용자 데이터 확인
      console.log('회원가입 완료 - 사용자 데이터:', userData);

      setIsSuccess(true);
      setMessage("회원가입이 완료되었습니다! 역할별 프로필 설정 페이지로 이동합니다.");
      
      // 3초 후 역할별 프로필 설정 페이지로 이동
      setTimeout(() => {
        if (selectedRole === 'seller') {
          router.push('/profile-setup/seller');
        } else if (selectedRole === 'contractor') {
          router.push('/profile-setup/contractor');
        } else {
          router.push('/profile-setup');
        }
      }, 3000);
      
    } catch (error) {
      console.error("Signup error:", error);
      
      // 사용자 친화적인 에러 메시지
      let errorMessage = "회원가입 중 오류가 발생했습니다.";
      
      if (error.message.includes('Firebase가 초기화되지 않았습니다')) {
        errorMessage = "Firebase 설정이 필요합니다. 관리자에게 문의해주세요.";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "비밀번호가 너무 약합니다. 6자 이상으로 설정해주세요.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "올바른 이메일 형식을 입력해주세요.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "이메일/비밀번호 회원가입이 비활성화되어 있습니다.";
      }
      
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 구글 로그인 핸들러
  const handleGoogleSignup = async () => {
    if (!selectedRole) {
      setMessage("먼저 역할을 선택해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      // Firebase 설정 확인
      if (!auth || typeof auth.signInWithPopup !== 'function') {
        throw new Error('Firebase가 초기화되지 않았습니다. Firebase 프로젝트를 설정해주세요.');
      }

      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Firestore에 사용자 정보 저장
      const userData = {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        role: selectedRole,
        roles: [selectedRole],
        primaryRole: selectedRole,
        createdAt: new Date(),
        emailVerified: user.emailVerified || false,
        isActive: true,
        approvalStatus: 'pending',
        provider: 'google',
        photoURL: user.photoURL || ''
      };

      await setDoc(doc(db, "users", user.uid), userData, { merge: true });

      setIsSuccess(true);
      setMessage("구글 회원가입이 완료되었습니다! 역할별 프로필 설정 페이지로 이동합니다.");
      
      // 3초 후 역할별 프로필 설정 페이지로 이동
      setTimeout(() => {
        if (selectedRole === 'seller') {
          router.push('/profile-setup/seller');
        } else if (selectedRole === 'contractor') {
          router.push('/profile-setup/contractor');
        } else {
          router.push('/profile-setup');
        }
      }, 3000);

    } catch (error) {
      console.error("Google signup error:", error);
      
      let errorMessage = "구글 회원가입 중 오류가 발생했습니다.";
      
      if (error.message.includes('Firebase가 초기화되지 않았습니다')) {
        errorMessage = "Firebase 설정이 필요합니다. 관리자에게 문의해주세요.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "로그인 팝업이 닫혔습니다. 다시 시도해주세요.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "로그인이 취소되었습니다.";
      }
      
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleGoToHome = () => {
    router.push('/');
  };

  // 소셜 로그인 핸들러들
  const handleKakaoSignupSuccess = (loginData) => {
    console.log('카카오 회원가입 성공:', loginData);
    
    // 새 사용자인 경우 선택된 역할로 바로 가입
    if (loginData.isNewUser) {
      handleSocialSignupComplete(loginData.user, selectedRole);
    } else {
      router.push('/dashboard');
    }
  };

  const handleNaverSignupSuccess = (loginData) => {
    console.log('네이버 회원가입 성공:', loginData);
    
    // 새 사용자인 경우 선택된 역할로 바로 가입
    if (loginData.isNewUser) {
      handleSocialSignupComplete(loginData.user, selectedRole);
    } else {
      router.push('/dashboard');
    }
  };

  // 소셜 회원가입 완료 처리
  const handleSocialSignupComplete = async (user, role) => {
    try {
      setLoading(true);
      
      // 사용자 프로필 생성
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        role: role,
        roles: [role],
        primaryRole: role,
        createdAt: new Date(),
        emailVerified: user.emailVerified || false,
        isActive: true,
        approvalStatus: 'pending' // 승인 대기 상태로 설정
      }, { merge: true });
      
      setMessage("소셜 회원가입이 완료되었습니다! 역할별 프로필 설정 페이지로 이동합니다.");
      setIsSuccess(true);
      
      // 3초 후 역할별 프로필 설정 페이지로 이동
      setTimeout(() => {
        if (role === 'seller') {
          router.push('/profile-setup/seller');
        } else if (role === 'contractor') {
          router.push('/profile-setup/contractor');
        } else {
          router.push('/profile-setup');
        }
      }, 3000);
      
    } catch (error) {
      console.error('소셜 회원가입 오류:', error);
      setMessage('소셜 회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="회원가입" />
      
      <div className="max-w-md mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
            <p className="text-gray-600 mt-2">커튼 설치 매칭 서비스에 가입하세요</p>
          </div>
          
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="이메일을 입력하세요"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
                minLength={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="비밀번호를 입력하세요 (최소 6자)"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">
                최소 6자 이상으로 설정해주세요
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                역할 선택 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3">
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedRole === "seller" 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-300 hover:bg-gray-50"
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="seller"
                    checked={selectedRole === "seller"}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mr-3"
                    disabled={loading}
                  />
                  <div>
                    <div className="font-medium">판매자</div>
                    <div className="text-sm text-gray-500">커튼을 판매하고 시공요청을 등록하는 판매자입니다</div>
                  </div>
                </label>
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedRole === "contractor" 
                    ? "border-orange-500 bg-orange-50" 
                    : "border-gray-300 hover:bg-gray-50"
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="contractor"
                    checked={selectedRole === "contractor"}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mr-3"
                    disabled={loading}
                  />
                  <div>
                    <div className="font-medium">시공기사</div>
                    <div className="text-sm text-gray-500">커튼 설치 작업을 수행하는 시공기사입니다</div>
                  </div>
                </label>

              </div>
              <p className="mt-2 text-sm text-red-600">
                ⚠️ 역할은 가입 후 변경할 수 없습니다. 신중하게 선택해주세요.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedRole}
              className={`w-full text-white py-3 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium ${
                selectedRole === 'seller' ? 'bg-blue-600 hover:bg-blue-700' : 
                selectedRole === 'contractor' ? 'bg-orange-600 hover:bg-orange-700' : 
                'bg-gray-400'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  가입 중...
                </div>
              ) : !selectedRole ? (
                '역할을 선택해주세요'
              ) : (
                '회원가입'
              )}
            </button>
          </form>

          {/* 구분선 */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* 소셜 회원가입 */}
          <div className="space-y-3">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">소셜 계정으로 간편하게 가입하기</p>
            </div>
            
            {/* 구글 회원가입 */}
            <button
              onClick={handleGoogleSignup}
              disabled={loading || !selectedRole}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? '가입 중...' : '구글로 회원가입'}
            </button>

            {/* 카카오 회원가입 */}
            <KakaoLoginButton 
              onLoginSuccess={handleKakaoSignupSuccess}
              onLoginError={(error) => setMessage('카카오 회원가입 중 오류가 발생했습니다.')}
              selectedRole={selectedRole}
              disabled={loading || !selectedRole}
              className="w-full"
            />

            {/* 네이버 회원가입 */}
            <NaverLoginButton 
              onLoginSuccess={handleNaverSignupSuccess}
              onLoginError={(error) => setMessage('네이버 회원가입 중 오류가 발생했습니다.')}
              selectedRole={selectedRole}
              disabled={loading || !selectedRole}
              className="w-full"
            />
          </div>

          {/* 메시지 표시 */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              isSuccess 
                ? "bg-green-50 border border-green-200 text-green-700" 
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {isSuccess ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm">{message}</p>
                  {isSuccess && (
                    <p className="text-sm mt-1">
                      <button
                        onClick={handleGoToLogin}
                        className="text-green-600 hover:text-green-700 font-medium underline"
                      >
                        바로 로그인하기
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 하단 링크들 */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <button
                onClick={handleGoToLogin}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                로그인하기
              </button>
            </p>
            
            <p className="text-sm text-gray-600">
              <button
                onClick={handleGoToHome}
                className="text-gray-600 hover:text-gray-700 font-medium"
              >
                ← 홈으로 돌아가기
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm; 