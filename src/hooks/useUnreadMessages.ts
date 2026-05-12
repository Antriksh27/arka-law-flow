import { useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChat } from '@/hooks/useCometChat';

/**
 * Phase 2 perf: single source of truth for CometChat unread message count.
 * Replaces duplicate `setInterval(fetchUnreadCount, 30000)` logic in
 * Header.tsx and MobileDashboardHeader.tsx.
 *
 * Uses CometChat's real-time MessageListener for live updates, with a
 * lightweight 2-minute fallback poll in case the listener misses events.
 */

let cachedCount = 0;
const subscribers = new Set<(count: number) => void>();
let listenerInstalled = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;
const LISTENER_ID = 'global_unread_messages_listener';

const broadcast = (count: number) => {
  cachedCount = count;
  subscribers.forEach((cb) => cb(count));
};

const fetchCount = async () => {
  try {
    const loggedIn = await CometChat.getLoggedinUser();
    if (!loggedIn) return;
    const res = (await CometChat.getUnreadMessageCount()) as {
      users?: Record<string, number>;
      groups?: Record<string, number>;
    };
    const userTotal = res.users
      ? Object.values(res.users).reduce((s, n) => s + n, 0)
      : 0;
    const groupTotal = res.groups
      ? Object.values(res.groups).reduce((s, n) => s + n, 0)
      : 0;
    broadcast(userTotal + groupTotal);
  } catch (err) {
    console.warn('[useUnreadMessages] fetch failed', err);
  }
};

const installListenerOnce = () => {
  if (listenerInstalled) return;
  listenerInstalled = true;
  try {
    const ml = new CometChat.MessageListener({
      onTextMessageReceived: () => fetchCount(),
      onMediaMessageReceived: () => fetchCount(),
      onMessagesRead: () => fetchCount(),
      onMessagesDelivered: () => fetchCount(),
    });
    CometChat.addMessageListener(LISTENER_ID, ml);
  } catch (err) {
    console.warn('[useUnreadMessages] listener install failed', err);
  }
  // Lightweight fallback poll (2 minutes) in case listener drops.
  pollTimer = setInterval(fetchCount, 120_000);
};

export const useUnreadMessages = () => {
  const { isCometChatReady } = useCometChat();
  const [count, setCount] = useState<number>(cachedCount);

  useEffect(() => {
    subscribers.add(setCount);
    return () => {
      subscribers.delete(setCount);
    };
  }, []);

  useEffect(() => {
    if (!isCometChatReady) return;
    installListenerOnce();
    fetchCount();
  }, [isCometChatReady]);

  return count;
};
