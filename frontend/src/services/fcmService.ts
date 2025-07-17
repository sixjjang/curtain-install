import { getMessaging, getToken, onMessage, MessagePayload } from "firebase/messaging";
import app from "../firebase/firebase";
import { Firestore } from "firebase/firestore";

// Get messaging instance
const messaging = app ? getMessaging(app) : null;

export interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  onClick?: () => void;
}

export async function requestNotificationPermission(): Promise<string | null> {
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

export function onMessageListener(callback: (payload: MessagePayload) => void): (() => void) | undefined {
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
export async function saveFCMTokenToUser(token: string, userId: string): Promise<void> {
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    const { db } = await import("../firebase/firebase");
    
    await setDoc(doc(db as Firestore, "users", userId), {
      fcmToken: token,
      lastTokenUpdate: new Date(),
    }, { merge: true });
    
    console.log("FCM token saved to user profile");
  } catch (error) {
    console.error("Error saving FCM token:", error);
  }
}

// Function to remove FCM token from user's profile
export async function removeFCMTokenFromUser(userId: string): Promise<void> {
  try {
    const { doc, updateDoc } = await import("firebase/firestore");
    const { db } = await import("../firebase/firebase");
    
    await updateDoc(doc(db as Firestore, "users", userId), {
      fcmToken: null,
      lastTokenUpdate: new Date(),
    });
    
    console.log("FCM token removed from user profile");
  } catch (error) {
    console.error("Error removing FCM token:", error);
  }
}

// Function to check if notifications are supported
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && 
         "Notification" in window && 
         "serviceWorker" in navigator &&
         messaging !== null;
}

// Function to get current notification permission status
export function getNotificationPermissionStatus(): NotificationPermission | "not-supported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "not-supported";
  }
  return Notification.permission;
}

// Function to display a custom notification
export function showCustomNotification(title: string, options: NotificationOptions = {}): Notification | null {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
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

  return null;
}

// Function to handle FCM message payload
export function handleFCMMessage(payload: MessagePayload): void {
  const { notification, data } = payload;
  
  if (notification) {
    showCustomNotification(notification.title || "새 알림", {
      body: notification.body,
      icon: notification.icon,
      image: notification.image,
      tag: data?.tag,
      data: data,
      onClick: () => {
        // Handle notification click based on data
        if (data?.url) {
          window.open(data.url, '_blank');
        }
        if (data?.action) {
          // Handle custom actions
          console.log("Custom action:", data.action);
        }
      }
    });
  }
}

// Function to initialize FCM for a user
export async function initializeFCMForUser(userId: string): Promise<string | null> {
  try {
    // Check if notifications are supported
    if (!isNotificationSupported()) {
      console.log("Notifications not supported");
      return null;
    }

    // Request permission and get token
    const token = await requestNotificationPermission();
    
    if (token) {
      // Save token to user profile
      await saveFCMTokenToUser(token, userId);
      
      // Set up message listener
      const unsubscribe = onMessageListener((payload) => {
        handleFCMMessage(payload);
      });
      
      // Return cleanup function
      return token;
    }
    
    return null;
  } catch (error) {
    console.error("Error initializing FCM:", error);
    return null;
  }
} 