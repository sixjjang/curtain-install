import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const logMediaDownload = async ({
  mediaId,
  mediaType,
  downloadedBy,
  downloadedByName,
  workerId,
  workerName,
  price
}) => {
  await addDoc(collection(db, "mediaDownloads"), {
    mediaId,
    mediaType,
    downloadedBy,
    downloadedByName,
    workerId,
    workerName,
    downloadTimestamp: serverTimestamp(),
    price
  });
}; 