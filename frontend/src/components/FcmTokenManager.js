import { useEffect } from "react";
import { getToken, onTokenRefresh } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { db, messagingInstance } from "../firebase/firebase";

const FcmTokenManager = ({ advertiserId }) => {
  useEffect(() => {
    if (!messagingInstance) {
      console.log("Messaging not available");
      return;
    }

    const saveToken = async (token) => {
      if (token) {
        try {
          const docRef = doc(db, "advertisers", advertiserId);
          await updateDoc(docRef, { fcmToken: token });
          console.log("FCM token saved successfully");
        } catch (error) {
          console.error("Error saving FCM token:", error);
        }
      }
    };

    const requestNotificationPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          // Get the token
          const token = await getToken(messagingInstance, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
          });
          
          if (token) {
            await saveToken(token);
          } else {
            console.log("No registration token available");
          }

          // Handle token refresh
          onTokenRefresh(messagingInstance, async () => {
            const refreshedToken = await getToken(messagingInstance, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
            });
            if (refreshedToken) {
              await saveToken(refreshedToken);
            }
          });
        } else {
          console.log("Notification permission denied");
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    };

    // Check if the browser supports notifications
    if ("Notification" in window) {
      requestNotificationPermission();
    } else {
      console.log("This browser does not support notifications");
    }

    // Cleanup function
    return () => {
      // Cleanup if needed
    };
  }, [advertiserId]);

  return null; // This component doesn't render anything
};

export default FcmTokenManager; 