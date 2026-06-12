import { useEffect, useMemo, useRef, useState } from "react";
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

  // Compartido arma/armadura
  const [diceParts, setDiceParts] = useState<CustomDiePart[]>([]);

  // Arma
  const [selectedAbilityModifier, setSelectedAbilityModifier] = useState("");
  const [abilityModifiers, setAbilityModifiers] = useState<string[]>([]);
  const [weaponBaseBonus, setWeaponBaseBonus] = useState("");
  const [showWeaponBonus, setShowWeaponBonus] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (submitError)
      errorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
  }, [submitError]);

  const builtFormula = useMemo(() => {
    if (customType === "OTROS") return null;

    if (customType === "ARMADURA") {
      const parts: string[] = [];
      for (const die of diceParts) {
        const count = Number.parseInt(die.count, 10);
        const sides = Number.parseInt(die.sides, 10);
        if (
          !Number.isNaN(count) &&
          !Number.isNaN(sides) &&
          count > 0 &&
          sides > 0
        )
          parts.push(`-${count}d${sides}`);
      }
      return parts.join("") || null;
    }

    // ARMA
    const parts: string[] = [];
    for (const die of diceParts) {
      const count = Number.parseInt(die.count, 10);
      const sides = Number.parseInt(die.sides, 10);
      if (
        !Number.isNaN(count) &&
        !Number.isNaN(sides) &&
        count > 0 &&
        sides > 0
      )
        parts.push(`${count}d${sides}`);
    }
    const bonus = Number.parseInt(weaponBaseBonus, 10);
    if (!Number.isNaN(bonus) && bonus > 0) parts.push(String(bonus));
    parts.push(...abilityModifiers);
    return parts.join(" + ").trim() || null;
  }, [abilityModifiers, customType, diceParts, weaponBaseBonus]);

  const sanitize = (value: string, max: number) => {
    const digits = value.replace(/\D+/g, "");
    if (!digits) return "";
    return String(Math.min(max, Number.parseInt(digits, 10)));
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

  const handleAddDie = () => {
    if (diceParts.length >= 3) {
      setSubmitError("Máximo 3 dados.");
      return;
    }
    setDiceParts((c) => [...c, { count: "", sides: "" }]);
    setSubmitError(null);
  };

  const handleCreate = async () => {
    if (!customName.trim()) {
      setSubmitError("Debes indicar un nombre para el objeto.");
      return;
    }
    const totalDice = diceParts.reduce(
      (sum, d) => sum + (Number.parseInt(d.count, 10) || 0),
      0,
    );
    if (totalDice > 20) {
      setSubmitError(
        `La cantidad máxima de dados es 20 (actualmente ${totalDice})`,
      );
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

  const showFormulaBuilder = customType === "ARMA" || customType === "ARMADURA";

  return (
    <div className="space-y-4">
      {/* Nombre */}
      <label className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-stone-200">Nombre</span>
          {customName.length > 70 && (
            <span
              className={`text-[9px] ${customName.length >= 100 ? "text-red-400" : "text-amber-400"}`}
            >
              {customName.length}/100
            </span>
          )}
        </div>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value.slice(0, 100))}
          maxLength={100}
          className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
        />
      </label>

      {/* Tipo */}
      <label className="space-y-2">
        <span className="text-sm font-semibold text-stone-200">Tipo</span>
        <select
          value={customType}
          onChange={(e) => {
            setCustomType(e.target.value as CustomObjectType);
            setDiceParts([]);
            setAbilityModifiers([]);
            setWeaponBaseBonus("");
            setShowWeaponBonus(false);
            setSubmitError(null);
          }}
          className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="ARMA">Arma</option>
          <option value="ARMADURA">Armadura</option>
          <option value="OTROS">Otros</option>
        </select>
      </label>

      {/* Constructor de fórmula */}
      {showFormulaBuilder && (
        <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
          {/* Fórmula (readonly) + botones */}
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

            {/* Botones a la derecha */}
            <div className="flex flex-wrap gap-2 lg:justify-end lg:pt-7">
              <button
                type="button"
                onClick={handleAddDie}
                disabled={diceParts.length >= 3}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-stone-100 disabled:opacity-40"
              >
                Añadir dado
              </button>

              {customType === "ARMA" &&
                !showWeaponBonus &&
                !weaponBaseBonus && (
                  <button
                    type="button"
                    onClick={() => setShowWeaponBonus(true)}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-stone-100"
                  >
                    Bonif. base
                  </button>
                )}

              {customType === "ARMA" && (
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
              )}
            </div>
          </div>

          {/* Área expandible con dados + bonif */}
          <div className="mt-4 flex flex-wrap gap-3">
            {/* Bonif. base — ARMA */}
            {customType === "ARMA" && (showWeaponBonus || weaponBaseBonus) && (
              <label className="min-w-[140px] flex-1 space-y-2 md:max-w-[180px]">
                <span className="text-xs uppercase tracking-[0.18em] text-stone-400">
                  Bonif. base
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={weaponBaseBonus}
                  onChange={(e) =>
                    setWeaponBaseBonus(sanitize(e.target.value, 999))
                  }
                  placeholder="0"
                  className="w-full rounded-[14px] border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-stone-500"
                />
              </label>
            )}

            {/* Dados */}
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
                    const v = sanitize(e.target.value, CUSTOM_WEAPON_MAX_DICE);
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

          {/* Chips de modificadores — solo arma */}
          {customType === "ARMA" && abilityModifiers.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {abilityModifiers.map((mod, index) => (
                <button
                  key={`${mod}-${index}`}
                  type="button"
                  onClick={() =>
                    setAbilityModifiers((c) => c.filter((_, i) => i !== index))
                  }
                  className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-100"
                >
                  {MB_ABILITY_OPTIONS.find((o) => o.value === mod)?.label ??
                    mod}
                </button>
              ))}
            </div>
          )}

          <p className="mt-4 text-sm text-stone-300">
            {builtFormula ?? "Sin fórmula"}
          </p>
        </div>
      )}

      {/* Descripción */}
      <label className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-stone-200">
            Descripción
          </span>
          {customDescription.length > 180 && (
            <span
              className={`text-[9px] ${customDescription.length >= 250 ? "text-red-400" : "text-amber-400"}`}
            >
              {customDescription.length}/250
            </span>
          )}
        </div>
        <textarea
          value={customDescription}
          onChange={(e) => setCustomDescription(e.target.value.slice(0, 250))}
          maxLength={250}
          rows={4}
          className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
        />
      </label>

      {submitError && (
        <div
          ref={errorRef}
          className="animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-4 py-3 text-sm font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]"
        >
          ⚠ {submitError}
        </div>
      )}

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
