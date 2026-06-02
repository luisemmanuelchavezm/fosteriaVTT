import { useMemo, useState } from "react";
import type { AddDndCharacterInventoryItemRequest } from "../../utils/dndApi";
import {
  buildMbCustomIndice,
  type CustomDiePart,
  type CustomObjectType,
} from "./MorkBorgInventoryCatalogHelpers";

const MB_ABILITY_OPTIONS = [
  { value: "@mb_fuerza", label: "Fuerza" },
  { value: "@mb_agilidad", label: "Agilidad" },
  { value: "@mb_presencia", label: "Presencia" },
  { value: "@mb_resistencia", label: "Resistencia" },
];

const MB_ARMOR_MODIFIER_CODES = [
  { value: "AGILIDAD", label: "Agilidad" },
  { value: "FUERZA", label: "Fuerza" },
  { value: "PRESENCIA", label: "Presencia" },
  { value: "RESISTENCIA", label: "Resistencia" },
];

const CUSTOM_WEAPON_MAX_DICE = 10;

interface MorkBorgCustomItemFormProps {
  isSubmitting: boolean;
  onAddItem: (payload: AddDndCharacterInventoryItemRequest) => Promise<void>;
  onSuccess: () => void;
}

export default function MorkBorgCustomItemForm({
  isSubmitting,
  onAddItem,
  onSuccess,
}: MorkBorgCustomItemFormProps) {
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customType, setCustomType] = useState<CustomObjectType>("OTROS");
  const [armorBaseValue, setArmorBaseValue] = useState("");
  const [armorModifierCode, setArmorModifierCode] = useState("");
  const [diceParts, setDiceParts] = useState<CustomDiePart[]>([]);
  const [selectedAbilityModifier, setSelectedAbilityModifier] = useState("");
  const [abilityModifiers, setAbilityModifiers] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const builtFormula = useMemo(() => {
    if (customType === "ARMADURA") {
      const baseArmor = Number.parseInt(armorBaseValue, 10);
      if (Number.isNaN(baseArmor) || baseArmor <= 0) return null;
      return armorModifierCode
        ? `CA=${baseArmor}+${armorModifierCode}`
        : `CA=${baseArmor}`;
    }
    if (customType === "OTROS") return null;

    const parts: string[] = [];
    for (const die of diceParts) {
      const count = Number.parseInt(die.count, 10);
      const sides = Number.parseInt(die.sides, 10);
      if (
        !Number.isNaN(count) &&
        !Number.isNaN(sides) &&
        count > 0 &&
        sides > 0
      ) {
        parts.push(`${count}d${sides}`);
      }
    }
    parts.push(...abilityModifiers);
    return parts.join(" + ").trim() || null;
  }, [
    abilityModifiers,
    armorBaseValue,
    armorModifierCode,
    customType,
    diceParts,
  ]);

  const sanitize = (value: string, max: number) => {
    const digits = value.replace(/\D+/g, "");
    if (!digits) return "";
    return String(Math.min(max, Number.parseInt(digits, 10)));
  };

  const handleAddDie = () => {
    if (diceParts.length >= 3) {
      setSubmitError("Máximo 3 dados.");
      return;
    }
    setDiceParts((c) => [...c, { count: "", sides: "" }]);
    setSubmitError(null);
  };

  const handleAddModifier = (modifier: string) => {
    if (!modifier) return;
    if (abilityModifiers.length >= 2) {
      setSubmitError("Máximo 2 modificadores.");
      return;
    }
    setAbilityModifiers((c) => [...c, modifier]);
    setSelectedAbilityModifier("");
    setSubmitError(null);
  };

  const handleCreate = async () => {
    if (!customName.trim()) {
      setSubmitError("Debes indicar un nombre para el objeto.");
      return;
    }
    try {
      setSubmitError(null);
      await onAddItem({
        nombre: customName.trim(),
        descripcion: customDescription.trim() || null,
        formula: builtFormula,
        tipoObjeto: customType === "OTROS" ? "MISCELANEO" : customType,
        indice: buildMbCustomIndice(customType),
        cantidad: 1,
      });
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "No se pudo crear el objeto personalizado.",
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Nombre */}
      <label className="space-y-2">
        <span className="text-sm font-semibold text-stone-200">Nombre</span>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
        />
      </label>

      {/* Tipo */}
      <label className="space-y-2">
        <span className="text-sm font-semibold text-stone-200">Tipo</span>
        <select
          value={customType}
          onChange={(e) => setCustomType(e.target.value as CustomObjectType)}
          className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="ARMA">Arma</option>
          <option value="ARMADURA">Armadura</option>
          <option value="OTROS">Otros</option>
        </select>
      </label>

      {/* Fórmula — solo para arma y armadura */}
      {customType !== "OTROS" ? (
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
            {customType === "ARMA" ? (
              <div className="flex flex-wrap gap-2 lg:justify-end lg:pt-7">
                <button
                  type="button"
                  onClick={handleAddDie}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-stone-100"
                >
                  Añadir dado
                </button>
                <select
                  value={selectedAbilityModifier}
                  onChange={(e) => handleAddModifier(e.target.value)}
                  className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-white outline-none"
                >
                  <option value="">Modificador</option>
                  {MB_ABILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {customType === "ARMADURA" ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-stone-400">
                  CA base
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={armorBaseValue}
                  onChange={(e) =>
                    setArmorBaseValue(sanitize(e.target.value, 30))
                  }
                  placeholder="Ej. 12"
                  className="w-full rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-stone-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-stone-400">
                  Mod. característica
                </span>
                <select
                  value={armorModifierCode}
                  onChange={(e) => setArmorModifierCode(e.target.value)}
                  className="w-full rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Sin modificador</option>
                  {MB_ARMOR_MODIFIER_CODES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              {diceParts.map((die, index) => (
                <div
                  key={`die-${index}`}
                  className="grid min-w-[250px] flex-1 grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)_auto] items-end gap-2 md:max-w-[320px]"
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    value={die.count}
                    onChange={(e) => {
                      const v = sanitize(
                        e.target.value,
                        CUSTOM_WEAPON_MAX_DICE,
                      );
                      setDiceParts((c) =>
                        c.map((entry, i) =>
                          i === index ? { ...entry, count: v } : entry,
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
                    onChange={(e) => {
                      const v = sanitize(e.target.value, 100);
                      setDiceParts((c) =>
                        c.map((entry, i) =>
                          i === index ? { ...entry, sides: v } : entry,
                        ),
                      );
                    }}
                    placeholder="max 100"
                    className="rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-center text-sm text-white outline-none placeholder:text-stone-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDiceParts((c) => c.filter((_, i) => i !== index))
                    }
                    className="rounded-full border border-rose-300/20 px-3 py-2 text-xs font-semibold text-rose-100"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          {customType === "ARMA" && abilityModifiers.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {abilityModifiers.map((mod, index) => (
                <button
                  key={`${mod}-${index}`}
                  type="button"
                  onClick={() =>
                    setAbilityModifiers((c) => c.filter((_, i) => i !== index))
                  }
                  className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-100"
                >
                  {MB_ABILITY_OPTIONS.find((o) => o.value === mod)?.label ??
                    mod}{" "}
                  ×
                </button>
              ))}
            </div>
          ) : null}

          <p className="mt-4 text-sm text-stone-300">
            {builtFormula ?? "Sin fórmula"}
          </p>
        </div>
      ) : null}

      {/* Descripción */}
      <label className="space-y-2">
        <span className="text-sm font-semibold text-stone-200">
          Descripción
        </span>
        <textarea
          value={customDescription}
          onChange={(e) => setCustomDescription(e.target.value)}
          rows={4}
          className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
        />
      </label>

      {submitError ? (
        <div className="rounded-[16px] border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {submitError}
        </div>
      ) : null}

      {/* Footer action exposed via a named slot — rendered here so the form controls its own submit */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleCreate()}
          className="rounded-full border border-rose-300/30 bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100 disabled:opacity-50"
        >
          Crear
        </button>
      </div>
    </div>
  );
}
