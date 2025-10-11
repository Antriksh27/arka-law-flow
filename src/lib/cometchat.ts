import { CometChat } from '@cometchat/chat-sdk-javascript';

// CometChat Configuration
const COMETCHAT_CONSTANTS = {
  APP_ID: '2673521e50b00f81', // Replace with your CometChat App ID
  REGION: 'us', // Replace with your region (us, eu, in)
  AUTH_KEY: '3c4e925d4f0c7b9ab5d2e8f1a6c9d3e7' // Replace with your Auth Key
};

export const initCometChat = async (): Promise<boolean> => {
  const appSetting = new CometChat.AppSettingsBuilder()
    .subscribePresenceForAllUsers()
    .setRegion(COMETCHAT_CONSTANTS.REGION)
    .autoEstablishSocketConnection(true)
    .build();

  try {
    await CometChat.init(COMETCHAT_CONSTANTS.APP_ID, appSetting);
    console.log('CometChat initialized successfully');
    return true;
  } catch (error) {
    console.error('CometChat initialization failed:', error);
    return false;
  }
};

export const loginCometChatUser = async (userId: string, userName: string) => {
  try {
    // Check if already logged in
    const loggedInUser = await CometChat.getLoggedinUser();
    if (loggedInUser) {
      console.log('User already logged in to CometChat');
      return loggedInUser;
    }

    // Try to login
    const user = await CometChat.login(userId, COMETCHAT_CONSTANTS.AUTH_KEY);
    console.log('Login successful:', user);
    return user;
  } catch (error: any) {
    // If user doesn't exist, create them
    if (error?.code === 'ERR_UID_NOT_FOUND') {
      console.log('User not found, creating new user...');
      return await createCometChatUser(userId, userName);
    }
    console.error('CometChat login error:', error);
    throw error;
  }
};

export const createCometChatUser = async (userId: string, userName: string) => {
  const user = new CometChat.User(userId);
  user.setName(userName);

  try {
    const createdUser = await CometChat.createUser(user, COMETCHAT_CONSTANTS.AUTH_KEY);
    console.log('User created successfully:', createdUser);
    
    // Now login the newly created user
    const loggedInUser = await CometChat.login(userId, COMETCHAT_CONSTANTS.AUTH_KEY);
    return loggedInUser;
  } catch (error) {
    console.error('Error creating CometChat user:', error);
    throw error;
  }
};

export const logoutCometChat = async () => {
  try {
    await CometChat.logout();
    console.log('CometChat logout successful');
  } catch (error) {
    console.error('CometChat logout error:', error);
  }
};

export const getCometChatUsers = async (limit: number = 30): Promise<CometChat.User[]> => {
  const usersRequest = new CometChat.UsersRequestBuilder()
    .setLimit(limit)
    .build();

  try {
    const usersList = await usersRequest.fetchNext();
    return usersList;
  } catch (error) {
    console.error('Error fetching CometChat users:', error);
    return [];
  }
};

export { CometChat };
