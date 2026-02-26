// ── Channel fixtures ─────────────────────────────────────────────────────────

export const mockChannel = {
  id: "channel-1",
  name: "House Vibes",
  description: "Deep house and beyond",
  genre: "House",
  isPublic: false,
  userId: "user-1",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockChannelWithCount = {
  ...mockChannel,
  _count: { tracks: 5 },
};

export const mockChannels = [
  mockChannelWithCount,
  {
    ...mockChannel,
    id: "channel-2",
    name: "Trance Territory",
    genre: "Trance",
    _count: { tracks: 12 },
  },
];
