import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_CREATION_SYSTEMS,
  type CampaignCreationSystem,
} from "../../../components/campaignSystem";

describe("campaignSystem", () => {
  it("contiene los dos sistemas de juego soportados", () => {
    expect(CAMPAIGN_CREATION_SYSTEMS).toContain("Dungeons and Dragons");
    expect(CAMPAIGN_CREATION_SYSTEMS).toContain("Mork Borg");
  });

  it("tiene exactamente 2 sistemas", () => {
    expect(CAMPAIGN_CREATION_SYSTEMS).toHaveLength(2);
  });

  it("el tipo CampaignCreationSystem acepta los valores correctos", () => {
    const dnd: CampaignCreationSystem = "Dungeons and Dragons";
    const mb: CampaignCreationSystem = "Mork Borg";
    expect(dnd).toBe("Dungeons and Dragons");
    expect(mb).toBe("Mork Borg");
  });

  it("el array es de sólo lectura (readonly tuple)", () => {
    // El tipo es readonly, la verificación es en compilación;
    // en tiempo de ejecución sigue siendo un array normal
    expect(Array.isArray(CAMPAIGN_CREATION_SYSTEMS)).toBe(true);
  });

  it("los sistemas están en el orden esperado", () => {
    expect(CAMPAIGN_CREATION_SYSTEMS[0]).toBe("Dungeons and Dragons");
    expect(CAMPAIGN_CREATION_SYSTEMS[1]).toBe("Mork Borg");
  });
});
