# Firebase Cloud Messaging (FCM) Setup Guide

This guide explains how to set up Firebase Cloud Messaging for push notifications in the curtain installation platform.

## Prerequisites

1. Firebase project with Cloud Messaging enabled
2. VAPID key generated from Firebase Console
3. Service worker file in the public directory

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
```

## Firebase Console Setup

### 1. Enable Cloud Messaging
1. Go to Firebase Console → Your Project
2. Navigate to Project Settings → Cloud Messaging
3. Enable Cloud Messaging if not already enabled

### 2. Generate VAPID Key
1. In Cloud Messaging settings, scroll to "Web configuration"
2. Click "Generate key pair" to create a VAPID key
3. Copy the generated key and add it to your environment variables

### 3. Update Service Worker
Update the `public/firebase-messaging-sw.js` file with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-actual-auth-domain",
  projectId: "your-actual-project-id",
  storageBucket: "your-actual-storage-bucket",
  messagingSenderId: "your-actual-messaging-sender-id",
  appId: "your-actual-app-id"
};
```

## Usage

### 1. FCM Token Manager Component

The `FcmTokenManager` component automatically handles:
- Requesting notification permissions
- Generating FCM tokens
- Storing tokens in Firestore
- Handling token refresh

```javascript
import FcmTokenManager from './components/FcmTokenManager';

// Use in your advertiser component
<FcmTokenManager advertiserId={advertiserId} />
```

### 2. Foreground Message Handling

Use the `useFcmMessages` hook to handle messages when the app is in the foreground:

```javascript
import useFcmMessages from '../hooks/useFcmMessages';

const MyComponent = () => {
  const handleMessage = (payload) => {
    console.log('Message received:', payload);
    // Handle the message
  };

  useFcmMessages(handleMessage);
  
  return <div>Your component</div>;
};
```

### 3. Complete Example

See `AdvertiserProfile.js` for a complete example of:
- FCM token management
- Permission handling
- Message display
- UI for notification status

## Sending Notifications

### From Firebase Functions

```javascript
const admin = require('firebase-admin');

const sendNotification = async (token, title, body, data = {}) => {
  const message = {
    notification: {
      title,
      body,
    },
    data,
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.log('Error sending message:', error);
    throw error;
  }
};
```

### From Admin Dashboard

You can send notifications to specific advertisers using their stored FCM tokens:

```javascript
// Get advertiser's FCM token from Firestore
const advertiserDoc = await db.collection('advertisers').doc(advertiserId).get();
const fcmToken = advertiserDoc.data().fcmToken;

if (fcmToken) {
  await sendNotification(fcmToken, 'Settlement Complete', 'Your monthly settlement has been processed');
}
```

## Testing

### 1. Browser Testing
1. Open your app in a supported browser (Chrome, Firefox, Safari)
2. Grant notification permissions when prompted
3. Check browser console for FCM token generation logs
4. Send a test notification from Firebase Console

### 2. Token Verification
Check that tokens are being saved in Firestore:
```javascript
// In Firebase Console → Firestore
// Check the 'advertisers' collection for fcmToken field
```

### 3. Permission Testing
Test different permission scenarios:
- Grant permission
- Deny permission
- Block notifications in browser settings

## Troubleshooting

### Common Issues

1. **"Messaging not available" error**
   - Ensure Firebase config is correct
   - Check that messaging is enabled in Firebase Console

2. **Token not generating**
   - Verify VAPID key is correct
   - Check notification permissions
   - Ensure service worker is properly registered

3. **Notifications not showing**
   - Check browser notification settings
   - Verify service worker is active
   - Test with Firebase Console test message

### Debug Logs

Enable debug logging by checking browser console for:
- FCM token generation
- Permission status
- Message reception
- Token refresh events

## Security Considerations

1. **VAPID Key**: Keep your VAPID key secure and never expose it in client-side code that's not environment variables
2. **Token Storage**: FCM tokens are stored in Firestore with proper security rules
3. **Permission**: Always request user permission before enabling notifications
4. **Rate Limiting**: Implement rate limiting for notification sending to prevent abuse

## Browser Support

FCM is supported in:
- Chrome 42+
- Firefox 44+
- Safari 16+
- Edge 17+

Note: Some features may not work in all browsers or require HTTPS. 