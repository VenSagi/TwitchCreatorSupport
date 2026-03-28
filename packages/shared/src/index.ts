/** Socket.IO event names and payload shapes shared by web + api */

export const SOCKET_EVENTS = {
  JOIN_CAMPAIGN: "join_campaign",
  LEAVE_CAMPAIGN: "leave_campaign",
  CAMPAIGN_PROGRESS_UPDATED: "campaign_progress_updated",
  NEW_SUPPORT_EVENT: "new_support_event",
  LEADERBOARD_UPDATED: "leaderboard_updated",
  REWARD_UNLOCKED: "reward_unlocked",
  CAMPAIGN_COMPLETED: "campaign_completed",
} as const;

export type CampaignProgressPayload = {
  campaignId: string;
  currentAmount: number;
  goalAmount: number;
  progressPercent: number;
};

export type NewSupportEventPayload = {
  campaignId: string;
  eventId: string;
  amount: number;
  currency: string;
  supporterDisplayName: string;
  message?: string | null;
  createdAt: string;
};

export type LeaderboardUpdatedPayload = {
  campaignId: string;
  entries: Array<{
    viewerId: string;
    displayName: string;
    totalContribution: number;
    rank: number;
  }>;
};
