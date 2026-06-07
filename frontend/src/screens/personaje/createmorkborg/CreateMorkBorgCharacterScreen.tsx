import { AlertTriangle } from "lucide-react";
import HomeNavbar, { type NavTab } from "../../../components/HomeNavbar";
import LogoLayout from "../../../components/LogoLayout";
import UserMenu from "../../../components/UserMenu";
import MorkBorgIdentitySection from "./components/MorkBorgIdentitySection";
import MorkBorgClassSelectionSection from "./sections/MorkBorgClassSelectionSection";
import MorkBorgStatsSection from "./sections/MorkBorgStatsSection";
import MorkBorgEquipmentSection from "./sections/MorkBorgEquipmentSection";
import MorkBorgRasgosSection from "./sections/MorkBorgRasgosSection";
import { useCreateMorkBorgCharacter } from "./hooks/useCreateMorkBorgCharacter";
import {
  MORK_BORG_CLASSES,
  MORK_BORG_CREATION_PHASES,
} from "./utils/morkBorgUtils";
import { useState } from "react";
import { buildApiUrl } from "../../../lib/api";
import imgCalavera from "../../../assets/fondos/calavera.png";
import imgSol from "../../../assets/fondos/sol.png";

// ── Sistema de decoraciones mixtas (calaveras + soles) ────────────────────────
interface DecorSlot {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  rotate: number;
  size: number;
  opacity: number;
  kind: "skull" | "sun";
}

// Calaveras — bordes y esquinas (se eligen 7 al azar)
const SKULL_POOL: Omit<DecorSlot, "kind">[] = [
  // Esquinas — grandes, sobresalen
  { top: "-80px", left: "-80px", rotate: -20, size: 260, opacity: 0.52 },
  { top: "-60px", right: "-80px", rotate: 18, size: 240, opacity: 0.48 },
  { bottom: "-70px", left: "-60px", rotate: 8, size: 250, opacity: 0.5 },
  // Lados centrales
  { top: "25%", left: "-70px", rotate: -6, size: 210, opacity: 0.42 },
  { top: "25%", right: "-70px", rotate: 12, size: 200, opacity: 0.4 },
  { top: "58%", left: "-55px", rotate: 4, size: 190, opacity: 0.41 },
  { top: "58%", right: "-55px", rotate: -10, size: 200, opacity: 0.43 },
  // Interiores — añaden textura de fondo
  { top: "8%", left: "22%", rotate: -5, size: 150, opacity: 0.26 },
  { top: "8%", right: "22%", rotate: 10, size: 150, opacity: 0.26 },
  { top: "45%", left: "18%", rotate: 2, size: 130, opacity: 0.22 },
  { top: "45%", right: "18%", rotate: -7, size: 130, opacity: 0.22 },
  { bottom: "12%", left: "35%", rotate: -4, size: 140, opacity: 0.24 },
];

// Soles — más centrales, como elementos de atmósfera (se eligen 2 al azar)
const SUN_POOL: Omit<DecorSlot, "kind">[] = [
  { top: "6%", left: "40%", rotate: 5, size: 210, opacity: 0.3 },
  { top: "38%", left: "42%", rotate: -8, size: 230, opacity: 0.28 },
  { bottom: "10%", right: "35%", rotate: 12, size: 200, opacity: 0.32 },
  { top: "-30px", left: "44%", rotate: -3, size: 240, opacity: 0.35 },
  { bottom: "-20px", right: "40%", rotate: 7, size: 220, opacity: 0.33 },
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, n);
}

interface CreateMorkBorgCharacterScreenProps {
  username: string;
  avatarUrl: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onGoCharacters: () => void;
  onCharacterCreated?: (characterId: string) => void;
}

export default function CreateMorkBorgCharacterScreen({
  username,
  avatarUrl,
  onLogout,
  onGoHome,
  onGoCampaigns,
  onGoCharacters,
  onCharacterCreated,
}: CreateMorkBorgCharacterScreenProps) {
  const creation = useCreateMorkBorgCharacter();
  const [hasAttemptedCreation, setHasAttemptedCreation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [decors] = useState<DecorSlot[]>(() => [
    ...pickRandom(SKULL_POOL, 7).map((s) => ({ ...s, kind: "skull" as const })),
    ...pickRandom(SUN_POOL, 2).map((s) => ({ ...s, kind: "sun" as const })),
  ]);

  const activePhase = MORK_BORG_CREATION_PHASES[creation.activePhaseIndex];

  const nameError =
    hasAttemptedCreation && !creation.name.trim()
      ? "El nombre del personaje es obligatorio."
      : null;

  const portraitError =
    hasAttemptedCreation && !creation.portraitPreview
      ? "El retrato del personaje es obligatorio."
      : null;

  const classError =
    hasAttemptedCreation && !creation.selectedClass
      ? "Debes elegir una clase antes de continuar."
      : null;

  const statsError =
    hasAttemptedCreation && !creation.allStatsComplete
      ? "Debes completar todas las tiradas de estadísticas (4 stats, Vida, Presagios y Carga)."
      : null;

  const equipmentError =
    hasAttemptedCreation && !creation.equipmentComplete
      ? "Debes completar todas las tiradas de equipo para tu clase."
      : null;

  const handleNavChange = (tab: NavTab) => {
    if (tab === "home") {
      onGoHome();
      return;
    }
    if (tab === "campaigns") {
      onGoCampaigns();
      return;
    }
    onGoCharacters();
  };

  const scrollToFirstError = () => {
    setTimeout(() => {
      document
        .querySelector("[data-validation-error]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const handleCreate = async () => {
    setHasAttemptedCreation(true);
    setCreateError(null);

    const isClassOk =
      !!creation.name.trim() &&
      !!creation.portraitPreview &&
      !!creation.selectedClass;
    const isStatsOk = creation.allStatsComplete;
    const isEquipOk = creation.equipmentComplete;

    if (!isClassOk) {
      creation.setActivePhaseIndex(0);
      scrollToFirstError();
      return;
    }
    if (!isStatsOk) {
      creation.setActivePhaseIndex(1);
      scrollToFirstError();
      return;
    }
    if (!isEquipOk) {
      creation.setActivePhaseIndex(2);
      scrollToFirstError();
      return;
    }

    setIsCreating(true);
    let resp: Response | undefined;
    try {
      const payload = {
        nombre: creation.name.trim(),
        claseId: creation.selectedClass!.id,
        claseOpciones: creation.claseOpciones,
        ...creation.statsSnapshot,
        ...creation.equipmentSnapshot,
        ...creation.traitsData,
      };

      const token = localStorage.getItem("jwtToken") ?? "";
      const formData = new FormData();
      formData.append("portrait", creation.portraitFile!);
      formData.append(
        "payload",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );

      resp = await fetch(buildApiUrl("/api/personajes/mork-borg"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => "(sin cuerpo)");
        console.error(`[MorkBorg] Error HTTP ${resp.status}:`, body);
        throw new Error(`HTTP ${resp.status}`);
      }

      // Creación exitosa — intentar leer el ID pero navegar siempre
      try {
        const created = (await resp.json()) as { id: number };
        onCharacterCreated?.(String(created.id));
      } catch (e) {
        console.warn(
          "[MorkBorg] No se pudo leer el ID del personaje creado",
          e,
        );
      }
      onGoCharacters();
    } catch (e) {
      console.error("[MorkBorg] Error al crear personaje:", e, resp?.status);
      setCreateError("No se pudo crear el personaje. Inténtalo de nuevo.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <LogoLayout onLogoClick={onGoHome} fullWidth>
      <>
        <UserMenu
          username={username}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />

        <div className="relative z-10 w-full px-4 pt-28 pb-32 md:px-8 md:pb-36">
          {/* Contenedor principal — sin overflow-hidden para que las decoraciones no se recorten */}
          <div className="relative rounded-[32px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.96)_0%,rgba(28,25,23,0.9)_48%,rgba(10,10,10,0.98)_100%)] p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-8">
            {/* Glows decorativos */}
            <div className="pointer-events-none absolute -top-20 right-[-40px] h-56 w-56 rounded-full bg-stone-400/8 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-90px] left-[-20px] h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />

            {/* Decoraciones: calaveras (bordes) + soles (atmósfera) */}
            {decors.map((d, i) => (
              <img
                key={i}
                src={d.kind === "skull" ? imgCalavera : imgSol}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute select-none z-0"
                style={{
                  top: d.top,
                  bottom: d.bottom,
                  left: d.left,
                  right: d.right,
                  width: d.size,
                  transform: `rotate(${d.rotate}deg)`,
                  opacity: d.opacity,
                }}
              />
            ))}

            {/* ── Contenido (z-[60] — por encima de decoraciones y de la navbar z-50) ── */}
            <div className="relative z-[60]">
              {/* ── Cabecera ── */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-200/80">
                    ☠ Mork Borg
                  </p>
                  <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
                    Crear personaje
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-stone-200 md:text-base">
                    El mundo se acaba. Elige cómo quieres morir.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onGoCharacters}
                  className="rounded-full border border-stone-300/15 bg-stone-950/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-amber-300/25 hover:bg-stone-900"
                >
                  Volver a personajes
                </button>
              </div>

              {/* ── Navegación de fases ── */}
              <div className="mt-8 grid gap-3 lg:grid-cols-4">
                {MORK_BORG_CREATION_PHASES.map((phase, index) => {
                  const isActive = index === creation.activePhaseIndex;
                  const isCompleted = index < creation.activePhaseIndex;
                  const phaseHasError =
                    hasAttemptedCreation &&
                    ((phase.id === "class" &&
                      (classError !== null ||
                        portraitError !== null ||
                        nameError !== null)) ||
                      (phase.id === "stats" && statsError !== null) ||
                      (phase.id === "equipment" && equipmentError !== null));

                  return (
                    <button
                      key={phase.id}
                      type="button"
                      onClick={() => creation.setActivePhaseIndex(index)}
                      className={`rounded-[22px] border px-4 py-4 text-left transition ${
                        phaseHasError
                          ? isActive
                            ? "border-rose-400/70 bg-[linear-gradient(90deg,rgba(69,10,10,0.72),rgba(127,29,29,0.26))] text-rose-50 shadow-[0_12px_30px_rgba(127,29,29,0.18)]"
                            : "border-rose-400/45 bg-rose-950/20 text-rose-100 hover:border-rose-300/60"
                          : isActive
                            ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12 text-amber-100 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
                            : isCompleted
                              ? "border-[#4A3520] bg-[#2A1F12] text-stone-200 hover:border-amber-900/60"
                              : "border-[#4A3520] bg-[#2A1F12] text-stone-200 hover:border-amber-900/60 hover:bg-[rgba(55,40,22,0.55)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{phase.title}</p>
                        {phaseHasError ? (
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ── Fase: Clase ── */}
              <div
                data-phase-active={
                  activePhase.id === "class" ? "true" : undefined
                }
                className={activePhase.id === "class" ? "" : "hidden"}
              >
                <MorkBorgIdentitySection
                  name={creation.name}
                  portraitPreview={creation.portraitPreview}
                  fileInputRef={creation.fileInputRef}
                  portraitError={portraitError ?? undefined}
                  nameError={nameError ?? undefined}
                  onNameChange={creation.setName}
                  onPortraitSelection={creation.handlePortraitSelection}
                  onOpenFilePicker={creation.handleOpenFilePicker}
                />

                <div className="mt-8 border-t border-stone-300/10" />

                <MorkBorgClassSelectionSection
                  classes={MORK_BORG_CLASSES}
                  selectedClass={creation.selectedClass}
                  hasError={classError !== null}
                  selectionError={classError ?? undefined}
                  onClassClick={creation.selectClass}
                  onClearSelection={creation.clearClass}
                  onOpcionRolled={creation.notifyClaseOpcionRolled}
                />
              </div>

              {/* ── Fase: Estadísticas ── */}
              <div
                data-phase-active={
                  activePhase.id === "stats" ? "true" : undefined
                }
                className={activePhase.id === "stats" ? "" : "hidden"}
              >
                <MorkBorgStatsSection
                  selectedClass={creation.selectedClass}
                  hasError={statsError !== null}
                  onPresenciaRolled={creation.notifyPresenciaRolled}
                  onAllMainStatsRolled={creation.notifyAllMainStatsRolled}
                  onAllStatsComplete={creation.notifyAllStatsComplete}
                  onStatsSnapshot={creation.notifyStatsSnapshot}
                />
              </div>

              {/* ── Fase: Equipo ── */}
              <div
                data-phase-active={
                  activePhase.id === "equipment" ? "true" : undefined
                }
                className={activePhase.id === "equipment" ? "" : "hidden"}
              >
                <MorkBorgEquipmentSection
                  selectedClass={creation.selectedClass}
                  presenciaModifier={creation.presenciaModifier}
                  allStatsRolled={creation.allMainStatsRolled}
                  hasError={equipmentError !== null}
                  onEquipmentComplete={creation.notifyEquipmentComplete}
                />
              </div>

              {/* ── Fase: Rasgos ── */}
              <div
                data-phase-active={
                  activePhase.id === "traits" ? "true" : undefined
                }
                className={activePhase.id === "traits" ? "" : "hidden"}
              >
                <MorkBorgRasgosSection
                  onAllRasgosComplete={creation.notifyRasgosComplete}
                />
              </div>

              {/* ── Botón crear ── */}
              <div className="mt-10 flex flex-col items-end gap-3">
                {createError ? (
                  <p className="text-sm text-rose-400">{createError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="rounded-full border border-amber-300/35 bg-[linear-gradient(90deg,rgba(28,25,23,0.92),rgba(245,158,11,0.12))] px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-amber-100 shadow-[0_4px_18px_rgba(0,0,0,0.25)] transition hover:border-amber-300/60 hover:bg-[linear-gradient(90deg,rgba(41,37,36,0.96),rgba(245,158,11,0.18))] disabled:opacity-50"
                >
                  {isCreating ? "Creando…" : "Crear personaje"}
                </button>
              </div>
            </div>
            {/* fin z-10 content wrapper */}
          </div>
        </div>
      </>

      <HomeNavbar activeTab="characters" onTabChange={handleNavChange} />
    </LogoLayout>
  );
}
