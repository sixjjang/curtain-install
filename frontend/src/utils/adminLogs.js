import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const writeAdminLog = async ({
  adminId,
  adminName,
  actionType,
  targetWorkerId,
  targetWorkerName,
  prevStatus,
  newStatus,
}) => {
  await addDoc(collection(db, "adminLogs"), {
    adminId,
    adminName,
    actionType,
    targetWorkerId,
    targetWorkerName,
    prevStatus,
    newStatus,
    timestamp: serverTimestamp(),
  });
}; 