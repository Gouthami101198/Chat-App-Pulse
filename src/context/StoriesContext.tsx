import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { MOCK_STORIES, CURRENT_USER_ID } from "@/mock/data";
const StoriesContext = createContext<any>(null);
function StoriesProvider({ children }) {
  const [stories, setStories] = useState(MOCK_STORIES);
  const addStory = useCallback((story) => {
    const now = Date.now();
    const newStory = {
      ...story,
      id: `story-${now}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      expiresAt: now + 1e3 * 60 * 60 * 24,
      viewedBy: []
    };
    setStories((prev) => [newStory, ...prev]);
  }, []);
  const markViewed = useCallback((storyId) => {
    setStories(
      (prev) => prev.map((s) => s.id === storyId && !s.viewedBy.includes(CURRENT_USER_ID) ? { ...s, viewedBy: [...s.viewedBy, CURRENT_USER_ID] } : s)
    );
  }, []);
  const storiesByUser = useMemo(() => {
    const now = Date.now();
    const grouped = {};
    stories.filter((s) => s.expiresAt > now).sort((a, b) => b.createdAt - a.createdAt).forEach((s) => {
      if (!grouped[s.userId]) grouped[s.userId] = [];
      grouped[s.userId].push(s);
    });
    Object.keys(grouped).forEach((uid) => grouped[uid].reverse());
    return grouped;
  }, [stories]);
  const hasUnviewed = useCallback(
    (userId) => (storiesByUser[userId] ?? []).some((s) => !s.viewedBy.includes(CURRENT_USER_ID)),
    [storiesByUser]
  );
  const value = useMemo(
    () => ({ stories, storiesByUser, addStory, markViewed, hasUnviewed }),
    [stories, storiesByUser, addStory, markViewed, hasUnviewed]
  );
  return <StoriesContext.Provider value={value}>{children}</StoriesContext.Provider>;
}
function useStories() {
  const ctx = useContext(StoriesContext);
  if (!ctx) throw new Error("useStories must be used within StoriesProvider");
  return ctx;
}
export {
  StoriesProvider,
  useStories
};
