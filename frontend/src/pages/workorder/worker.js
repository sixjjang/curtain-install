import { useRouter } from 'next/router';

export default function WorkerRoleSelect() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="card p-10 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-6">역할을 선택하세요</h1>
        <div className="flex flex-col gap-6">
          <button
            className="btn btn-primary text-lg py-4"
            onClick={() => router.push('/workorder/worker-list')}
          >
            🛠️ 시공기사(Worker)로 보기
          </button>
          <button
            className="btn btn-secondary text-lg py-4"
            onClick={() => router.push('/workorder/list')}
          >
            🧑‍💼 시공의뢰자(Client)로 보기
          </button>
        </div>
      </div>
    </div>
  );
} 