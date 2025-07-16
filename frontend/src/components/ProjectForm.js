import { useState } from "react";
import { db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

const ProjectForm = () => {
  const { user, userData } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [price, setPrice] = useState("");
  const [urgentFeePercent, setUrgentFeePercent] = useState(15);
  const [urgentFeeMax, setUrgentFeeMax] = useState(50);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || userData?.role !== "seller") {
      setMessage("판매자만 시공 등록이 가능합니다.");
      return;
    }

    try {
      await addDoc(collection(db, "projects"), {
        sellerId: user.uid,
        title,
        description,
        address,
        scheduledDate: new Date(scheduledDate),
        price: Number(price),
        urgentFeePercent: Number(urgentFeePercent),
        urgentFeeMax: Number(urgentFeeMax),
        currentUrgentFee: Number(urgentFeePercent),
        status: "open",
        assignedWorkerId: null,
        createdAt: serverTimestamp(),
      });

      setMessage("시공건 등록 완료!");
      // 초기화
      setTitle("");
      setDescription("");
      setAddress("");
      setScheduledDate("");
      setPrice("");
      setUrgentFeePercent(15);
      setUrgentFeeMax(50);
    } catch (error) {
      console.error(error);
      setMessage(`에러: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">시공 등록</h2>

      <div>
        <label className="block mb-1">제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full"
          required
        />
      </div>

      <div>
        <label className="block mb-1">상세 설명</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full"
          rows={3}
        />
      </div>

      <div>
        <label className="block mb-1">주소</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border p-2 w-full"
          required
        />
      </div>

      <div>
        <label className="block mb-1">시공 예정일</label>
        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          className="border p-2 w-full"
          required
        />
      </div>

      <div>
        <label className="block mb-1">시공 비용 (원)</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-2 w-full"
          required
        />
      </div>

      <div>
        <label className="block mb-1">긴급 수수료 시작 비율 (%)</label>
        <input
          type="number"
          value={urgentFeePercent}
          onChange={(e) => setUrgentFeePercent(e.target.value)}
          className="border p-2 w-full"
          required
        />
      </div>

      <div>
        <label className="block mb-1">긴급 수수료 최대 비율 (%)</label>
        <input
          type="number"
          value={urgentFeeMax}
          onChange={(e) => setUrgentFeeMax(e.target.value)}
          className="border p-2 w-full"
          required
        />
      </div>

      <button
        type="submit"
        className="bg-black text-white px-4 py-2"
      >
        등록하기
      </button>

      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </form>
  );
};

export default ProjectForm; 