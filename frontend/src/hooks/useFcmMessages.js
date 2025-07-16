import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { messagingInstance } from "../firebase/firebase";

const useFcmMessages = (onMessageReceived) => {
  useEffect(() => {
    if (!messagingInstance) {
      console.log("Messaging not available for foreground messages");
      return;
    }

    const unsubscribe = onMessage(messagingInstance, (payload) => {
      console.log("Message received in foreground:", payload);
      
      // Call the callback function with the message payload
      if (onMessageReceived) {
        onMessageReceived(payload);
      }

      // You can also show a custom notification here
      if (payload.notification) {
        const { title, body } = payload.notification;
        
        // Show a custom notification
        if (Notification.permission === "granted") {
          new Notification(title, {
            body,
            icon: "/icon-192x192.png", // Add your app icon path
            badge: "/badge-72x72.png", // Add your badge icon path
            data: payload.data || {}
          });
        }
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [onMessageReceived]);
};

export default useFcmMessages; 