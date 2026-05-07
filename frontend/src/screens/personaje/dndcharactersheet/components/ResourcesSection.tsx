import { useState } from "react";
import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import { SPELL_LEVELS } from "../data";
import { extractExtraResources } from "../utils/characterResources";

interface ResourcesSectionProps {
  character: DndCharacterDetailResponse;
  currentSpellSlots: Record<number, number>;
  spellSlotMaximums: Record<number, number>;
  currentExtraResources: Record<number, number>;
  extraResourceMaximums: Record<number, number>;
  currentMoney: Record<string, number>;
  isEditMode?: boolean;
  onAdjustSpellSlot: (level: number, delta: number) => void;
  onAdjustSpellSlotMax?: (level: number, delta: number) => void;
  onAdjustExtraResource?: (index: number, delta: number) => void;
  onAdjustExtraResourceMax?: (index: number, delta: number) => void;
  onAdjustMoney: (currency: string, delta: number) => void;
}

export default function ResourcesSection({
  character,
  currentSpellSlots,
  spellSlotMaximums,
  currentExtraResources,
  extraResourceMaximums,
  currentMoney,
  isEditMode = false,
  onAdjustSpellSlot,
  onAdjustSpellSlotMax,
  onAdjustExtraResource,
  onAdjustExtraResourceMax,
  onAdjustMoney,
}: ResourcesSectionProps) {
  const [activeTab, setActiveTab] = useState<"spells" | "extra" | "money">(
    "spells",
  );
  const extraResources = extractExtraResources(character.estadisticas).map(
    (resource) => ({
      ...resource,
      current: currentExtraResources[resource.index] ?? resource.current,
      max: extraResourceMaximums[resource.index] ?? resource.max,
    }),
  );

  const renderRowValueCard = (
    key: string,
    label: string,
    currentValue: number | "--",
    maximumValue: number | "--",
    onAdjustCurrent: () => void,
    onReduceCurrent: () => void,
    onIncreaseMax?: () => void,
    onDecreaseMax?: () => void,
    disabled = false,
  ) => (
    <article
      key={key}
      className="min-w-[82px] rounded-[14px] border border-white/10 bg-black/20 px-2.5 py-2 text-center"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
        {label}
      </p>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_20px] items-center gap-1.5">
        <div>
          <p className="text-lg font-bold leading-none text-white">
            {currentValue}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
            / {maximumValue}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={onAdjustCurrent}
            disabled={disabled}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[10px] text-stone-200 disabled:opacity-40"
          >
            +
          </button>
          <button
            type="button"
            onClick={onReduceCurrent}
            disabled={disabled}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[10px] text-stone-200 disabled:opacity-40"
          >
            -
          </button>
        </div>
      </div>
      {isEditMode && onIncreaseMax && onDecreaseMax ? (
        <div className="mt-2 flex items-center justify-center gap-2 border-t border-white/10 pt-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-100/70">
            Max
          </span>
          <button
            type="button"
            onClick={onIncreaseMax}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-sky-300/20 text-[10px] text-sky-100"
          >
            +
          </button>
          <button
            type="button"
            onClick={onDecreaseMax}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-sky-300/20 text-[10px] text-sky-100"
          >
            -
          </button>
        </div>
      ) : null}
    </article>
  );

  return (
    <section className="rounded-[22px] border border-white/10 bg-black/15 p-3.5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
      <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
        Recursos
      </p>
      <div className="mt-2 flex gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("spells")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${activeTab === "spells" ? "bg-amber-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
        >
          Hechizos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("extra")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${activeTab === "extra" ? "bg-amber-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
        >
          Extra
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("money")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${activeTab === "money" ? "bg-amber-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
        >
          Dinero
        </button>
      </div>

      {activeTab === "spells" ? (
        <div
          className={`mt-3 pb-1 ${isEditMode ? "overflow-x-auto" : "overflow-hidden"}`}
        >
          <div
            className={
              isEditMode
                ? "flex min-w-max gap-2"
                : "grid grid-cols-[repeat(9,minmax(0,1fr))] gap-2"
            }
          >
            {SPELL_LEVELS.map((level) => {
              const totalSlots =
                spellSlotMaximums[level] ??
                character.estadisticas[`Hechizos nivel ${level}`];
              const currentValue =
                typeof totalSlots === "number"
                  ? (currentSpellSlots[level] ?? totalSlots)
                  : "--";

              return renderRowValueCard(
                `spell-slot-${level}`,
                String(level),
                currentValue,
                typeof totalSlots === "number" ? totalSlots : "--",
                () => onAdjustSpellSlot(level, 1),
                () => onAdjustSpellSlot(level, -1),
                () => onAdjustSpellSlotMax?.(level, 1),
                () => onAdjustSpellSlotMax?.(level, -1),
                !isEditMode && typeof totalSlots !== "number",
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "extra" ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
            Gestionar recursos extra (ej: canalizar divinidad)
          </p>
          <div
            className={isEditMode ? "overflow-x-auto pb-1" : "overflow-hidden"}
          >
            <div
              className={
                isEditMode
                  ? "flex min-w-max gap-2"
                  : "grid grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-2"
              }
            >
              {extraResources.map((resource) => {
                const totalValue = resource.max;
                const currentValue = resource.current;

                return renderRowValueCard(
                  `extra-resource-${resource.index}`,
                  `Extra ${resource.index}`,
                  totalValue > 0 ? currentValue : "--",
                  totalValue > 0 ? totalValue : "--",
                  () => onAdjustExtraResource?.(resource.index, 1),
                  () => onAdjustExtraResource?.(resource.index, -1),
                  () => onAdjustExtraResourceMax?.(resource.index, 1),
                  () => onAdjustExtraResourceMax?.(resource.index, -1),
                  !isEditMode && totalValue <= 0,
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "money" ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { key: "ppt", label: "PPT" },
            { key: "po", label: "PO" },
            { key: "pp", label: "PP" },
            { key: "pc", label: "PC" },
          ].map((currency) => (
            <article
              key={currency.key}
              className="rounded-[14px] border border-white/10 bg-black/20 px-2.5 py-2.5 text-center"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                {currency.label}
              </p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onAdjustMoney(currency.key, -1)}
                  className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-stone-200"
                >
                  -
                </button>
                <p className="min-w-[32px] text-center text-xl font-bold leading-none text-white">
                  {currentMoney[currency.key] ?? 0}
                </p>
                <button
                  type="button"
                  onClick={() => onAdjustMoney(currency.key, 1)}
                  className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-stone-200"
                >
                  +
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
