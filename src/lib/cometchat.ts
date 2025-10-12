import { CometChatUIKit, UIKitSettingsBuilder } from "@cometchat/chat-uikit-react";

// CometChat Configuration
const COMETCHAT_CONSTANTS = {
  APP_ID: "1669966b49b4aea85", // Replace with your CometChat App ID
  REGION: "in", // Replace with your region (us, eu, in)
  AUTH_KEY: "1ea8ba465c0006d6d01f059f58095d2582b9284c", // Replace with your Auth Key
};

// Validate that credentials are configured
const validateCredentials = () => {
  if (!COMETCHAT_CONSTANTS.APP_ID || COMETCHAT_CONSTANTS.APP_ID === "YOUR_APP_ID") {
    throw new Error("CometChat APP_ID is not configured. Please check src/lib/cometchat.ts");
  }
  if (!COMETCHAT_CONSTANTS.AUTH_KEY || COMETCHAT_CONSTANTS.AUTH_KEY === "YOUR_AUTH_KEY") {
    throw new Error("CometChat AUTH_KEY is not configured. Please check src/lib/cometchat.ts");
  }
  if (!COMETCHAT_CONSTANTS.REGION || COMETCHAT_CONSTANTS.REGION === "YOUR_REGION") {
    throw new Error("CometChat REGION is not configured. Please check src/lib/cometchat.ts");
  }
};

export const initCometChat = async (): Promise<boolean> => {
  try {
    validateCredentials();
  } catch (error: any) {
    console.error("CometChat credentials validation failed:", error.message);
    return false;
  }

  const UIKitSettings = new UIKitSettingsBuilder()
    .setAppId(COMETCHAT_CONSTANTS.APP_ID)
    .setRegion(COMETCHAT_CONSTANTS.REGION)
    .setAuthKey(COMETCHAT_CONSTANTS.AUTH_KEY)
    .subscribePresenceForAllUsers()
    .build();

  try {
    await CometChatUIKit.init(UIKitSettings);
    console.log("✅ CometChat UI Kit initialized successfully");
    console.log("   APP_ID:", COMETCHAT_CONSTANTS.APP_ID);
    console.log("   REGION:", COMETCHAT_CONSTANTS.REGION);
    return true;
  } catch (error: any) {
    console.error("❌ CometChat UI Kit initialization failed:", error);
    console.error("   APP_ID:", COMETCHAT_CONSTANTS.APP_ID);
    console.error("   REGION:", COMETCHAT_CONSTANTS.REGION);
    console.error("   Error details:", error?.message || error);
    return false;
  }
};

export const loginCometChatUser = async (userId: string, userName: string) => {
  try {
    // Check if already logged in
    const loggedInUser = await CometChatUIKit.getLoggedinUser();
    if (loggedInUser) {
      console.log("✅ User already logged in to CometChat:", loggedInUser.getName());
      return loggedInUser;
    }

    console.log("🔄 Attempting CometChat login for user:", userId);
    // Try to login with just UID (SDK will use auth key from init)
    const user = await CometChatUIKit.login(userId);
    console.log("✅ CometChat login successful:", user.getName());
    return user;
  } catch (error: any) {
    // If user doesn't exist, create them
    if (error?.code === "ERR_UID_NOT_FOUND") {
      console.log("📝 User not found, creating new user...");
      return await createCometChatUser(userId, userName);
    }

    // Log detailed error information
    console.error("❌ CometChat login failed:");
    console.error("   User ID:", userId);
    console.error("   Error code:", error?.code);
    console.error("   Error name:", error?.name);
    console.error("   Error message:", error?.message);
    console.error("   AUTH_KEY (first 10 chars):", COMETCHAT_CONSTANTS.AUTH_KEY?.substring(0, 10) + "...");

    if (error?.code === "FAILED_TO_FETCH") {
      throw new Error(
        "Failed to connect to CometChat. Please verify:\n" +
          "1. Your APP_ID matches your CometChat dashboard\n" +
          "2. Your REGION is correct (us, eu, or in)\n" +
          "3. Your AUTH_KEY is valid and not expired\n" +
          "4. The APP_ID exists in the specified region",
      );
    }

    throw error;
  }
};

export const createCometChatUser = async (userId: string, userName: string) => {
  // Import CometChat from SDK to create User object
  const { CometChat } = await import('@cometchat/chat-sdk-javascript');
  
  try {
    const user = new CometChat.User(userId);
    user.setName(userName);
    
    const createdUser = await CometChatUIKit.createUser(user);
    console.log("User created successfully:", createdUser);

    // Now login the newly created user
    const loggedInUser = await CometChatUIKit.login(userId);
    return loggedInUser;
  } catch (error) {
    console.error("Error creating CometChat user:", error);
    throw error;
  }
};

export const logoutCometChat = async () => {
  try {
    await CometChatUIKit.logout();
    console.log("CometChat logout successful");
  } catch (error) {
    console.error("CometChat logout error:", error);
  }
};

export { CometChatUIKit };

// Export CometChat SDK for direct access
export { CometChat } from '@cometchat/chat-sdk-javascript';
