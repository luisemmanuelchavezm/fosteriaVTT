export const CAMPAIGN_CREATION_SYSTEMS = [
  "Dungeons and Dragons",
  "Call Of Cthulhu",
] as const;

export type CampaignCreationSystem = (typeof CAMPAIGN_CREATION_SYSTEMS)[number];
