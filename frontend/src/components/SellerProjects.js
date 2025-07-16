import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";

const SellerProjects = () => {
  const { user, userData } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      if (!user || userData?.role !== "seller") return;

      const q = query(
        collection(db, "projects"),
        where("sellerId", "==", user.uid),
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
  }, [user, userData]);

  if (loading) return <p>로딩 중...</p>;

  if (projects.length === 0) {
    return <p>등록한 시공건이 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">내 시공 배정 현황</h2>
      {projects.map((proj) => (
        <div key={proj.id} className="border p-4 rounded">
          <h3 className="text-lg font-bold">{proj.title}</h3>
          <p>예정일: {proj.scheduledDate?.toDate?.().toLocaleDateString?.() ?? proj.scheduledDate}</p>
          <p>
            배정 상태:{" "}
            {proj.status === "assigned"
              ? `배정 완료 (기사 UID: ${proj.assignedWorkerId})`
              : "미배정"}
          </p>
          <p>상태: {proj.status}</p>
        </div>
      ))}
    </div>
  );
};

export default SellerProjects; 