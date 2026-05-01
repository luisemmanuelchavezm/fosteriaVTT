import type { CharacterAbilityResponse } from "../../../utils/dndApi";
import { PassiveRows } from "./shared";

interface PassivesTabProps {
  passiveAbilities: CharacterAbilityResponse[];
  abilityUsage: Record<number, boolean>;
  onToggleAbilityUsage: (abilityId: number) => void;
  onOpenPassiveDetails: (ability: CharacterAbilityResponse) => void;
}

export default function PassivesTab({
  passiveAbilities,
  abilityUsage,
  onToggleAbilityUsage,
  onOpenPassiveDetails,
}: PassivesTabProps) {
  return (
    <div className="mt-5 space-y-4">
      <h3 className="text-lg font-bold text-white">Pasivas</h3>
      <PassiveRows
        items={passiveAbilities}
        abilityUsage={abilityUsage}
        onToggleAbilityUsage={onToggleAbilityUsage}
        onOpenPassiveDetails={onOpenPassiveDetails}
      />
    </div>
  );
}
