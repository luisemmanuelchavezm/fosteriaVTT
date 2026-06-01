export const CAMPAIGN_CREATION_SYSTEMS = [
  "Dungeons and Dragons",
  "Mork Borg",
] as const;

export type CampaignCreationSystem = (typeof CAMPAIGN_CREATION_SYSTEMS)[number];
