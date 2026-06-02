import { ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  addHabilidadNpc,
  crearNpc,
  type CreatedCharacterResponse,
} from "../../personaje/utils/dndApi";
import { saveMBEnemyTraits } from "../../personaje/utils/mbApi";
import {
  EquipmentPickerModal,
  type EquipmentEntry,
} from "./MorkBorgEnemyEquipmentPicker";
import {
  MAX_TEXT_LENGTH,
  MAX_ENTRY_COUNT,
  StepperCard,
  EquipmentList,
  TextEntrySection,
} from "./MorkBorgEnemyFormComponents";
import {
  buildEquipmentTag,
  buildRandomTable,
  buildStaticText,
  type EquipmentKind,
  type RandomTable,
  type BiografiaJson,
} from "./MorkBorgEnemyFormUtils";

const MAX_WEAPON_COUNT = 4;
const MAX_ARMOR_COUNT = 4;

type NpcType = "enemigo" | "PNJ";

interface MorkBorgEnemyCreationModalProps {
  isOpen: boolean;
  sistemaDeJuego: string;
  onClose: () => void;
  onCreated: (character: CreatedCharacterResponse) => void;
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
