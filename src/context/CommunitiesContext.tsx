import { createContext, useContext, useState } from "react";
import { MOCK_COMMUNITIES, CURRENT_USER_ID } from "@/mock/data";
const CommunitiesContext = createContext<any>(null);
function CommunitiesProvider({ children }) {
  const [communities, setCommunities] = useState(MOCK_COMMUNITIES);
  function createCommunity(name, description, groupChatIds) {
    const id = `comm-${Date.now()}`;
    const community = {
      id,
      name: name.trim() || "New community",
      description: description.trim(),
      avatarColor: "#4a63f0",
      memberIds: [CURRENT_USER_ID],
      adminIds: [CURRENT_USER_ID],
      groupChatIds,
      createdAt: Date.now()
    };
    setCommunities((prev) => [community, ...prev]);
    return id;
  }
  function addGroupToCommunity(communityId, chatId) {
    setCommunities(
      (prev) => prev.map(
        (c) => c.id === communityId && !c.groupChatIds.includes(chatId) ? { ...c, groupChatIds: [...c.groupChatIds, chatId] } : c
      )
    );
  }
  return <CommunitiesContext.Provider value={{ communities, createCommunity, addGroupToCommunity }}>{children}</CommunitiesContext.Provider>;
}
function useCommunities() {
  const ctx = useContext(CommunitiesContext);
  if (!ctx) throw new Error("useCommunities must be used within CommunitiesProvider");
  return ctx;
}
export {
  CommunitiesProvider,
  useCommunities
};
