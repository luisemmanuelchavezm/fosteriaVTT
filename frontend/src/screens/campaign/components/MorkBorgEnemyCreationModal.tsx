import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  addHabilidadNpc,
  crearNpc,
  fetchObjectCatalog,
  type CreatedCharacterResponse,
  type ObjectCatalogResponse,
} from "../../personaje/utils/dndApi";
import { saveMBEnemyTraits } from "../../personaje/utils/mbApi";
import { MB_WEAPONS } from "../../personaje/createmorkborg/utils/morkBorgUtils";

const MAX_TEXT_LENGTH = 500;
const MAX_ENTRY_COUNT = 6;
const MAX_WEAPON_COUNT = 4;
const MAX_ARMOR_COUNT = 4;

type NpcType = "enemigo" | "PNJ";
type EquipmentKind = "ARMA" | "ARMADURA";

interface MorkBorgEnemyCreationModalProps {
  isOpen: boolean;
  sistemaDeJuego: string;
  onClose: () => void;
  onCreated: (character: CreatedCharacterResponse) => void;
}

interface EquipmentEntry {
  nombre: string;
  formula: string;
  descripcion: string | null;
}

interface RandomTable {
  tagKey: string;
  nombre: string;
  dados: string;
  opciones: string[];
}

interface BiografiaJson {
  rasgosAleatorios?: RandomTable[];
}

interface MbCatalogItem extends ObjectCatalogResponse {
  fallback?: boolean;
}

function hasMbTag(tags: string | null | undefined) {
  if (!tags) return false;
  return tags.split(",").some((tag) => tag.trim() === "MORK_BORG");
}

function isMbCatalogItem(item: ObjectCatalogResponse, kind: EquipmentKind) {
  return hasMbTag(item.tags) && item.tipoObjeto === kind;
}

function normalizeCatalogName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function buildMbWeaponFallbackItems(
  existingItems: ObjectCatalogResponse[],
  search: string,
): MbCatalogItem[] {
  const normalizedSearch = normalizeCatalogName(search);
  const existingNames = new Set(
    existingItems.map((item) => normalizeCatalogName(item.nombre)),
  );

  return MB_WEAPONS.filter((weapon) => {
    const normalizedName = normalizeCatalogName(weapon.nombre);
    const matchesSearch =
      !normalizedSearch || normalizedName.includes(normalizedSearch);
    return matchesSearch && !existingNames.has(normalizedName);
  }).map((weapon) => ({
    id: -weapon.idx,
    nombre: weapon.nombre,
    formula: weapon.formula,
    descripcion: "Arma base de Mork Borg.",
    tipoObjeto: "ARMA",
    tags: `MORK_BORG,Arma,ArmaIdx;${weapon.idx}`,
    fallback: true,
  }));
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeDiceFormula(raw: string, kind: EquipmentKind) {
  const compact = raw.trim().replace(/\s+/g, "");
  if (!compact) return "";

  if (kind === "ARMA") {
    if (/^d\d+$/i.test(compact)) return `1${compact}`;
    return compact;
  }

  const withoutMinus = compact.startsWith("-") ? compact.slice(1) : compact;
  if (/^d\d+$/i.test(withoutMinus)) return `-1${withoutMinus}`;
  if (/^\d+d\d+$/i.test(withoutMinus)) return `-${withoutMinus}`;
  return compact.startsWith("-") ? compact : `-${compact}`;
}

function isValidMbFormula(
  formula: string | null | undefined,
  kind: EquipmentKind,
) {
  if (!formula) return false;
  if (kind === "ARMA") return /\d+d\d+/i.test(formula);
  return /^-\d+d\d+$/i.test(formula);
}

function buildEquipmentTag(kind: EquipmentKind) {
  return kind === "ARMA"
    ? "MORK_BORG,MBEnemyArma"
    : "MORK_BORG,MBEnemyArmadura";
}

function buildRandomTable(
  tagKey: string,
  nombre: string,
  entries: string[],
): RandomTable {
  return {
    tagKey,
    nombre,
    dados: `d${entries.length}`,
    opciones: entries,
  };
}

function buildStaticText(entries: string[]) {
  return entries[0] ?? "Nada";
}

function StepperCard({
  label,
  value,
  onChange,
  helper,
  min = 0,
  max = 999,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helper?: string;
  min?: number;
  max?: number;
}) {
  const handleInputChange = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D+/g, "");
    if (!digitsOnly) {
      onChange(min);
      return;
    }
    onChange(clampNumber(Number.parseInt(digitsOnly, 10), min, max));
  };

  return (
    <section className="rounded-[22px] border border-white/10 bg-black/20 p-4">
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-white/75">
        {label}
      </p>
      <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/25 px-4 py-4">
        <button
          type="button"
          onClick={() => onChange(clampNumber(value - 1, min, max))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-xl text-white transition hover:bg-white/10"
        >
          -
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={String(value)}
          onChange={(event) => handleInputChange(event.target.value)}
          aria-label={label}
          className="w-24 bg-transparent text-center text-4xl font-black text-white outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(clampNumber(value + 1, min, max))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-xl text-white transition hover:bg-white/10"
        >
          +
        </button>
      </div>
      {helper ? <p className="mt-2 text-xs text-white/45">{helper}</p> : null}
    </section>
  );
}

function EquipmentList({
  title,
  entries,
  onAdd,
  onRemove,
  addDisabled = false,
}: {
  title: string;
  entries: EquipmentEntry[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  addDisabled?: boolean;
}) {
  return (
    <section className="rounded-[22px] border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">
          {title}
        </p>
        <button
          type="button"
          onClick={onAdd}
          disabled={addDisabled}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus size={16} />
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-stone-400">Nada</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={`${entry.nombre}-${entry.formula}-${index}`}
              className="flex items-start justify-between gap-3 rounded-[16px] border border-white/10 bg-black/25 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white">{entry.nombre}</p>
                <p className="mt-1 font-mono text-sm text-amber-200">
                  {entry.formula}
                </p>
                {entry.descripcion ? (
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    {entry.descripcion}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded-full border border-red-500/35 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                aria-label={`Eliminar ${entry.nombre}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TextEntrySection({
  title,
  values,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  values: string[];
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className="rounded-[22px] border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">
            {title}
          </p>
          <p className="mt-1 text-xs text-white/45">
            Hasta {MAX_ENTRY_COUNT}. Si queda 0 o 1, se guardará como texto
            normal.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={values.length >= MAX_ENTRY_COUNT}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus size={16} />
        </button>
      </div>

      {values.length === 0 ? (
        <p className="text-sm text-stone-400">Nada</p>
      ) : (
        <div className="space-y-2">
          {values.map((value, index) => (
            <div key={`${title}-${index}`} className="flex items-start gap-2">
              <textarea
                value={value}
                onChange={(event) =>
                  onUpdate(index, event.target.value.slice(0, MAX_TEXT_LENGTH))
                }
                rows={2}
                maxLength={MAX_TEXT_LENGTH}
                placeholder={`${title} ${index + 1}`}
                className="min-h-[74px] flex-1 resize-none rounded-[16px] border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded-full border border-red-500/35 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                aria-label={`Eliminar ${title.toLowerCase()} ${index + 1}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EquipmentPickerModal({
  token,
  isOpen,
  kind,
  onClose,
  onAdd,
}: {
  token: string;
  isOpen: boolean;
  kind: EquipmentKind;
  onClose: () => void;
  onAdd: (entry: EquipmentEntry) => void;
}) {
  const [search, setSearch] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [items, setItems] = useState<MbCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customFormula, setCustomFormula] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || isCustomMode || !token) return;

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      void fetchObjectCatalog(
        token,
        {
          nombre: search.trim() || undefined,
          tipo: kind,
        },
        abortController.signal,
      )
        .then((catalogItems) => {
          const filteredItems = catalogItems.filter(
            (item) =>
              isMbCatalogItem(item, kind) &&
              isValidMbFormula(
                normalizeDiceFormula(item.formula ?? "", kind),
                kind,
              ),
          );
          setItems(
            kind === "ARMA"
              ? [
                  ...filteredItems,
                  ...buildMbWeaponFallbackItems(filteredItems, search),
                ]
              : filteredItems,
          );
        })
        .catch((fetchError) => {
          if ((fetchError as Error).name === "AbortError") return;
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "No se pudo cargar el catálogo.",
          );
        })
        .finally(() => {
          if (!abortController.signal.aborted) setIsLoading(false);
        });
    }, 180);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isCustomMode, isOpen, kind, search, token]);

  const singularTitle = kind === "ARMA" ? "arma" : "armadura";

  const resetAndClose = () => {
    setSearch("");
    setIsCustomMode(false);
    setItems([]);
    setError(null);
    setCustomName("");
    setCustomFormula("");
    setCustomDescription("");
    setSubmitError(null);
    onClose();
  };

  const handleAddCatalogItem = (item: ObjectCatalogResponse) => {
    const formula = normalizeDiceFormula(item.formula ?? "", kind);
    if (!isValidMbFormula(formula, kind)) return;
    onAdd({
      nombre: item.nombre,
      formula,
      descripcion: item.descripcion ?? null,
    });
    resetAndClose();
  };

  const handleCreateCustom = () => {
    const nombre = customName.trim();
    const formula = normalizeDiceFormula(customFormula, kind);
    if (!nombre) {
      setSubmitError(`Debes indicar un nombre para la ${singularTitle}.`);
      return;
    }
    if (!isValidMbFormula(formula, kind)) {
      setSubmitError(
        kind === "ARMA"
          ? "La fórmula del arma debe ser una tirada válida, por ejemplo 1d6 o 1d8+2."
          : "La fórmula de armadura debe ser una tirada como -1d2, -1d4 o -1d6.",
      );
      return;
    }
    onAdd({
      nombre,
      formula,
      descripcion: customDescription.trim() || null,
    });
    resetAndClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] border border-white/15 bg-stone-950 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-300/70">
              Mork Borg
            </p>
            <h3 className="mt-1 text-lg font-black">Añadir {singularTitle}</h3>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${!isCustomMode ? "bg-rose-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
            >
              Catálogo
            </button>
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${isCustomMode ? "bg-rose-200 text-stone-950" : "border border-white/10 bg-white/5 text-stone-200"}`}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {!isCustomMode ? (
            <>
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value.slice(0, MAX_TEXT_LENGTH))
                }
                placeholder={`Buscar ${singularTitle} del catálogo`}
                maxLength={MAX_TEXT_LENGTH}
                className="w-full rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              />

              {error ? (
                <div className="mt-4 rounded-[16px] border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <div className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-5 text-sm text-stone-300">
                    Cargando catálogo...
                  </div>
                ) : null}

                {!isLoading && items.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm text-stone-400">
                    No hay {kind === "ARMA" ? "armas" : "armaduras"} compatibles
                    con Mork Borg para este filtro.
                  </div>
                ) : null}

                {items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-white">
                          {item.nombre}
                        </p>
                        {item.formula ? (
                          <p className="mt-2 font-mono text-sm text-rose-200">
                            {normalizeDiceFormula(item.formula, kind)}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm leading-6 text-stone-300">
                          {item.descripcion || "Sin descripción."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddCatalogItem(item)}
                        className="rounded-full border border-rose-300/30 bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100"
                      >
                        Añadir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Nombre
                </span>
                <input
                  type="text"
                  value={customName}
                  onChange={(event) =>
                    setCustomName(event.target.value.slice(0, MAX_TEXT_LENGTH))
                  }
                  maxLength={MAX_TEXT_LENGTH}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Fórmula
                </span>
                <input
                  type="text"
                  value={customFormula}
                  onChange={(event) =>
                    setCustomFormula(
                      event.target.value.slice(0, MAX_TEXT_LENGTH),
                    )
                  }
                  maxLength={MAX_TEXT_LENGTH}
                  placeholder={kind === "ARMA" ? "1d6" : "-1d2"}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                />
              </label>

              <label className="block">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                    Descripción
                  </span>
                  <span className="text-[10px] text-white/30">
                    {customDescription.length}/{MAX_TEXT_LENGTH}
                  </span>
                </div>
                <textarea
                  value={customDescription}
                  onChange={(event) =>
                    setCustomDescription(
                      event.target.value.slice(0, MAX_TEXT_LENGTH),
                    )
                  }
                  rows={4}
                  maxLength={MAX_TEXT_LENGTH}
                  className="w-full resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                />
              </label>

              {submitError ? (
                <div className="rounded-[16px] border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {submitError}
                </div>
              ) : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="flex-1 rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustom}
                  className="flex-1 rounded-lg bg-rose-700 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600"
                >
                  Añadir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MorkBorgEnemyCreationModal({
  isOpen,
  sistemaDeJuego,
  onClose,
  onCreated,
}: MorkBorgEnemyCreationModalProps) {
  const token = localStorage.getItem("jwtToken") ?? "";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<NpcType>("enemigo");
  const [portrait, setPortrait] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [vidaMaxima, setVidaMaxima] = useState(1);
  const [moral, setMoral] = useState(0);
  const [weapons, setWeapons] = useState<EquipmentEntry[]>([]);
  const [armors, setArmors] = useState<EquipmentEntry[]>([]);
  const [rasgos, setRasgos] = useState<string[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [loot, setLoot] = useState("");
  const [pickerKind, setPickerKind] = useState<EquipmentKind | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    nombre?: string;
    portrait?: string;
  }>({});

  const normalizedRasgos = useMemo(
    () => rasgos.map((value) => value.trim()).filter(Boolean),
    [rasgos],
  );
  const normalizedEspecialidades = useMemo(
    () => especialidades.map((value) => value.trim()).filter(Boolean),
    [especialidades],
  );

  const biografiaPayload = useMemo(() => {
    const tables: RandomTable[] = [];
    if (normalizedRasgos.length > 1) {
      tables.push(buildRandomTable("mbRasgo1", "Rasgo", normalizedRasgos));
    }
    if (normalizedEspecialidades.length > 1) {
      tables.push(
        buildRandomTable(
          "mbEspecialidad",
          "Especialidad",
          normalizedEspecialidades,
        ),
      );
    }
    if (tables.length === 0) return null;
    const payload: BiografiaJson = { rasgosAleatorios: tables };
    return JSON.stringify(payload);
  }, [normalizedEspecialidades, normalizedRasgos]);

  const resetForm = () => {
    setNombre("");
    setTipo("enemigo");
    setPortrait(null);
    setPortraitPreview(null);
    setVidaMaxima(1);
    setMoral(0);
    setWeapons([]);
    setArmors([]);
    setRasgos([]);
    setEspecialidades([]);
    setLoot("");
    setPickerKind(null);
    setIsSubmitting(false);
    setError(null);
    setFieldErrors({});
  };

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePortraitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPortrait(file);
    setFieldErrors((current) => ({ ...current, portrait: undefined }));
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setPortraitPreview((loadEvent.target?.result as string) ?? null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!token) {
      setError("No hay sesión activa.");
      return;
    }

    if (!nombre.trim()) {
      setFieldErrors((current) => ({
        ...current,
        nombre: "El nombre es obligatorio.",
      }));
      return;
    }

    if (!portrait) {
      setFieldErrors((current) => ({
        ...current,
        portrait: "La imagen es obligatoria.",
      }));
      return;
    }

    setFieldErrors({});
    setError(null);
    setIsSubmitting(true);

    try {
      const estadisticas: Record<string, number> = {
        "Vida actual": vidaMaxima,
        "Vida maxima": vidaMaxima,
      };
      if (moral > 0) {
        estadisticas["Moral actual"] = moral;
        estadisticas["Moral maxima"] = moral;
      }

      const result = await crearNpc(
        token,
        {
          nombre: nombre.trim(),
          tipo,
          sistemaDeJuego,
          biografia: biografiaPayload ?? undefined,
          estadisticas,
        },
        portrait,
      );

      const tagsToAdd = ["MORK_BORG"];
      if (moral === 0) tagsToAdd.push("MBMoralNA");
      if (biografiaPayload) tagsToAdd.push("MBRasgosAleatorios");
      await saveMBEnemyTraits(token, result.id, tagsToAdd.join(","));

      for (const weapon of weapons) {
        await addHabilidadNpc(token, result.id, {
          nombre: weapon.nombre,
          descripcion: weapon.descripcion,
          formula: weapon.formula,
          tags: buildEquipmentTag("ARMA"),
        });
      }

      for (const armor of armors) {
        await addHabilidadNpc(token, result.id, {
          nombre: armor.nombre,
          descripcion: armor.descripcion,
          formula: armor.formula,
          tags: buildEquipmentTag("ARMADURA"),
        });
      }

      if (normalizedRasgos.length <= 1) {
        await addHabilidadNpc(token, result.id, {
          nombre: "Rasgos",
          descripcion: buildStaticText(normalizedRasgos),
          formula: null,
          tags: "MORK_BORG,MBEnemyRasgo",
        });
      }

      if (normalizedEspecialidades.length <= 1) {
        await addHabilidadNpc(token, result.id, {
          nombre: "Especial",
          descripcion: buildStaticText(normalizedEspecialidades),
          formula: null,
          tags: "MORK_BORG,MBEnemyEspecial",
        });
      }

      await addHabilidadNpc(token, result.id, {
        nombre: "Loot",
        descripcion: loot.trim() || "Nada",
        formula: null,
        tags: "MORK_BORG,MBEnemyLoot",
      });

      onCreated(result);
      handleClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo crear el PNJ de Mork Borg.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || sistemaDeJuego !== "Mork Borg") return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/15 bg-stone-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-300/70">
                Mork Borg
              </p>
              <h2 className="mt-1 text-lg font-black text-white">
                Crear enemigo / PNJ
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            <div className="flex flex-col items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePortraitChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-36 w-36 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/25 bg-white/5 transition hover:border-rose-300/50 hover:bg-white/10"
              >
                {portraitPreview ? (
                  <img
                    src={portraitPreview}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <ImagePlus size={28} className="text-rose-200/70" />
                    <span className="mt-2 px-2 text-center text-[10px] text-white/50">
                      Subir imagen
                    </span>
                  </>
                )}
              </button>
              {portrait ? (
                <button
                  type="button"
                  onClick={() => {
                    setPortrait(null);
                    setPortraitPreview(null);
                    setFieldErrors((current) => ({
                      ...current,
                      portrait: "La imagen es obligatoria.",
                    }));
                  }}
                  className="mt-1.5 text-xs text-white/40 hover:text-white/70"
                >
                  Eliminar
                </button>
              ) : null}
              {fieldErrors.portrait ? (
                <p className="mt-2 text-xs text-red-400">
                  {fieldErrors.portrait}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Nombre
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(event) => {
                    setNombre(event.target.value.slice(0, MAX_TEXT_LENGTH));
                    if (fieldErrors.nombre) {
                      setFieldErrors((current) => ({
                        ...current,
                        nombre: undefined,
                      }));
                    }
                  }}
                  maxLength={MAX_TEXT_LENGTH}
                  placeholder="Nombre del enemigo o PNJ"
                  className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 ${fieldErrors.nombre ? "border-red-400/70" : "border-white/20"}`}
                />
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-red-400">
                    {fieldErrors.nombre ?? ""}
                  </span>
                  <span className="text-white/30">
                    {nombre.length}/{MAX_TEXT_LENGTH}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                  Tipo
                </label>
                <div className="flex gap-2">
                  {(["enemigo", "PNJ"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTipo(value)}
                      className={`flex-1 rounded-lg border px-2 py-2 text-sm font-semibold transition ${tipo === value ? "border-rose-400/70 bg-rose-700/20 text-rose-200" : "border-white/20 bg-white/5 text-white/60 hover:bg-white/10"}`}
                    >
                      {value === "enemigo" ? "Enemigo" : "PNJ"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <StepperCard
                label="Vida máxima"
                value={vidaMaxima}
                onChange={setVidaMaxima}
                min={1}
              />
              <StepperCard
                label="Moral"
                value={moral}
                onChange={setMoral}
                helper="Si se queda en 0, se guardará como -"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <EquipmentList
                title="Armas"
                entries={weapons}
                onAdd={() => {
                  if (weapons.length >= MAX_WEAPON_COUNT) return;
                  setPickerKind("ARMA");
                }}
                addDisabled={weapons.length >= MAX_WEAPON_COUNT}
                onRemove={(index) =>
                  setWeapons((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              />
              <EquipmentList
                title="Armadura"
                entries={armors}
                onAdd={() => {
                  if (armors.length >= MAX_ARMOR_COUNT) return;
                  setPickerKind("ARMADURA");
                }}
                addDisabled={armors.length >= MAX_ARMOR_COUNT}
                onRemove={(index) =>
                  setArmors((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <TextEntrySection
                title="Rasgos"
                values={rasgos}
                onAdd={() =>
                  setRasgos((current) =>
                    current.length >= MAX_ENTRY_COUNT
                      ? current
                      : [...current, ""],
                  )
                }
                onUpdate={(index, value) =>
                  setRasgos((current) =>
                    current.map((entry, itemIndex) =>
                      itemIndex === index ? value : entry,
                    ),
                  )
                }
                onRemove={(index) =>
                  setRasgos((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              />
              <TextEntrySection
                title="Especialidad"
                values={especialidades}
                onAdd={() =>
                  setEspecialidades((current) =>
                    current.length >= MAX_ENTRY_COUNT
                      ? current
                      : [...current, ""],
                  )
                }
                onUpdate={(index, value) =>
                  setEspecialidades((current) =>
                    current.map((entry, itemIndex) =>
                      itemIndex === index ? value : entry,
                    ),
                  )
                }
                onRemove={(index) =>
                  setEspecialidades((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              />
            </div>

            <section className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-baseline justify-between">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">
                  Botín
                </p>
                <span className="text-[10px] text-white/30">
                  {loot.length}/{MAX_TEXT_LENGTH}
                </span>
              </div>
              <textarea
                value={loot}
                onChange={(event) =>
                  setLoot(event.target.value.slice(0, MAX_TEXT_LENGTH))
                }
                rows={3}
                maxLength={MAX_TEXT_LENGTH}
                placeholder="Describe el botín"
                className="w-full resize-none rounded-[16px] border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
              />
            </section>

            {error ? (
              <p className="rounded-lg border border-red-400/30 bg-red-900/25 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex gap-3 border-t border-white/10 px-5 py-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-rose-700 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-60"
            >
              {isSubmitting ? "Creando..." : "Crear NPC"}
            </button>
          </div>
        </div>
      </div>

      {pickerKind ? (
        <EquipmentPickerModal
          token={token}
          isOpen
          kind={pickerKind}
          onClose={() => setPickerKind(null)}
          onAdd={(entry) => {
            if (pickerKind === "ARMA") {
              setWeapons((current) =>
                current.length >= MAX_WEAPON_COUNT
                  ? current
                  : [...current, entry],
              );
            } else {
              setArmors((current) =>
                current.length >= MAX_ARMOR_COUNT
                  ? current
                  : [...current, entry],
              );
            }
          }}
        />
      ) : null}
    </>
  );
}
