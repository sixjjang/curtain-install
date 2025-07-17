import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app from "../firebase/firebase";

// Get messaging instance
const messaging = getMessaging(app);

export async function requestNotificationPermission() {
  try {
    // Check if messaging is supported
    if (!messaging) {
      console.log("Messaging not supported in this environment");
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      // Get FCM token
      const token = await getToken(messaging, { 
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "YOUR_PUBLIC_VAPID_KEY" 
      });
      
      console.log("FCM Token:", token);
      return token;
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("FCM permission error:", error);
    return null;
  }
}

export function onMessageListener(callback) {
  if (!messaging) {
    console.log("Messaging not supported in this environment");
    return;
  }

  return onMessage(messaging, (payload) => {
    console.log("Message received:", payload);
    callback(payload);
  });
}

// Function to save FCM token to user's profile
export async function saveFCMTokenToUser(token, userId) {
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    const { db } = await import("../firebase/firebase");
    
    await setDoc(doc(db, "users", userId), {
      fcmToken: token,
      lastTokenUpdate: new Date(),
    }, { merge: true });
    
    console.log("FCM token saved to user profile");
  } catch (error) {
    console.error("Error saving FCM token:", error);
  }
}

// Function to remove FCM token from user's profile
export async function removeFCMTokenFromUser(userId) {
  try {
    const { doc, updateDoc } = await import("firebase/firestore");
    const { db } = await import("../firebase/firebase");
    
    await updateDoc(doc(db, "users", userId), {
      fcmToken: null,
      lastTokenUpdate: new Date(),
    });
    
    console.log("FCM token removed from user profile");
  } catch (error) {
    console.error("Error removing FCM token:", error);
  }
}

// Function to check if notifications are supported
export function isNotificationSupported() {
  return typeof window !== "undefined" && 
         "Notification" in window && 
         "serviceWorker" in navigator &&
         messaging !== null;
}

// Function to get current notification permission status
export function getNotificationPermissionStatus() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "not-supported";
  }
  return Notification.permission;
}

// Function to display a custom notification
export function showCustomNotification(title, options = {}) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });

    // Handle notification click
    notification.onclick = function(event) {
      event.preventDefault();
      window.focus();
      notification.close();
      
      // Handle custom click action
      if (options.onClick) {
        options.onClick();
      }
    };

    return notification;
  }
} 