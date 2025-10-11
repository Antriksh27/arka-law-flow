# CometChat Integration Setup

This app includes real-time chat functionality powered by CometChat.

## Setup Instructions

### 1. Create a CometChat Account

1. Visit [CometChat Dashboard](https://app.cometchat.com/)
2. Sign up for a free account
3. Create a new app

### 2. Get Your Credentials

From your CometChat dashboard, you'll need:

- **APP_ID**: Your application ID
- **REGION**: Your app region (us, eu, or in)
- **AUTH_KEY**: Your authentication key

### 3. Configure the App

Open `src/lib/cometchat.ts` and update the following constants:

```typescript
const COMETCHAT_CONSTANTS = {
  APP_ID: 'YOUR_APP_ID',      // Replace with your App ID
  REGION: 'us',                // Replace with your region
  AUTH_KEY: 'YOUR_AUTH_KEY'   // Replace with your Auth Key
};
```

### 4. Features

The chat system includes:

- ✅ Real-time one-on-one messaging
- ✅ Automatic user creation on first login
- ✅ Integration with Supabase authentication
- ✅ Typing indicators
- ✅ Read receipts (delivered, read)
- ✅ Online/offline status
- ✅ Unread message counts
- ✅ Responsive UI matching the app design

### 5. Usage

Once configured, users will automatically be logged into CometChat when they sign in to the app. Navigate to `/chat` to start messaging.

### 6. User Management

- Users are automatically created in CometChat when they first log in
- User ID from Supabase is used as the CometChat UID
- User's full name (or email) is set as their display name

### 7. Troubleshooting

If you encounter issues:

1. Check the browser console for errors
2. Verify your CometChat credentials are correct
3. Ensure your CometChat app is active in the dashboard
4. Check that your Supabase authentication is working

### 8. Future Enhancements

Potential additions:

- Group chat functionality
- File/image sharing
- Voice/video calls
- Message search
- Chat metadata storage in Supabase
