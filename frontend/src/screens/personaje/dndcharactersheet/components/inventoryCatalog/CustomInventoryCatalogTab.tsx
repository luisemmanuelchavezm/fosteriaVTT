interface CustomDiePart {
  count: string;
  sides: string;
}

type CustomObjectType = "ARMA" | "ARMADURA" | "CONSUMIBLE" | "MISCELANEO";
type ArmorSubtype = "Ligera" | "Media" | "Pesada" | "Escudo";
const CUSTOM_WEAPON_MAX_DICE = 10;

const ABILITY_MODIFIER_CODES = [
  { value: "FUE", label: "Fuerza" },
  { value: "DES", label: "Destreza" },
  { value: "CON", label: "Constitución" },
  { value: "INT", label: "Inteligencia" },
  { value: "SAB", label: "Sabiduría" },
  { value: "CAR", label: "Carisma" },
];

const ABILITY_OPTIONS = [
  { value: "@fuerza", label: "Fuerza" },
  { value: "@destreza", label: "Destreza" },
  { value: "@constitucion", label: "Constitución" },
  { value: "@inteligencia", label: "Inteligencia" },
  { value: "@sabiduria", label: "Sabiduría" },
  { value: "@carisma", label: "Carisma" },
];

interface CustomInventoryCatalogTabProps {
  customName: string;
  customDescription: string;
  customType: CustomObjectType;
  customArmorSubtype: ArmorSubtype;
  armorBaseValue: string;
  armorModifierCode: string;
  builtFormula: string | null;
  baseBonus: string;
  showBaseBonusInput: boolean;
  diceParts: CustomDiePart[];
  selectedAbilityModifier: string;
  abilityModifiers: string[];
  submitError: string | null;
  onCustomNameChange: (value: string) => void;
  onCustomDescriptionChange: (value: string) => void;
  onCustomTypeChange: (value: CustomObjectType) => void;
  onCustomArmorSubtypeChange: (value: ArmorSubtype) => void;
  onArmorBaseValueChange: (value: string) => void;
  onArmorModifierCodeChange: (value: string) => void;
  onAddDie: () => void;
  onAddBaseBonus: () => void;
  onSelectedAbilityModifierChange: (value: string) => void;
  onBaseBonusChange: (value: string) => void;
  onDicePartsChange: (
    updater: (current: CustomDiePart[]) => CustomDiePart[],
  ) => void;
  onAbilityModifiersChange: (updater: (current: string[]) => string[]) => void;
  sanitizePositiveNumericInput: (value: string, max: number) => string;
  // Opcionales: tipo de daño para armas (solo admin)
  damageType?: string;
  onDamageTypeChange?: (value: string) => void;
  damageTypeOptions?: Array<{ value: string; label: string }>;
}

export default function CustomInventoryCatalogTab(
  props: CustomInventoryCatalogTabProps,
) {
  const {
    customName,
    customDescription,
    customType,
    customArmorSubtype,
    armorBaseValue,
    armorModifierCode,
    builtFormula,
    baseBonus,
    showBaseBonusInput,
    diceParts,
    selectedAbilityModifier,
    abilityModifiers,
    submitError,
    onCustomNameChange,
    onCustomDescriptionChange,
    onCustomTypeChange,
    onCustomArmorSubtypeChange,
    onArmorBaseValueChange,
    onArmorModifierCodeChange,
    onAddDie,
    onAddBaseBonus,
    onSelectedAbilityModifierChange,
    onBaseBonusChange,
    onDicePartsChange,
    onAbilityModifiersChange,
    sanitizePositiveNumericInput,
    damageType,
    onDamageTypeChange,
    damageTypeOptions,
  } = props;

  return (
    <div className="space-y-4">
      <label className="space-y-2">
        <span className="text-sm font-semibold text-stone-200">Nombre</span>
        <input
          type="text"
          value={customName}
          onChange={(event) => onCustomNameChange(event.target.value)}
          className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-stone-200">Tipo</span>
          <select
            value={customType}
            onChange={(event) =>
              onCustomTypeChange(event.target.value as CustomObjectType)
            }
            className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="ARMA">Arma</option>
            <option value="ARMADURA">Armadura</option>
            <option value="CONSUMIBLE">Consumible</option>
            <option value="MISCELANEO">Misceláneo</option>
          </select>
        </label>
        {customType === "ARMADURA" ? (
          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-200">
              Subtipo
            </span>
            <select
              value={customArmorSubtype}
              onChange={(event) =>
                onCustomArmorSubtypeChange(event.target.value as ArmorSubtype)
              }
              className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="Ligera">Armadura ligera</option>
              <option value="Media">Armadura media</option>
              <option value="Pesada">Armadura pesada</option>
              <option value="Escudo">Escudo</option>
            </select>
          </label>
        ) : customType === "ARMA" && damageTypeOptions && onDamageTypeChange ? (
          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-200">
              Tipo de daño
            </span>
            <select
              value={damageType}
              onChange={(e) => onDamageTypeChange(e.target.value)}
              className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
            >
              {damageTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-200">
              Fórmula
            </span>
            <input
              type="text"
              value={builtFormula ?? ""}
              readOnly
              placeholder="La fórmula se construye automáticamente"
              className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-stone-500"
            />
          </label>
          <div className="flex flex-wrap gap-2 lg:justify-end lg:pt-7">
            {customType !== "ARMADURA" ? (
              <>
                <button
                  type="button"
                  onClick={onAddDie}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-stone-100"
                >
                  Añadir dado
                </button>
                <button
                  type="button"
                  onClick={onAddBaseBonus}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-stone-100"
                >
                  Bonif. base
                </button>
                <select
                  value={selectedAbilityModifier}
                  onChange={(event) =>
                    onSelectedAbilityModifierChange(event.target.value)
                  }
                  className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-white outline-none"
                >
                  <option value="">Modificador</option>
                  {ABILITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>
        </div>

        {customType === "ARMADURA" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.18em] text-stone-400">
                {customArmorSubtype === "Escudo" ? "Bono CA" : "CA base"}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={armorBaseValue}
                onChange={(event) =>
                  onArmorBaseValueChange(
                    sanitizePositiveNumericInput(event.target.value, 30),
                  )
                }
                placeholder={
                  customArmorSubtype === "Escudo" ? "Ej. 2" : "Ej. 12"
                }
                className="w-full rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-stone-500"
              />
            </label>
            {customArmorSubtype !== "Escudo" ? (
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-stone-400">
                  Mod. característica
                </span>
                <select
                  value={armorModifierCode}
                  onChange={(event) =>
                    onArmorModifierCodeChange(event.target.value)
                  }
                  className="w-full rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Sin modificador</option>
                  {ABILITY_MODIFIER_CODES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            {showBaseBonusInput || baseBonus ? (
              <label className="min-w-[140px] flex-1 space-y-2 md:max-w-[180px]">
                <span className="text-xs uppercase tracking-[0.18em] text-stone-400">
                  Bonif. base
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={baseBonus}
                  onChange={(event) =>
                    onBaseBonusChange(
                      sanitizePositiveNumericInput(event.target.value, 999),
                    )
                  }
                  placeholder="0"
                  className="w-full rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-stone-500"
                />
              </label>
            ) : null}
            {diceParts.map((die, index) => (
              <div
                key={`die-${index}`}
                className="grid min-w-[250px] flex-1 grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)_auto] items-end gap-2 md:max-w-[320px]"
              >
                <input
                  type="text"
                  inputMode="numeric"
                  value={die.count}
                  onChange={(event) => {
                    const value = sanitizePositiveNumericInput(
                      event.target.value,
                      CUSTOM_WEAPON_MAX_DICE,
                    );
                    onDicePartsChange((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, count: String(value) }
                          : entry,
                      ),
                    );
                  }}
                  placeholder={`max ${CUSTOM_WEAPON_MAX_DICE}`}
                  className="rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-center text-sm text-white outline-none placeholder:text-stone-500"
                />
                <span className="pb-2 text-center text-lg font-bold text-white">
                  d
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={die.sides}
                  onChange={(event) => {
                    const value = sanitizePositiveNumericInput(
                      event.target.value,
                      100,
                    );
                    onDicePartsChange((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, sides: String(value) }
                          : entry,
                      ),
                    );
                  }}
                  placeholder="max 100"
                  className="rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-center text-sm text-white outline-none placeholder:text-stone-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    onDicePartsChange((current) =>
                      current.filter((_, entryIndex) => entryIndex !== index),
                    )
                  }
                  className="rounded-full border border-rose-300/20 px-3 py-2 text-xs font-semibold text-rose-100"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}

        {customType !== "ARMADURA" && abilityModifiers.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {abilityModifiers.map((modifier, index) => (
              <button
                key={`${modifier}-${index}`}
                type="button"
                onClick={() =>
                  onAbilityModifiersChange((current) =>
                    current.filter((_, entryIndex) => entryIndex !== index),
                  )
                }
                className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-100"
              >
                {ABILITY_OPTIONS.find((option) => option.value === modifier)
                  ?.label ?? modifier}
              </button>
            ))}
          </div>
        ) : null}
        <p className="mt-4 text-sm text-stone-300">
          {builtFormula ?? "Sin fórmula"}
        </p>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-stone-200">
          Descripción
        </span>
        <textarea
          value={customDescription}
          onChange={(event) => onCustomDescriptionChange(event.target.value)}
          rows={5}
          className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
        />
      </label>

      {submitError ? (
        <div className="mt-4 rounded-[16px] border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {submitError}
        </div>
      ) : null}
    </div>
  );
}
