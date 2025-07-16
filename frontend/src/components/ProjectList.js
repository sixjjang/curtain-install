import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";

const ProjectList = () => {
  const { user, userData } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      const q = query(
        collection(db, "projects"),
        where("status", "==", "open"),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProjects(list);
      setLoading(false);
    };

    loadProjects();
  }, []);

  const handleAccept = async (projectId) => {
    if (!user || userData?.role !== "worker") {
      setMessage("시공기사만 수락 가능합니다.");
      return;
    }

    try {
      const projectRef = doc(db, "projects", projectId);

      await runTransaction(db, async (transaction) => {
        const projectDoc = await transaction.get(projectRef);

        if (!projectDoc.exists()) {
          throw new Error("시공건이 존재하지 않습니다.");
        }

        const project = projectDoc.data();

        if (project.status !== "open") {
          throw new Error("이미 다른 기사가 수락한 시공건입니다.");
        }

        transaction.update(projectRef, {
          assignedWorkerId: user.uid,
          status: "assigned",
        });
      });

      setMessage("수락 완료!");
    } catch (error) {
      console.error(error);
      setMessage(`에러: ${error.message}`);
    }
  };

  if (loading) return <p>로딩 중...</p>;

  if (projects.length === 0) {
    return <p>현재 등록된 시공건이 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">시공 목록</h2>
      {projects.map((proj) => (
        <div key={proj.id} className="border p-4 rounded">
          <h3 className="text-lg font-bold">{proj.title}</h3>
          <p>주소: {proj.address}</p>
          <p>예정일: {proj.scheduledDate?.toDate?.().toLocaleDateString?.() ?? proj.scheduledDate}</p>
          <p>
            비용: {proj.price?.toLocaleString()}원
            {" "} (긴급 수수료 {proj.currentUrgentFee}%)
          </p>
          <button
            className="bg-green-600 text-white px-3 py-1 mt-2"
            onClick={() => handleAccept(proj.id)}
          >
            수락하기
          </button>
        </div>
      ))}
      {message && <p className="text-red-600 mt-2">{message}</p>}
    </div>
  );
};

export default ProjectList; 