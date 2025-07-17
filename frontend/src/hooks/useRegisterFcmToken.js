import { useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { requestNotificationPermission } from "../services/fcmService";

export default function useRegisterFcmToken(userId) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setToken(null);
      setError(null);
      return;
    }

    const registerToken = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fcmToken = await requestNotificationPermission();
        
        if (fcmToken) {
          // Firestore 유저 문서에 FCM 토큰 저장
          await setDoc(
            doc(db, "users", userId),
            {
              fcmToken: fcmToken,
              lastTokenUpdate: new Date(),
            },
            { merge: true }
          );
          
          setToken(fcmToken);
          console.log("FCM token registered successfully for user:", userId);
        } else {
          setError("Failed to get FCM token - permission denied or not supported");
        }
      } catch (err) {
        console.error("Error registering FCM token:", err);
        setError(err.message || "Failed to register FCM token");
      } finally {
        setLoading(false);
      }
    };

    registerToken();
  }, [userId]);

  return {
    token,
    loading,
    error,
    isRegistered: !!token,
  };
} 