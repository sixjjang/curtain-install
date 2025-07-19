export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tailwind CSS 테스트</h1>
        <p className="text-gray-600 mb-4">이 페이지가 파란 배경에 흰색 카드로 보인다면 Tailwind가 정상 작동합니다.</p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          테스트 버튼
        </button>
      </div>
    </div>
  );
} 