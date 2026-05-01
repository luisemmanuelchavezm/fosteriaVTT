import { useMemo, useState } from "react";
import type {
  CharacterAbilityResponse,
  CharacterInventoryItemResponse,
  DndCharacterDetailResponse,
} from "../../utils/dndApi";
import type { DndCompetencyCatalog } from "../../types";
import { SPELL_LEVELS, type DetailTab } from "../data";
import {
  getAbilityModifierByName,
  getCharacterLanguages,
  getProficiencyBonus,
  getSpellLevel,
  isActionAbility,
  isPassiveAbility,
  isSpellAbility,
  isWeaponArmorCompetencyName,
  parseBiographySections,
} from "../utils";
import ActionsTab from "./detailTabs/ActionsTab";
import BiographyTab from "./detailTabs/BiographyTab";
import InventoryTab from "./detailTabs/InventoryTab";
import PassivesTab from "./detailTabs/PassivesTab";
import SpellsTab from "./detailTabs/SpellsTab";
import {
  inferToolCategory,
  normalizeCompetencyValue,
} from "./detailTabs/sharedUtils";

interface DetailTabsSectionProps {
  character: DndCharacterDetailResponse;
  activeTab: DetailTab;
  abilityUsage: Record<number, boolean>;
  isEditMode?: boolean;
  editableAlignment?: string;
  editableLanguagesText?: string;
  editablePersonalHistory?: string;
  editableWeaponArmorCompetencies: string[];
  editableToolCompetencies: string[];
  onTabChange: (tab: DetailTab) => void;
  onRollWeaponAttack: (weaponName: string, bonus: number | null) => void;
  onRollSpellAttack: (bonus: number) => void;
  onRollActionDamage: (action: CharacterAbilityResponse) => void;
  onOpenSpellDetails: (spell: CharacterAbilityResponse) => void;
  onRollSpellExpression: (label: string, expression: string) => void;
  onToggleAbilityUsage: (abilityId: number) => void;
  onToggleInventoryEquip: (itemId: number, equipped: boolean) => void;
  onOpenPassiveDetails: (ability: CharacterAbilityResponse) => void;
  onOpenInventoryDetails: (item: CharacterInventoryItemResponse) => void;
  onOpenAddInventory: () => void;
  onOpenAddSpell: () => void;
  onAlignmentChange?: (value: string) => void;
  onLanguagesTextChange?: (value: string) => void;
  onPersonalHistoryChange?: (value: string) => void;
  onRemoveWeaponArmorCompetency?: (value: string) => void;
  onRemoveToolCompetency?: (value: string) => void;
  onAddWeaponArmorCompetency?: (value: string) => void;
  onAddToolCompetency?: (value: string) => void;
  classCompetencies: string[];
  competencyCatalog: DndCompetencyCatalog | null;
}

export default function DetailTabsSection({
  character,
  activeTab,
  abilityUsage,
  isEditMode = false,
  editableAlignment,
  editableLanguagesText,
  editablePersonalHistory,
  editableWeaponArmorCompetencies,
  editableToolCompetencies,
  onTabChange,
  onRollWeaponAttack,
  onRollSpellAttack,
  onRollActionDamage,
  onOpenSpellDetails,
  onRollSpellExpression,
  onToggleAbilityUsage,
  onToggleInventoryEquip,
  onOpenPassiveDetails,
  onOpenInventoryDetails,
  onOpenAddInventory,
  onOpenAddSpell,
  onAlignmentChange,
  onLanguagesTextChange,
  onPersonalHistoryChange,
  onRemoveWeaponArmorCompetency,
  onRemoveToolCompetency,
  onAddWeaponArmorCompetency,
  onAddToolCompetency,
  classCompetencies,
  competencyCatalog,
}: DetailTabsSectionProps) {
  const [weaponArmorSearch, setWeaponArmorSearch] = useState("");
  const [toolSearch, setToolSearch] = useState("");
  const [weaponArmorFilter, setWeaponArmorFilter] = useState<
    "all" | "weapon" | "armor"
  >("all");
  const [toolFilter, setToolFilter] = useState<
    "all" | "instrumentos" | "juegos" | "otros"
  >("all");

  const proficiencyBonus = useMemo(
    () => getProficiencyBonus(character),
    [character],
  );
  const spellcastingModifier = useMemo(
    () =>
      character.caracteristicaLanzamientoConjuros
        ? getAbilityModifierByName(
            character,
            character.caracteristicaLanzamientoConjuros,
          )
        : null,
    [character],
  );
  const spellAttackBonus = useMemo(
    () =>
      spellcastingModifier === null
        ? null
        : spellcastingModifier + proficiencyBonus,
    [proficiencyBonus, spellcastingModifier],
  );
  const spellSaveDc = useMemo(
    () => (spellAttackBonus === null ? null : 8 + spellAttackBonus),
    [spellAttackBonus],
  );
  const cantrips = useMemo(
    () => character.habilidades.filter((item) => getSpellLevel(item) === 0),
    [character],
  );
  const spellsByLevel = useMemo(
    () =>
      SPELL_LEVELS.map((level) => ({
        level,
        spells: character.habilidades.filter(
          (item) => getSpellLevel(item) === level,
        ),
      })).filter((group) => group.spells.length > 0),
    [character],
  );
  const passiveAbilities = useMemo(
    () =>
      character.habilidades
        .filter((item) => isPassiveAbility(item))
        .sort((left, right) => left.nombre.localeCompare(right.nombre, "es")),
    [character],
  );
  const equipmentItems = useMemo(
    () =>
      character.mochila.filter(
        (item) => item.tipoObjeto === "ARMA" || item.tipoObjeto === "ARMADURA",
      ),
    [character],
  );
  const additionalItems = useMemo(
    () =>
      character.mochila.filter(
        (item) => item.tipoObjeto !== "ARMA" && item.tipoObjeto !== "ARMADURA",
      ),
    [character],
  );
  const actionAbilities = useMemo(
    () =>
      character.habilidades.filter(
        (item) => isActionAbility(item) && !isSpellAbility(item),
      ),
    [character],
  );
  const biographySections = useMemo(
    () => parseBiographySections(character.biografia),
    [character.biografia],
  );
  const languages = useMemo(
    () => getCharacterLanguages(character),
    [character],
  );
  const weaponArmorCatalog = useMemo(
    () =>
      [...(competencyCatalog?.armasArmaduras ?? []), ...classCompetencies]
        .filter((item) => isWeaponArmorCompetencyName(item, competencyCatalog))
        .filter(
          (value, index, values) =>
            values.findIndex(
              (entry) =>
                normalizeCompetencyValue(entry) ===
                normalizeCompetencyValue(value),
            ) === index,
        )
        .sort((left, right) => left.localeCompare(right, "es")),
    [classCompetencies, competencyCatalog],
  );
  const toolCatalog = useMemo(
    () =>
      [
        ...(competencyCatalog?.herramientas ?? []).map((item) => ({
          name: item,
          category: inferToolCategory(item),
        })),
        ...classCompetencies
          .filter(
            (item) => !isWeaponArmorCompetencyName(item, competencyCatalog),
          )
          .map((item) => ({ name: item, category: inferToolCategory(item) })),
      ]
        .filter(
          (value, index, values) =>
            values.findIndex(
              (entry) =>
                normalizeCompetencyValue(entry.name) ===
                normalizeCompetencyValue(value.name),
            ) === index,
        )
        .sort((left, right) => left.name.localeCompare(right.name, "es")),
    [classCompetencies, competencyCatalog],
  );
  const filteredWeaponArmorCatalog = useMemo(
    () =>
      weaponArmorCatalog.filter((value) => {
        const normalized = normalizeCompetencyValue(value);
        if (
          editableWeaponArmorCompetencies.some(
            (entry) => normalizeCompetencyValue(entry) === normalized,
          )
        ) {
          return false;
        }
        if (
          weaponArmorFilter === "weapon" &&
          normalized.includes(normalizeCompetencyValue("armadura"))
        ) {
          return false;
        }
        if (
          weaponArmorFilter === "armor" &&
          !normalized.includes(normalizeCompetencyValue("armadura")) &&
          !normalized.includes(normalizeCompetencyValue("escudo"))
        ) {
          return false;
        }
        return normalized.includes(normalizeCompetencyValue(weaponArmorSearch));
      }),
    [
      editableWeaponArmorCompetencies,
      weaponArmorCatalog,
      weaponArmorFilter,
      weaponArmorSearch,
    ],
  );
  const filteredToolCatalog = useMemo(
    () =>
      toolCatalog.filter((value) => {
        if (
          editableToolCompetencies.some(
            (entry) =>
              normalizeCompetencyValue(entry) ===
              normalizeCompetencyValue(value.name),
          )
        ) {
          return false;
        }
        if (toolFilter !== "all" && value.category !== toolFilter) {
          return false;
        }
        return normalizeCompetencyValue(value.name).includes(
          normalizeCompetencyValue(toolSearch),
        );
      }),
    [editableToolCompetencies, toolCatalog, toolFilter, toolSearch],
  );

  return (
    <div className="rounded-[28px] border border-white/10 bg-black/15 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {[
          { id: "actions", label: "Acciones" },
          { id: "spells", label: "Hechizos" },
          { id: "passives", label: "Pasivas" },
          { id: "inventory", label: "Mochila" },
          { id: "biography", label: "Biografía" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id as DetailTab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-amber-200 text-stone-950"
                : "border border-white/10 bg-white/5 text-stone-200 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "actions" ? (
        <ActionsTab
          character={character}
          actionAbilities={actionAbilities}
          onRollWeaponAttack={onRollWeaponAttack}
          onRollActionDamage={onRollActionDamage}
        />
      ) : null}

      {activeTab === "spells" ? (
        <SpellsTab
          spellcastingModifier={spellcastingModifier}
          spellAttackBonus={spellAttackBonus}
          spellSaveDc={spellSaveDc}
          cantrips={cantrips}
          spellsByLevel={spellsByLevel}
          abilityUsage={abilityUsage}
          characteristicName={
            character.caracteristicaLanzamientoConjuros ?? null
          }
          onOpenAddSpell={onOpenAddSpell}
          onRollSpellAttack={onRollSpellAttack}
          onOpenSpellDetails={onOpenSpellDetails}
          onRollSpellExpression={onRollSpellExpression}
          onToggleAbilityUsage={onToggleAbilityUsage}
        />
      ) : null}

      {activeTab === "passives" ? (
        <PassivesTab
          passiveAbilities={passiveAbilities}
          abilityUsage={abilityUsage}
          onToggleAbilityUsage={onToggleAbilityUsage}
          onOpenPassiveDetails={onOpenPassiveDetails}
        />
      ) : null}

      {activeTab === "inventory" ? (
        <InventoryTab
          equipmentItems={equipmentItems}
          additionalItems={additionalItems}
          onToggleInventoryEquip={onToggleInventoryEquip}
          onOpenInventoryDetails={onOpenInventoryDetails}
          onOpenAddInventory={onOpenAddInventory}
        />
      ) : null}

      {activeTab === "biography" ? (
        <BiographyTab
          isEditMode={isEditMode}
          languages={languages}
          biographySections={biographySections}
          editableLanguagesText={editableLanguagesText}
          editableAlignment={editableAlignment}
          editablePersonalHistory={editablePersonalHistory}
          editableWeaponArmorCompetencies={editableWeaponArmorCompetencies}
          editableToolCompetencies={editableToolCompetencies}
          filteredWeaponArmorCatalog={filteredWeaponArmorCatalog}
          filteredToolCatalog={filteredToolCatalog}
          onLanguagesTextChange={onLanguagesTextChange}
          onAlignmentChange={onAlignmentChange}
          onPersonalHistoryChange={onPersonalHistoryChange}
          onRemoveWeaponArmorCompetency={onRemoveWeaponArmorCompetency}
          onRemoveToolCompetency={onRemoveToolCompetency}
          onAddWeaponArmorCompetency={onAddWeaponArmorCompetency}
          onAddToolCompetency={onAddToolCompetency}
          onWeaponArmorSearchChange={setWeaponArmorSearch}
          onToolSearchChange={setToolSearch}
          onWeaponArmorFilterChange={setWeaponArmorFilter}
          onToolFilterChange={setToolFilter}
          weaponArmorSearch={weaponArmorSearch}
          toolSearch={toolSearch}
          weaponArmorFilter={weaponArmorFilter}
          toolFilter={toolFilter}
        />
      ) : null}
    </div>
  );
}
