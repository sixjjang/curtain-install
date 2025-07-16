import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../firebase/firebase";

const WorkerGradesAdmin = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const functions = getFunctions();

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, "workers"));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setWorkers(list);
    setLoading(false);
  };

  const recalcGrade = async (workerId) => {
    setMessage("등급 재계산 중...");
    try {
      const functionUrl = `https://${functions.app.options.region}-${functions.app.options.projectId}.cloudfunctions.net/recalculateWorkerGradeHttp?workerId=${workerId}`;
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (res.ok) {
        setMessage("재계산 완료");
        fetchWorkers();
      } else {
        setMessage("재계산 실패");
      }
    } catch (error) {
      console.error('Error recalculating grade:', error);
      setMessage("재계산 실패");
    }
  };

  const recalcAllGrades = async () => {
    setMessage("전체 등급 재계산 중...");
    try {
      // For the recalculateAllWorkerGrades function, we need to call it as an HTTP function
      const functionUrl = `https://${functions.app.options.region}-${functions.app.options.projectId}.cloudfunctions.net/recalculateAllWorkerGrades`;
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (res.ok) {
        setMessage("전체 재계산 완료");
        fetchWorkers();
      } else {
        setMessage("전체 재계산 실패");
      }
    } catch (error) {
      console.error('Error recalculating all grades:', error);
      setMessage("오류 발생");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">시공기사 등급 관리</h2>

      <button
        onClick={recalcAllGrades}
        className="mb-4 bg-purple-600 text-white px-4 py-2 rounded"
      >
        전체 등급 재계산
      </button>

      {message && <p className="mb-4">{message}</p>}

      {loading ? (
        <p>로딩 중...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">이름</th>
              <th className="border border-gray-300 p-2">등급</th>
              <th className="border border-gray-300 p-2">점수</th>
              <th className="border border-gray-300 p-2">재계산</th>
            </tr>
          </thead>
          <tbody>
            {workers.map(worker => (
              <tr key={worker.id}>
                <td className="border border-gray-300 p-2">{worker.name || worker.id}</td>
                <td className="border border-gray-300 p-2">{worker.grade || "-"}</td>
                <td className="border border-gray-300 p-2">{worker.score?.toFixed(2) || "-"}</td>
                <td className="border border-gray-300 p-2">
                  <button
                    onClick={() => recalcGrade(worker.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    재계산
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default WorkerGradesAdmin; 