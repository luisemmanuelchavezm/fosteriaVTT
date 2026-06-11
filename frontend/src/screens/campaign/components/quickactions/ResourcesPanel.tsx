import { SPELL_LEVELS } from "../../../personaje/dndcharactersheet/data";

interface ExtraResourceRow {
  index: number;
  max: number;
  current: number;
  valor: number;
}

interface ResourcesPanelProps {
  resourceTab: "spells" | "extra" | "money";
  spellSlotMaximums: Record<number, number>;
  resourceSpellSlots: Record<number, number>;
  extraResourceRows: ExtraResourceRow[];
  resourceMoney: Record<string, number>;
  onTabChange: (tab: "spells" | "extra" | "money") => void;
  onSpellSlotChange: (level: number, delta: number) => void;
  onExtraResourceChange: (index: number, delta: number) => void;
  onMoneyChange: (key: string, delta: number) => void;
}

export default function ResourcesPanel({
  resourceTab,
  spellSlotMaximums,
  resourceSpellSlots,
  extraResourceRows,
  resourceMoney,
  onTabChange,
  onSpellSlotChange,
  onExtraResourceChange,
  onMoneyChange,
}: ResourcesPanelProps) {
  return (
    <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[760px] max-w-[95vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-4 shadow-2xl">
      <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
        Recursos
      </p>

      <div className="mb-3 flex gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => onTabChange("spells")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${resourceTab === "spells" ? "bg-amber-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
        >
          Hechizos
        </button>
        <button
          type="button"
          onClick={() => onTabChange("extra")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${resourceTab === "extra" ? "bg-amber-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
        >
          Extra
        </button>
        <button
          type="button"
          onClick={() => onTabChange("money")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${resourceTab === "money" ? "bg-amber-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
        >
          Dinero
        </button>
      </div>

      {resourceTab === "spells" ? (
        <div className="grid grid-cols-[repeat(9,minmax(0,1fr))] gap-2">
          {SPELL_LEVELS.map((level) => {
            const maxValue = spellSlotMaximums[level] ?? 0;
            const currentValue = resourceSpellSlots[level] ?? maxValue;
            const isDisabled = maxValue <= 0;

            return (
              <article
                key={`quick-resource-spell-${level}`}
                className="rounded-[14px] border border-white/10 bg-black/20 px-2 py-2 text-center"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                  {level}
                </p>
                <p className="mt-1 text-lg font-bold leading-none text-white">
                  {maxValue > 0 ? currentValue : "--"}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
                  / {maxValue > 0 ? maxValue : "--"}
                </p>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSpellSlotChange(level, -1)}
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[10px] text-stone-200 disabled:opacity-40"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSpellSlotChange(level, 1)}
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[10px] text-stone-200 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {resourceTab === "extra" ? (
        extraResourceRows.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-2">
            {extraResourceRows.map((resource) => (
              <article
                key={`quick-resource-extra-${resource.index}`}
                className="rounded-[14px] border border-white/10 bg-black/20 px-2 py-2 text-center"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                  Extra {resource.index}
                </p>
                <p className="mt-1 text-lg font-bold leading-none text-white">
                  {resource.valor}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
                  / {resource.max}
                </p>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => onExtraResourceChange(resource.index, -1)}
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[10px] text-stone-200"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => onExtraResourceChange(resource.index, 1)}
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[10px] text-stone-200"
                  >
                    +
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
            Este personaje no tiene recursos extra.
          </div>
        )
      ) : null}

      {resourceTab === "money" ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { key: "ppt", label: "Platino" },
            { key: "po", label: "Oro" },
            { key: "pp", label: "Plata" },
            { key: "pc", label: "Cobre" },
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
                  onClick={() => onMoneyChange(currency.key, -1)}
                  className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-stone-200"
                >
                  -
                </button>
                <p className="min-w-[32px] text-center text-xl font-bold leading-none text-white">
                  {resourceMoney[currency.key] ?? 0}
                </p>
                <button
                  type="button"
                  onClick={() => onMoneyChange(currency.key, 1)}
                  className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-stone-200"
                >
                  +
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
