const CURRENT_USER_ID = "u-1";
const MOCK_USERS = [
  {
    id: "u-1",
    name: "You",
    avatarColor: "#4a63f0",
    avatarUrl: "https://randomuser.me/api/portraits/men/85.jpg",
    status: "online",
    about: "Available"
  },
  {
    id: "u-2",
    name: "Priya Nair",
    avatarColor: "#e0678a",
    avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg",
    status: "online",
    about: "Product design lead \xB7 coffee enthusiast \u2615"
  },
  {
    id: "u-3",
    name: "Daniel Cho",
    avatarColor: "#2fa88a",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    status: "offline",
    lastSeen: Date.now() - 1e3 * 60 * 42,
    about: "Backend engineer \xB7 keeping the servers happy"
  },
  {
    id: "u-4",
    name: "Amara Diallo",
    avatarColor: "#e0a83f",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
    status: "online",
    about: "Living my best life \u2728 design systems nerd"
  },
  {
    id: "u-5",
    name: "Leo Martins",
    avatarColor: "#7a5cf0",
    avatarUrl: "https://randomuser.me/api/portraits/men/45.jpg",
    status: "away",
    lastSeen: Date.now() - 1e3 * 60 * 5,
    about: "Sleeping \u{1F634} catch you tomorrow"
  },
  {
    id: "u-6",
    name: "Sana Iqbal",
    avatarColor: "#3fb0e0",
    avatarUrl: "https://randomuser.me/api/portraits/women/56.jpg",
    status: "offline",
    lastSeen: Date.now() - 1e3 * 60 * 60 * 3,
    about: "Battery about to die \u{1F50B} text me instead"
  },
  // Local contacts
  {
    id: "u-7",
    name: "Karthik Subramaniam",
    avatarColor: "#5b8def",
    avatarUrl: "https://randomuser.me/api/portraits/men/76.jpg",
    status: "online",
    about: "Coding all night \xB7 full-stack dev"
  },
  {
    id: "u-8",
    name: "Divya Shah",
    avatarColor: "#f06a9b",
    avatarUrl: "https://randomuser.me/api/portraits/women/23.jpg",
    status: "offline",
    lastSeen: Date.now() - 1e3 * 60 * 18,
    about: "Chai first \u2615 then we talk"
  },
  {
    id: "u-9",
    name: "Arjun Mehta",
    avatarColor: "#f0954a",
    avatarUrl: "https://randomuser.me/api/portraits/men/18.jpg",
    status: "online",
    about: "Cricket > everything else"
  },
  {
    id: "u-10",
    name: "Fatima Sheikh",
    avatarColor: "#8a5cf0",
    avatarUrl: "https://randomuser.me/api/portraits/women/89.jpg",
    status: "away",
    lastSeen: Date.now() - 1e3 * 60 * 2,
    about: "On leave, back soon \u2014 ping if urgent"
  },
  {
    id: "u-11",
    name: "Ritu Verma",
    avatarColor: "#3fbf8f",
    avatarUrl: "https://randomuser.me/api/portraits/women/12.jpg",
    status: "online",
    about: "Design is thinking made visual"
  },
  {
    id: "u-12",
    name: "Vikram Rao",
    avatarColor: "#c94f4f",
    avatarUrl: "https://randomuser.me/api/portraits/men/61.jpg",
    status: "offline",
    lastSeen: Date.now() - 1e3 * 60 * 60 * 20,
    about: "Home is where the WiFi connects"
  },
  {
    id: "u-13",
    name: "Meera Krishnan",
    avatarColor: "#4fb3c9",
    avatarUrl: "https://randomuser.me/api/portraits/women/33.jpg",
    status: "online",
    about: "Amma \u2764\uFE0F family group admin"
  }
];
const MOCK_CHATS = [
  {
    id: "c-1",
    type: "direct",
    name: "Priya Nair",
    memberIds: ["u-1", "u-2"],
    createdAt: Date.now() - 1e3 * 60 * 60 * 24 * 6,
    unreadCount: 2
  },
  {
    id: "c-2",
    type: "group",
    name: "Design Sync",
    avatarUrl: "https://picsum.photos/seed/design-sync-pulse/200/200",
    memberIds: ["u-1", "u-2", "u-4", "u-5"],
    adminIds: ["u-1", "u-2"],
    createdAt: Date.now() - 1e3 * 60 * 60 * 24 * 20,
    unreadCount: 0,
    pinned: true
  },
  {
    id: "c-3",
    type: "direct",
    name: "Daniel Cho",
    memberIds: ["u-1", "u-3"],
    createdAt: Date.now() - 1e3 * 60 * 60 * 24 * 2,
    unreadCount: 0
  },
  {
    id: "c-4",
    type: "group",
    name: "Launch War Room",
    avatarUrl: "https://picsum.photos/seed/launch-war-room-pulse/200/200",
    memberIds: ["u-1", "u-3", "u-4", "u-5", "u-6"],
    adminIds: ["u-3"],
    createdAt: Date.now() - 1e3 * 60 * 60 * 24 * 1,
    unreadCount: 5
  },
  {
    id: "c-5",
    type: "direct",
    name: "Sana Iqbal",
    memberIds: ["u-1", "u-6"],
    createdAt: Date.now() - 1e3 * 60 * 60 * 24 * 12,
    unreadCount: 0
  },
  {
    id: "c-6",
    type: "direct",
    name: "Karthik Subramaniam",
    memberIds: ["u-1", "u-7"],
    createdAt: Date.now() - 1e3 * 60 * 60 * 24 * 3,
    unreadCount: 1
  },
  {
    id: "c-7",
    type: "direct",
    name: "Divya Shah",
    memberIds: ["u-1", "u-8"],
    createdAt: Date.now() - 1e3 * 60 * 60 * 24 * 9,
    unreadCount: 0
  },
  {
    id: "c-8",
    type: "group",
    name: "Family Group \u{1F3E0}",
    avatarUrl: "https://picsum.photos/seed/family-group-pulse/200/200",
    memberIds: ["u-1", "u-9", "u-11", "u-13"],
    adminIds: ["u-13"],
    createdAt: Date.now() - 1e3 * 60 * 60 * 24 * 30,
    unreadCount: 3
  },
  {
    id: "c-9",
    type: "direct",
    name: "Vikram Rao",
    memberIds: ["u-1", "u-12"],
    createdAt: Date.now() - 1e3 * 60 * 60 * 24 * 15,
    unreadCount: 0
  },
  {
    id: "c-10",
    type: "group",
    name: "College Friends",
    avatarUrl: "https://picsum.photos/seed/college-friends-pulse/200/200",
    memberIds: ["u-1", "u-7", "u-9", "u-10", "u-12"],
    adminIds: ["u-1", "u-9"],
    createdAt: Date.now() - 1e3 * 60 * 60 * 24 * 45,
    unreadCount: 0
  }
];
const MOCK_STORIES = [
  {
    id: "st-1",
    userId: "u-2",
    type: "image",
    mediaUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80&auto=format&fit=crop",
    createdAt: Date.now() - 1e3 * 60 * 60 * 3,
    expiresAt: Date.now() + 1e3 * 60 * 60 * 21,
    viewedBy: []
  },
  {
    id: "st-2",
    userId: "u-4",
    type: "text",
    text: "Coffee + design reviews \u2615\u2728",
    bgColor: "#e0a83f",
    createdAt: Date.now() - 1e3 * 60 * 60 * 5,
    expiresAt: Date.now() + 1e3 * 60 * 60 * 19,
    viewedBy: ["u-1"]
  },
  {
    id: "st-3",
    userId: "u-7",
    type: "video",
    mediaUrl: "https://videos.pexels.com/video-files/5495845/5495845-hd_1920_1080_30fps.mp4",
    createdAt: Date.now() - 1e3 * 60 * 60 * 8,
    expiresAt: Date.now() + 1e3 * 60 * 60 * 16,
    viewedBy: []
  },
  {
    id: "st-4",
    userId: "u-11",
    type: "text",
    text: "New portfolio piece dropping soon \u{1F3A8}",
    bgColor: "#3fbf8f",
    createdAt: Date.now() - 1e3 * 60 * 60 * 10,
    expiresAt: Date.now() + 1e3 * 60 * 60 * 14,
    viewedBy: []
  },
  {
    id: "st-5",
    userId: "u-13",
    type: "text",
    text: "Sunday lunch was amazing \u{1F60B}",
    bgColor: "#4fb3c9",
    createdAt: Date.now() - 1e3 * 60 * 60 * 14,
    expiresAt: Date.now() + 1e3 * 60 * 60 * 10,
    viewedBy: ["u-1"]
  }
];
const MOCK_COMMUNITIES = [
  {
    id: "comm-1",
    name: "Acme Product Team",
    description: "Everything related to shipping the Acme product \u2014 design, launch planning, and war-room coordination.",
    avatarColor: "#4a63f0",
    memberIds: ["u-1", "u-2", "u-3", "u-4", "u-5", "u-6"],
    adminIds: ["u-1", "u-2"],
    groupChatIds: ["c-2", "c-4"],
    createdAt: Date.now() - 1e3 * 60 * 60 * 24 * 40
  },
  {
    id: "comm-2",
    name: "Krishnan Family",
    description: "Family updates, plans, and Sunday lunch coordination \u{1F3E0}",
    avatarColor: "#4fb3c9",
    memberIds: ["u-1", "u-9", "u-11", "u-13"],
    adminIds: ["u-13"],
    groupChatIds: ["c-8"],
    createdAt: Date.now() - 1e3 * 60 * 60 * 24 * 60
  }
];
function msg(id, chatId, senderId, text, minutesAgo, extra = {}) {
  return {
    id,
    chatId,
    senderId,
    text,
    createdAt: Date.now() - minutesAgo * 60 * 1e3,
    status: "read",
    reactions: [],
    attachments: [],
    replyToId: null,
    editedAt: null,
    deletedAt: null,
    ...extra
  };
}
const MOCK_MESSAGES = [
  msg("m-1", "c-1", "u-2", "Hey! Did you get a chance to review the wireframes?", 120),
  msg("m-2", "c-1", "u-1", "Not yet, been heads down on the API work. Tomorrow morning for sure.", 118),
  msg("m-3", "c-1", "u-2", "No rush \u2014 just flag anything that feels off on the checkout flow.", 116),
  msg("m-4", "c-1", "u-2", "Also, are we still on for the 3pm sync?", 12, { status: "delivered" }),
  msg("m-5", "c-1", "u-2", "Let me know if that time still works for you \u{1F642}", 10, { status: "delivered" }),
  msg("m-6", "c-2", "u-4", "Pushed the updated color tokens to the shared library.", 300),
  msg("m-7", "c-2", "u-5", "Nice, the contrast on the dark theme buttons looks much better now.", 295),
  msg("m-8", "c-2", "u-2", "Agreed. One nit \u2014 the focus ring on inputs is barely visible in dark mode.", 290, {
    reactions: [{ emoji: "\u{1F44D}", userIds: ["u-4", "u-5"] }]
  }),
  msg("m-9", "c-2", "u-1", "Good catch, I will bump the ring opacity.", 288),
  msg("m-10", "c-3", "u-3", "Server migration finished without downtime \u{1F389}", 2800),
  msg("m-11", "c-3", "u-1", "That is a relief. Great work coordinating that.", 2795),
  msg("m-12", "c-4", "u-4", "Launch checklist is looking solid, two items left.", 40),
  msg("m-13", "c-4", "u-6", "I can take the analytics dashboard item.", 38),
  msg("m-14", "c-4", "u-3", "I will own the rollback plan doc.", 36),
  msg("m-15", "c-4", "u-5", "Sounds good. Standup tomorrow at 9?", 20, { status: "delivered" }),
  msg("m-16", "c-4", "u-4", "Works for me.", 18, { status: "delivered" }),
  msg("m-17", "c-4", "u-6", "Same here \u{1F44D}", 15, { status: "delivered" }),
  msg("m-18", "c-4", "u-3", "Locking it in \u2014 9am standup.", 14, { status: "delivered" }),
  msg("m-19", "c-4", "u-4", "See everyone there.", 13, { status: "delivered" }),
  msg("m-20", "c-5", "u-6", "Thanks for the intro to the vendor, that call went really well.", 5e3),
  msg("m-21", "c-6", "u-7", "Bro, pushed the hotfix to staging.", 200),
  msg("m-22", "c-6", "u-1", "Nice, testing it now.", 195),
  msg("m-23", "c-6", "u-7", "Let me know if the race condition is gone.", 25, { status: "delivered" }),
  msg("m-24", "c-7", "u-8", "Sending you the invoice PDF today.", 800),
  msg("m-25", "c-7", "u-1", "Perfect, thank you!", 795),
  msg("m-26", "c-8", "u-13", "Sunday lunch at our place, everyone come \u{1F60A}", 600),
  msg("m-27", "c-8", "u-9", "We will be there by 1pm.", 590),
  msg("m-28", "c-8", "u-11", "Bringing dessert!", 30, { status: "delivered" }),
  msg("m-29", "c-8", "u-13", "Yay, see you all soon.", 20, { status: "delivered" }),
  msg("m-30", "c-9", "u-12", "Long time! We should catch up sometime.", 4e3),
  msg("m-31", "c-9", "u-1", "Definitely, let us plan something this month.", 3990),
  msg("m-32", "c-10", "u-9", "Reunion trip planning thread \u2014 drop your dates!", 1500),
  msg("m-33", "c-10", "u-10", "I am free the second week of next month.", 1490),
  msg("m-34", "c-10", "u-12", "Same here, let us lock a place.", 1480)
];
function generateHistoricalMessages(chatId, memberIds, count = 120) {
  const out = [];
  const topics = [
    "Quick update on my end",
    "Any thoughts on this?",
    "Sounds good to me",
    "Let us circle back tomorrow",
    "Thanks for the heads up",
    "Sharing the doc now",
    "Can we push this to next week?",
    "Great progress everyone",
    "I will take a look shortly",
    "That makes sense"
  ];
  for (let i = count; i > 0; i--) {
    const sender = memberIds[i % memberIds.length];
    out.push(
      msg(
        `${chatId}-hist-${i}`,
        chatId,
        sender,
        `${topics[i % topics.length]} (#${count - i + 1})`,
        60 * 24 * 30 + i * 37
      )
    );
  }
  return out;
}
export {
  CURRENT_USER_ID,
  MOCK_CHATS,
  MOCK_COMMUNITIES,
  MOCK_MESSAGES,
  MOCK_STORIES,
  MOCK_USERS,
  generateHistoricalMessages
};
