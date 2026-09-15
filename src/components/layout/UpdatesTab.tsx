import { useState } from "react";
import { useStories } from "@/context/StoriesContext";
import { useAuth } from "@/context/AuthContext";
import { CURRENT_USER_ID } from "@/mock/data";
import { Avatar, EmptyState } from "@/components/common/Common";
import { StoryViewer, StoryComposer } from "@/components/chat/Stories";
function timeAgo(ts) {
  const mins = Math.round((Date.now() - ts) / 6e4);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
function UpdatesTab({ users }) {
  const { storiesByUser, hasUnviewed } = useStories();
  const { user: me } = useAuth();
  const [viewerUserId, setViewerUserId] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const otherUserIds = Object.keys(storiesByUser).filter((id) => id !== CURRENT_USER_ID);
  const myStories = storiesByUser[CURRENT_USER_ID] ?? [];
  const unviewedIds = otherUserIds.filter((id) => hasUnviewed(id));
  const viewedIds = otherUserIds.filter((id) => !hasUnviewed(id));
  function StatusRow({ userId }) {
    const u = users[userId];
    if (!u) return null;
    const stories = storiesByUser[userId] ?? [];
    const latest = stories[stories.length - 1];
    const unviewed = hasUnviewed(userId);
    return <button
      onClick={() => setViewerUserId(userId)}
      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
    ><div className={`rounded-full p-[2px] ${unviewed ? "bg-insta-gradient-soft" : "bg-slate-200 dark:bg-slate-700"}`}><div className="rounded-full bg-white p-[2px] dark:bg-slate-900"><Avatar user={u} size={48} /></div></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900 dark:text-white">{u.name}</p><p className="truncate text-xs text-slate-400">{latest ? timeAgo(latest.createdAt) : ""} · {stories.length} update{stories.length === 1 ? "" : "s"}</p></div></button>;
  }
  return <div className="flex h-full flex-col"><div className="px-4 py-3"><h2 className="text-base font-semibold text-slate-900 dark:text-white">Updates</h2></div><div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-2">{
    /* My status */
  }<button
    onClick={() => myStories.length > 0 ? setViewerUserId(CURRENT_USER_ID) : setComposerOpen(true)}
    className="mb-1 flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
  ><div className="relative">{me && <Avatar user={me} size={48} />}<span
    onClick={(e) => {
      e.stopPropagation();
      setComposerOpen(true);
    }}
    role="button"
    aria-label="Add status"
    className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-insta-gradient text-xs text-white ring-2 ring-white dark:ring-slate-900"
  >
              +
            </span></div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-900 dark:text-white">My status</p><p className="truncate text-xs text-slate-400">{myStories.length > 0 ? `${myStories.length} update${myStories.length === 1 ? "" : "s"} \xB7 Tap to view` : "Tap to add a status update"}</p></div></button>{unviewedIds.length > 0 && <><p className="mb-1 mt-3 px-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent updates</p>{unviewedIds.map((id) => <StatusRow key={id} userId={id} />)}</>}{viewedIds.length > 0 && <><p className="mb-1 mt-3 px-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Viewed updates</p>{viewedIds.map((id) => <StatusRow key={id} userId={id} />)}</>}{otherUserIds.length === 0 && <EmptyState title="No updates yet" description="When your contacts post a status, it'll show up here." />}</div>{viewerUserId && <StoryViewer
    userIds={viewerUserId === CURRENT_USER_ID ? [CURRENT_USER_ID] : otherUserIds}
    startUserId={viewerUserId}
    users={users}
    onClose={() => setViewerUserId(null)}
  />}{composerOpen && <StoryComposer onClose={() => setComposerOpen(false)} />}</div>;
}
export {
  UpdatesTab
};
