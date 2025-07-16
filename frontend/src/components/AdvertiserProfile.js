import React, { useState } from "react";
import FcmTokenManager from "./FcmTokenManager";
import useFcmMessages from "../hooks/useFcmMessages";

const AdvertiserProfile = ({ advertiserId }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState("default");

  // Handle incoming FCM messages
  const handleMessageReceived = (payload) => {
    setNotifications(prev => [payload, ...prev.slice(0, 9)]); // Keep last 10 notifications
    
    // You can handle different types of messages here
    if (payload.data?.type === "settlement") {
      // Handle settlement notification
      console.log("Settlement notification received:", payload.data);
    } else if (payload.data?.type === "ad_status") {
      // Handle ad status change notification
      console.log("Ad status notification received:", payload.data);
    }
  };

  // Use the FCM messages hook
  useFcmMessages(handleMessageReceived);

  // Check notification permission status
  React.useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Advertiser Profile</h1>
      
      {/* FCM Token Manager - This handles token generation and storage */}
      <FcmTokenManager advertiserId={advertiserId} />
      
      {/* Notification Permission Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Push Notifications</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 mb-2">
              Status: <span className={`font-medium ${
                notificationPermission === "granted" ? "text-green-600" :
                notificationPermission === "denied" ? "text-red-600" : "text-yellow-600"
              }`}>
                {notificationPermission === "granted" ? "Enabled" :
                 notificationPermission === "denied" ? "Disabled" : "Not Set"}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Receive notifications about ad performance, settlements, and important updates.
            </p>
          </div>
          
          {notificationPermission !== "granted" && (
            <button
              onClick={requestNotificationPermission}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Enable Notifications
            </button>
          )}
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
        
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No notifications yet. Notifications will appear here when you receive them.
          </p>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {notification.notification?.title || notification.data?.title || "Notification"}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {notification.notification?.body || notification.data?.body || "No message content"}
                    </p>
                    {notification.data && (
                      <div className="mt-2 text-xs text-gray-500">
                        {Object.entries(notification.data).map(([key, value]) => (
                          <span key={key} className="mr-4">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvertiserProfile; 