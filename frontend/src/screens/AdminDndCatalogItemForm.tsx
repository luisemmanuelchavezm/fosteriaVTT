import { useMemo, useState } from "react";
import CustomInventoryCatalogTab from "./personaje/dndcharactersheet/components/inventoryCatalog/CustomInventoryCatalogTab";

type CustomObjectType = "ARMA" | "ARMADURA" | "CONSUMIBLE" | "MISCELANEO";
type ArmorSubtype = "Ligera" | "Media" | "Pesada" | "Escudo";
interface CustomDiePart {
  count: string;
  sides: string;
}

const DAMAGE_TYPE_OPTIONS = [
  { value: "perforante", label: "Perforante" },
  { value: "cortante", label: "Cortante" },
  { value: "contundente", label: "Contundente" },
];

interface AdminDndCatalogItemFormProps {
  onAdd: (payload: {
    nombre: string;
    formula: string | null;
    descripcion: string;
    tipoObjeto: string;
  }) => Promise<void>;
  onCancel: () => void;
  onSuccess: () => void;
  isSubmitting: boolean;
}

export default function AdminDndCatalogItemForm({
  onAdd,
  onCancel,
  onSuccess,
  isSubmitting,
}: AdminDndCatalogItemFormProps) {
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customType, setCustomType] = useState<CustomObjectType>("MISCELANEO");
  const [customArmorSubtype, setCustomArmorSubtype] =
    useState<ArmorSubtype>("Ligera");
  const [armorBaseValue, setArmorBaseValue] = useState("");
  const [armorModifierCode, setArmorModifierCode] = useState("");
  const [baseBonus, setBaseBonus] = useState("");
  const [showBaseBonusInput, setShowBaseBonusInput] = useState(false);
  const [diceParts, setDiceParts] = useState<CustomDiePart[]>([]);
  const [selectedAbilityModifier, setSelectedAbilityModifier] = useState("");
  const [abilityModifiers, setAbilityModifiers] = useState<string[]>([]);
  const [damageType, setDamageType] = useState("perforante");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const builtFormula = useMemo(() => {
    if (customType === "ARMADURA") {
      const baseArmor = Number.parseInt(armorBaseValue, 10);
      if (Number.isNaN(baseArmor) || baseArmor <= 0) return null;
      if (customArmorSubtype === "Escudo") return `BONO_CA=${baseArmor}`;
      return armorModifierCode
        ? `CA=${baseArmor}+${armorModifierCode}`
        : `CA=${baseArmor}`;
    }
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
    const parsedBonus = Number.parseInt(baseBonus, 10);
    if (!Number.isNaN(parsedBonus) && parsedBonus > 0)
      parts.push(String(parsedBonus));
    parts.push(...abilityModifiers);
    const base = parts.join(" + ").trim();
    if (!base) return null;
    return customType === "ARMA" ? `${base} ${damageType}` : base;
  }, [
    abilityModifiers,
    armorBaseValue,
    armorModifierCode,
    baseBonus,
    customArmorSubtype,
    customType,
    damageType,
    diceParts,
  ]);

  const sanitizePositiveNumericInput = (value: string, max: number) => {
    const digitsOnly = value.replace(/\D+/g, "");
    if (!digitsOnly) return "";
    return String(Math.min(max, Number.parseInt(digitsOnly, 10)));
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
      setSubmitError("Debes indicar un nombre.");
      return;
    }
    try {
      setSubmitError(null);
      await onAdd({
        nombre: customName.trim(),
        formula: builtFormula,
        descripcion: customDescription.trim(),
        tipoObjeto: customType,
      });
      onSuccess();
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "No se pudo crear el objeto.",
      );
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-[28px] border border-stone-300/12 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.08),_rgba(12,10,9,0.96)_52%)] text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)] max-h-[75vh] w-full max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-stone-300/10 px-5 py-4 flex-shrink-0">
        <div>
          <p className="text-xs font-medium text-amber-200/80">
            Catálogo — D&amp;D 5e
          </p>
          <h3 className="mt-1 text-xl font-bold text-white">
            Nuevo objeto de catálogo
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300/15 bg-black/45 text-lg text-white transition hover:border-amber-300/30 hover:bg-stone-900/70"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <CustomInventoryCatalogTab
          customName={customName}
          customDescription={customDescription}
          customType={customType}
          customArmorSubtype={customArmorSubtype}
          armorBaseValue={armorBaseValue}
          armorModifierCode={armorModifierCode}
          builtFormula={builtFormula}
          baseBonus={baseBonus}
          showBaseBonusInput={showBaseBonusInput}
          diceParts={diceParts}
          selectedAbilityModifier={selectedAbilityModifier}
          abilityModifiers={abilityModifiers}
          submitError={submitError}
          onCustomNameChange={setCustomName}
          onCustomDescriptionChange={setCustomDescription}
          onCustomTypeChange={(v) => {
            setCustomType(v);
            setDiceParts([]);
            setAbilityModifiers([]);
            setBaseBonus("");
            setShowBaseBonusInput(false);
            setArmorBaseValue("");
            setArmorModifierCode("");
          }}
          onCustomArmorSubtypeChange={setCustomArmorSubtype}
          onArmorBaseValueChange={setArmorBaseValue}
          onArmorModifierCodeChange={setArmorModifierCode}
          onAddDie={handleAddDie}
          onAddBaseBonus={() => {
            setShowBaseBonusInput(true);
            setSubmitError(null);
          }}
          onSelectedAbilityModifierChange={(v) => {
            if (!v) return;
            if (abilityModifiers.length >= 3) {
              setSubmitError("Máximo 3 modificadores.");
              return;
            }
            setAbilityModifiers((c) => [...c, v]);
            setSelectedAbilityModifier("");
            setSubmitError(null);
          }}
          onBaseBonusChange={setBaseBonus}
          onDicePartsChange={setDiceParts}
          onAbilityModifiersChange={setAbilityModifiers}
          sanitizePositiveNumericInput={sanitizePositiveNumericInput}
          damageType={damageType}
          onDamageTypeChange={setDamageType}
          damageTypeOptions={DAMAGE_TYPE_OPTIONS}
        />
      </div>

      {/* Footer */}
      <div className="flex gap-3 border-t border-stone-300/10 px-5 py-3 flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-[14px] border border-stone-300/15 bg-white/5 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={isSubmitting}
          className="flex-1 rounded-[14px] bg-amber-600 py-2.5 text-sm font-bold text-white transition hover:bg-amber-500 disabled:opacity-50"
        >
          {isSubmitting ? "Creando..." : "Crear objeto"}
        </button>
      </div>
    </div>
  );
}
