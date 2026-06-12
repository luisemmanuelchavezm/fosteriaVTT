import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchObjectCatalog,
  type AddDndCharacterInventoryItemRequest,
  type ObjectCatalogResponse,
} from "../../utils/dndApi";
import CustomInventoryCatalogTab from "./inventoryCatalog/CustomInventoryCatalogTab";
import ExistingInventoryCatalogTab from "./inventoryCatalog/ExistingInventoryCatalogTab";

interface InventoryCatalogModalProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (payload: AddDndCharacterInventoryItemRequest) => Promise<void>;
}

interface CustomDiePart {
  count: string;
  sides: string;
}

type CustomObjectType = "ARMA" | "ARMADURA" | "CONSUMIBLE" | "MISCELANEO";
type ArmorSubtype = "Ligera" | "Media" | "Pesada" | "Escudo";

export default function InventoryCatalogModal({
  token,
  isOpen,
  onClose,
  onAddItem,
}: InventoryCatalogModalProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [items, setItems] = useState<ObjectCatalogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nonCustomErrorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (submitError && !isCustomMode)
      nonCustomErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
  }, [submitError, isCustomMode]);

  useEffect(() => {
    if (!isOpen || isCustomMode) {
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      void fetchObjectCatalog(
        token,
        {
          nombre: search.trim() || undefined,
          tipo: typeFilter || undefined,
        },
        abortController.signal,
      )
        .then((all) =>
          setItems(
            all.filter((item) => {
              const tags = item.tags ?? "";
              return !tags.split(",").some((t) => t.trim() === "MORK_BORG");
            }),
          ),
        )
        .catch((fetchError) => {
          if ((fetchError as Error).name === "AbortError") {
            return;
          }
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "No se pudo cargar el catálogo de objetos.",
          );
        })
        .finally(() => {
          if (!abortController.signal.aborted) {
            setIsLoading(false);
          }
        });
    }, 180);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isCustomMode, isOpen, search, token, typeFilter]);

  const builtFormula = useMemo(() => {
    if (customType === "ARMADURA") {
      const baseArmor = Number.parseInt(armorBaseValue, 10);
      if (Number.isNaN(baseArmor) || baseArmor <= 0) {
        return null;
      }
      if (customArmorSubtype === "Escudo") {
        return `BONO_CA=${baseArmor}`;
      }
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
      ) {
        parts.push(`${count}d${sides}`);
      }
    }
    const parsedBonus = Number.parseInt(baseBonus, 10);
    if (!Number.isNaN(parsedBonus) && parsedBonus > 0) {
      parts.push(String(parsedBonus));
    }
    parts.push(...abilityModifiers);
    return parts.join(" + ").trim() || null;
  }, [
    abilityModifiers,
    armorBaseValue,
    armorModifierCode,
    baseBonus,
    customArmorSubtype,
    customType,
    diceParts,
  ]);

  const customIndex = useMemo(() => {
    if (customType === "ARMA") {
      return "ASCuerpo,COMPETENTE_POR_DEFECTO";
    }
    if (customType === "ARMADURA") {
      return `ARMADURA,${customArmorSubtype}`;
    }
    return customType;
  }, [customArmorSubtype, customType]);

  const resetCustomForm = () => {
    setCustomName("");
    setCustomDescription("");
    setCustomType("MISCELANEO");
    setCustomArmorSubtype("Ligera");
    setArmorBaseValue("");
    setArmorModifierCode("");
    setBaseBonus("");
    setShowBaseBonusInput(false);
    setDiceParts([]);
    setAbilityModifiers([]);
    setSelectedAbilityModifier("");
    setSubmitError(null);
  };

  const closeModal = () => {
    setSearch("");
    setTypeFilter("");
    setIsCustomMode(false);
    resetCustomForm();
    onClose();
  };

  const handleAddExisting = async (itemId: number) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onAddItem({ objetoId: itemId, cantidad: 1 });
      closeModal();
    } catch (submitIssue) {
      setSubmitError(
        submitIssue instanceof Error
          ? submitIssue.message
          : "No se pudo añadir el objeto a la mochila.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDie = () => {
    if (diceParts.length >= 3) {
      setSubmitError("Máximo 3 veces.");
      return;
    }
    setDiceParts((current) => [...current, { count: "", sides: "" }]);
    setSubmitError(null);
  };

  const handleAddBaseBonus = () => {
    setShowBaseBonusInput(true);
    setSubmitError(null);
  };

  const handleAddModifier = (modifier: string) => {
    if (!modifier) {
      return;
    }
    if (abilityModifiers.length >= 3) {
      setSubmitError("Máximo 3 veces.");
      return;
    }
    setAbilityModifiers((current) => [...current, modifier]);
    setSelectedAbilityModifier("");
    setSubmitError(null);
  };

  const sanitizePositiveNumericInput = (value: string, max: number) => {
    const digitsOnly = value.replace(/\D+/g, "");
    if (!digitsOnly) {
      return "";
    }
    return String(Math.min(max, Number.parseInt(digitsOnly, 10)));
  };

  const handleCreateCustom = async () => {
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
      setIsSubmitting(true);
      setSubmitError(null);
      await onAddItem({
        nombre: customName.trim(),
        descripcion: customDescription.trim() || null,
        formula: builtFormula,
        tipoObjeto: customType,
        indice: customIndex,
        cantidad: 1,
      });
      closeModal();
    } catch (submitIssue) {
      setSubmitError(
        submitIssue instanceof Error
          ? submitIssue.message
          : "No se pudo crear el objeto personalizado.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-stone-300/12 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.08),_rgba(12,10,9,0.96)_52%)] text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-stone-300/10 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-amber-200/80">Mochila</p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Añadir nuevo objeto
            </h3>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label="Cerrar modal de objetos"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300/15 bg-black/45 text-xl text-white transition hover:border-amber-300/30 hover:bg-stone-900/70"
          >
            ×
          </button>
        </div>

        <div className="border-b border-stone-300/10 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${!isCustomMode ? "bg-amber-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
            >
              Catálogo
            </button>
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${isCustomMode ? "bg-amber-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {!isCustomMode ? (
            <ExistingInventoryCatalogTab
              search={search}
              typeFilter={typeFilter}
              isLoading={isLoading}
              error={error}
              items={items}
              isSubmitting={isSubmitting}
              onSearchChange={setSearch}
              onTypeFilterChange={setTypeFilter}
              onAddExisting={(itemId) => void handleAddExisting(itemId)}
            />
          ) : (
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
              onCustomTypeChange={setCustomType}
              onCustomArmorSubtypeChange={setCustomArmorSubtype}
              onArmorBaseValueChange={setArmorBaseValue}
              onArmorModifierCodeChange={setArmorModifierCode}
              onAddDie={handleAddDie}
              onAddBaseBonus={handleAddBaseBonus}
              onSelectedAbilityModifierChange={handleAddModifier}
              onBaseBonusChange={setBaseBonus}
              onDicePartsChange={setDiceParts}
              onAbilityModifiersChange={setAbilityModifiers}
              sanitizePositiveNumericInput={sanitizePositiveNumericInput}
            />
          )}

          {!isCustomMode && submitError ? (
            <div
              ref={nonCustomErrorRef}
              className="mt-4 animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-4 py-3 text-sm font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]"
            >
              ⚠ {submitError}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-stone-300/10 px-6 py-4">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-stone-100"
          >
            Cancelar
          </button>
          {isCustomMode ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleCreateCustom()}
              className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 disabled:opacity-50"
            >
              Crear
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
