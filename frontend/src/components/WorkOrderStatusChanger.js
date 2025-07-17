import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

const allowedNextStatuses = {
  등록: ["배정완료", "취소"],
  배정완료: ["진행중", "취소"],
  진행중: ["완료", "취소"],
  완료: [],
  취소: [],
};

export default function WorkOrderStatusChanger({
  workOrderId,
  currentStatus,
  onStatusChanged,
}) {
  const [updating, setUpdating] = useState(false);

  const nextStatuses = allowedNextStatuses[currentStatus] || [];

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    if (!newStatus) return;
    setUpdating(true);

    try {
      const workOrderRef = doc(db, "workOrders", workOrderId);
      await updateDoc(workOrderRef, { 
        status: newStatus,
        updatedAt: new Date()
      });
      onStatusChanged(newStatus);
    } catch (err) {
      alert("상태 변경 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (nextStatuses.length === 0) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600 font-medium">더 이상 변경할 상태가 없습니다.</p>
        <p className="text-sm text-gray-500 mt-1">현재 상태: {currentStatus}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 p-4 bg-white border rounded-lg shadow-sm">
      <label htmlFor="status-select" className="font-semibold text-gray-700 whitespace-nowrap">
        작업 상태 변경:
      </label>
      <select
        id="status-select"
        onChange={handleChange}
        disabled={updating}
        defaultValue=""
        className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="" disabled>
          선택하세요
        </option>
        {nextStatuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      {updating && (
        <span className="text-blue-600 text-sm font-medium">
          변경 중...
        </span>
      )}
      <div className="text-sm text-gray-500">
        현재: <span className="font-medium">{currentStatus}</span>
      </div>
    </div>
  );
} 