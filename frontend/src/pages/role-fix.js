import Head from 'next/head';
import Navigation from '../components/Navigation';
import RoleFixer from '../components/RoleFixer';

export default function RoleFixPage() {
  return (
    <>
      <Head>
        <title>역할 수정 - Insteam</title>
        <meta name="description" content="사용자 역할 수정 도구" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <Navigation title="역할 수정" />
        
        <div className="max-w-4xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">🔧 역할 수정 도구</h1>
            <p className="text-gray-600 mt-2">
              가입 시 역할이 잘못 설정된 경우 이 도구를 사용하여 수정할 수 있습니다.
            </p>
          </div>
          
          <RoleFixer />
          
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">⚠️ 주의사항</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 이 도구는 임시로 제공되는 기능입니다.</li>
              <li>• 역할 변경 후에는 페이지를 새로고침해야 합니다.</li>
              <li>• 문제가 지속되면 관리자에게 문의하세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
} 