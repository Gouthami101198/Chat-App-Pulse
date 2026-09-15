import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useChat } from "@/context/ChatContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { EmptyState, Spinner } from "@/components/common/Common";
function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { chats, chatOrder, chatsLoaded, setActiveChat } = useChat();
  useEffect(() => {
    setActiveChat(chatId ?? null);
  }, [chatId, setActiveChat]);
  useEffect(() => {
    if (chatsLoaded && !chatId && chatOrder.length > 0 && window.innerWidth >= 768) {
      navigate(`/chat/${chatOrder[0]}`, { replace: true });
    }
  }, [chatsLoaded, chatId, chatOrder, navigate]);
  const activeChat = chatId ? chats[chatId] : void 0;
  if (!chatsLoaded) {
    return <div className="flex h-screen items-center justify-center"><Spinner size={28} /></div>;
  }
  return <div className="flex h-screen overflow-hidden"><div className={`h-full ${activeChat ? "hidden md:block" : "block"} md:w-80`}><Sidebar activeChatId={chatId ?? null} onSelectChat={(id) => navigate(`/chat/${id}`)} /></div><div className={`h-full min-w-0 flex-1 ${activeChat ? "block" : "hidden md:block"}`}>{activeChat ? <ChatWindow chat={activeChat} onBack={() => navigate("/chat")} /> : <EmptyState
    title="Select a conversation"
    description="Choose a chat from the list to start messaging."
  />}</div></div>;
}
export {
  ChatPage
};
