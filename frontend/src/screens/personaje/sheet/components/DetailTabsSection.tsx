import { useMemo } from "react";
import type {
  CharacterAbilityResponse,
  CharacterInventoryItemResponse,
  DndCharacterDetailResponse,
} from "../../utils/dndApi";
import { PROFICIENCY_BONUS, SPELL_LEVELS } from "../data";
import type { DetailTab } from "../data";
import {
  formatSignedValue,
  getAbilityModifierByName,
  getInventoryTagLabel,
  getSpellLevel,
} from "../utils";
import { EmptyRowsMessage } from "./SheetPrimitives";

interface DetailTabsSectionProps {
  character: DndCharacterDetailResponse;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}

function SpellRows({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: CharacterAbilityResponse[];
  emptyMessage: string;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-bold text-white">{title}</h4>
      <div className="grid grid-cols-[minmax(0,1.2fr)_88px_88px] gap-3 border-b border-white/10 pb-2 text-xs uppercase tracking-[0.18em] text-stone-400">
        <span>Nombre</span>
        <span className="text-right">Rango</span>
        <span className="text-right">Daño</span>
      </div>
      {items.length > 0 ? (
        items.map((spell) => (
          <div
            key={spell.id}
            className="grid grid-cols-[minmax(0,1.2fr)_88px_88px] gap-3 text-sm text-stone-200"
          >
            <span>{spell.nombre}</span>
            <span className="text-right text-stone-400">--</span>
            <span className="text-right text-stone-400">--</span>
          </div>
        ))
      ) : (
        <EmptyRowsMessage message={emptyMessage} />
      )}
    </div>
  );
}

function InventoryRows({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: CharacterInventoryItemResponse[];
  emptyMessage: string;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <div className="grid grid-cols-[28px_minmax(0,1fr)_72px_88px] gap-3 border-b border-white/10 pb-2 text-xs uppercase tracking-[0.18em] text-stone-400">
        <span />
        <span>Nombre</span>
        <span className="text-right">Cantidad</span>
        <span className="text-right">Tags</span>
      </div>
      {items.length > 0 ? (
        items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[28px_minmax(0,1fr)_72px_88px] gap-3 text-sm text-stone-200"
          >
            <label className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={item.equipado}
                readOnly
                className="h-4 w-4 rounded border-white/30 bg-transparent accent-amber-200"
              />
            </label>
            <span>{item.nombre}</span>
            <span className="text-right font-semibold text-white">
              {item.cantidad}
            </span>
            <span className="text-right text-stone-300">
              {getInventoryTagLabel(item)}
            </span>
          </div>
        ))
      ) : (
        <EmptyRowsMessage message={emptyMessage} />
      )}
    </div>
  );
}

export default function DetailTabsSection({
  character,
  activeTab,
  onTabChange,
}: DetailTabsSectionProps) {
  const spellcastingModifier = useMemo(() => {
    if (!character.caracteristicaLanzamientoConjuros) {
      return null;
    }

    return getAbilityModifierByName(
      character,
      character.caracteristicaLanzamientoConjuros,
    );
  }, [character]);

  const spellAttackBonus = useMemo(() => {
    if (spellcastingModifier === null) {
      return null;
    }

    return spellcastingModifier + PROFICIENCY_BONUS;
  }, [spellcastingModifier]);

  const spellSaveDc = useMemo(() => {
    if (spellAttackBonus === null) {
      return null;
    }

    return 8 + spellAttackBonus;
  }, [spellAttackBonus]);

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
      })),
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

  return (
    <div className="rounded-[28px] border border-white/10 bg-black/15 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {[
          { id: "actions", label: "Acciones" },
          { id: "spells", label: "Hechizos" },
          { id: "inventory", label: "Mochila" },
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
        <div className="mt-5 space-y-4">
          <h3 className="text-lg font-bold text-white">Ataque</h3>
          <div className="grid grid-cols-[minmax(0,1.1fr)_88px_88px_88px] gap-3 border-b border-white/10 pb-2 text-xs uppercase tracking-[0.18em] text-stone-400">
            <span>Ataque</span>
            <span className="text-right">Bonif.</span>
            <span className="text-right">Alcance</span>
            <span className="text-right">Daño</span>
          </div>
          <EmptyRowsMessage message="Esta pestaña queda preparada para cuando conectemos ataques y acciones del personaje." />
        </div>
      ) : null}

      {activeTab === "spells" ? (
        <div className="mt-5 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                Modificador
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {spellcastingModifier === null
                  ? "--"
                  : formatSignedValue(spellcastingModifier)}
              </p>
            </article>

            <article className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                Ataque de hechizos
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {spellAttackBonus === null
                  ? "--"
                  : formatSignedValue(spellAttackBonus)}
              </p>
            </article>

            <article className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                Salvacion de hechizos
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {spellSaveDc === null ? "--" : spellSaveDc}
              </p>
            </article>
          </div>

          <SpellRows
            title="Trucos"
            items={cantrips}
            emptyMessage="Todavia no hay trucos persistidos en el personaje para mostrarlos aqui."
          />

          {spellsByLevel.map((group) => (
            <SpellRows
              key={group.level}
              title={`Nivel ${group.level}`}
              items={group.spells}
              emptyMessage={`No hay hechizos de nivel ${group.level} persistidos para este personaje.`}
            />
          ))}
        </div>
      ) : null}

      {activeTab === "inventory" ? (
        <div className="mt-5 space-y-6">
          <InventoryRows
            title="Equipamiento"
            items={equipmentItems}
            emptyMessage="No hay equipamiento cargado para este personaje."
          />
          <InventoryRows
            title="Objetos adicionales"
            items={additionalItems}
            emptyMessage="No hay objetos adicionales cargados para este personaje."
          />
        </div>
      ) : null}
    </div>
  );
}
