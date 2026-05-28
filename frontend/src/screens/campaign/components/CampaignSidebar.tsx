import {
  Archive,
  BookOpen,
  Cloud,
  Link2,
  Map,
  Move,
  Pencil,
  Ruler,
  Settings,
  Timer,
  User,
} from "lucide-react";
import FogOfWarDropdown from "./FogOfWarDropdown";
import { SidebarBtn, SidebarDivider } from "./SidebarBtn";
import type { LayerSelection, NieblaEstado, ToolSelection } from "../types";
import type { IniciativaEstado } from "../hooks/useCampaignRealtime";

export interface GridConfigFormState {
  nCuadriculasX: number;
  nCuadriculasY: number;
  distanciaCasilla: number;
  sistemaMetrico: string;
}

interface CampaignSidebarProps {
  isDM: boolean;

  // Configuración de cuadrícula
  settingsMode: null | "options" | "gridConfig";
  onSettingsModeChange: (mode: null | "options" | "gridConfig") => void;
  gridConfigForm: GridConfigFormState;
  onGridConfigFormChange: React.Dispatch<
    React.SetStateAction<GridConfigFormState>
  >;
  isSavingGridConfig: boolean;
  settingsDropdownRef: React.RefObject<HTMLDivElement | null>;
  onSaveGridConfig: () => void;
  onAutoGrid: () => void;
  mapLayerImage: HTMLImageElement | null;

  // Invitación
  inviteRef: React.RefObject<HTMLDivElement | null>;
  isInviteOpen: boolean;
  onInviteOpenChange: (v: boolean | ((v: boolean) => boolean)) => void;
  inviteCopied: boolean;
  inviteLink: string;
  onCopyInvite: () => void;

  // Herramientas
  selectedTool: ToolSelection;
  onToolSelect: (tool: ToolSelection) => void;

  // Capas
  selectedLayer: LayerSelection;
  onLayerSelect: (layer: LayerSelection) => void;

  // Niebla de guerra
  nieblaEstado: NieblaEstado;
  onNieblaChange: (patch: {
    activa?: boolean;
    zonasExploradas?: boolean;
    vistaJugador?: boolean;
  }) => void;
  isFogDropdownOpen: boolean;
  onFogDropdownOpenChange: (v: boolean | ((v: boolean) => boolean)) => void;

  // Iniciativa
  iniciativaEstado: IniciativaEstado;
  onActivarIniciativa: (activa: boolean) => void;
}

/** Barra lateral izquierda con herramientas, capas y ajustes de la campaña. */
export default function CampaignSidebar({
  isDM,
  settingsMode,
  onSettingsModeChange,
  gridConfigForm,
  onGridConfigFormChange,
  isSavingGridConfig,
  settingsDropdownRef,
  onSaveGridConfig,
  onAutoGrid,
  mapLayerImage,
  inviteRef,
  isInviteOpen,
  onInviteOpenChange,
  inviteCopied,
  inviteLink,
  onCopyInvite,
  selectedTool,
  onToolSelect,
  selectedLayer,
  onLayerSelect,
  nieblaEstado,
  onNieblaChange,
  isFogDropdownOpen,
  onFogDropdownOpenChange,
  onActivarIniciativa,
}: CampaignSidebarProps) {
  return (
    <div className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 flex flex-col items-center gap-1 rounded-[12px] border border-white/15 bg-black/50 p-[8px_6px]">
      {/* Ajustes — solo para el DM */}
      {isDM && (
        <div
          className="relative"
          ref={settingsDropdownRef as React.RefObject<HTMLDivElement>}
        >
          <SidebarBtn
            title="Ajustes"
            isActive={settingsMode !== null}
            onClick={() =>
              onSettingsModeChange(settingsMode ? null : "options")
            }
          >
            <Settings size={18} />
          </SidebarBtn>

          {isDM && settingsMode === "options" && (
            <div className="absolute left-full top-0 z-50 ml-2 w-52 rounded-xl border border-white/15 bg-black/90 p-2 shadow-2xl backdrop-blur-sm">
              <button
                type="button"
                onClick={() => onSettingsModeChange("gridConfig")}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                Configuración de casillas
              </button>
            </div>
          )}

          {isDM && settingsMode === "gridConfig" && (
            <div className="absolute left-full top-0 z-50 ml-2 w-64 rounded-xl border border-white/15 bg-black/90 p-3.5 shadow-2xl backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Casillas
                </p>
                <button
                  type="button"
                  onClick={() => onSettingsModeChange("options")}
                  className="text-[10px] text-white/40 transition hover:text-white/70"
                >
                  ← Volver
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onAutoGrid}
                  disabled={!mapLayerImage}
                  title={
                    !mapLayerImage
                      ? "Carga un mapa primero"
                      : "Calcular cuadrícula según la proporción de la imagen"
                  }
                  className="w-full rounded-lg border border-amber-400/40 bg-amber-600/15 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-600/30 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  ✦ Automático
                </button>

                <div className="flex gap-2">
                  <label className="flex flex-1 flex-col gap-1">
                    <span className="text-[10px] font-semibold text-white/50">
                      Columnas
                    </span>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={gridConfigForm.nCuadriculasX}
                      onChange={(e) =>
                        onGridConfigFormChange((prev) => ({
                          ...prev,
                          nCuadriculasX: Number(e.target.value),
                        }))
                      }
                      onBlur={(e) =>
                        onGridConfigFormChange((prev) => ({
                          ...prev,
                          nCuadriculasX: Math.max(
                            10,
                            Math.min(100, Number(e.target.value) || 10),
                          ),
                        }))
                      }
                      className="rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-sm text-white outline-none focus:border-amber-400/60"
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1">
                    <span className="text-[10px] font-semibold text-white/50">
                      Filas
                    </span>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={gridConfigForm.nCuadriculasY}
                      onChange={(e) =>
                        onGridConfigFormChange((prev) => ({
                          ...prev,
                          nCuadriculasY: Number(e.target.value),
                        }))
                      }
                      onBlur={(e) =>
                        onGridConfigFormChange((prev) => ({
                          ...prev,
                          nCuadriculasY: Math.max(
                            10,
                            Math.min(100, Number(e.target.value) || 10),
                          ),
                        }))
                      }
                      className="rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-sm text-white outline-none focus:border-amber-400/60"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-white/50">
                    Distancia por casilla
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={gridConfigForm.distanciaCasilla}
                    onChange={(e) =>
                      onGridConfigFormChange((prev) => ({
                        ...prev,
                        distanciaCasilla: Number(e.target.value),
                      }))
                    }
                    className="rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-sm text-white outline-none focus:border-amber-400/60"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-white/50">
                    Sistema métrico
                  </span>
                  <input
                    type="text"
                    maxLength={15}
                    value={gridConfigForm.sistemaMetrico}
                    onChange={(e) =>
                      onGridConfigFormChange((prev) => ({
                        ...prev,
                        sistemaMetrico: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-sm text-white outline-none focus:border-amber-400/60"
                  />
                </label>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onSettingsModeChange(null)}
                  className="flex-1 rounded-lg border border-white/15 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onSaveGridConfig}
                  disabled={isSavingGridConfig}
                  className="flex-1 rounded-lg bg-amber-600 py-1.5 text-xs font-bold text-white transition hover:bg-amber-500 disabled:opacity-40"
                >
                  {isSavingGridConfig ? "…" : "Guardar"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botón de invitación — disponible para todos */}
      <div
        className="relative"
        ref={inviteRef as React.RefObject<HTMLDivElement>}
      >
        <SidebarBtn
          title="Invitar a la campaña"
          isActive={isInviteOpen}
          onClick={() => onInviteOpenChange((v) => !v)}
        >
          <Link2 size={18} />
        </SidebarBtn>

        {isInviteOpen && (
          <div className="absolute left-full top-0 z-50 ml-2 w-72 rounded-xl border border-white/15 bg-black/90 p-3.5 shadow-2xl backdrop-blur-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-400/80">
              Link de invitación
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5">
              <span className="min-w-0 flex-1 truncate select-all font-mono text-[11px] text-white/70">
                {inviteLink}
              </span>
              <button
                type="button"
                onClick={onCopyInvite}
                className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                  inviteCopied
                    ? "bg-emerald-600/70 text-white"
                    : "bg-amber-600/70 text-white hover:bg-amber-500/70"
                }`}
              >
                {inviteCopied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        )}
      </div>

      <SidebarDivider label="click" />

      {/* Herramienta de movimiento */}
      <SidebarBtn
        title="Mover"
        isActive={selectedTool === "move"}
        onClick={() => onToolSelect("move")}
      >
        <Move size={18} />
      </SidebarBtn>

      <SidebarDivider label="Herramientas" />

      {/* Lápiz */}
      <SidebarBtn
        title="Lápiz"
        isActive={selectedTool === "pencil"}
        onClick={() => onToolSelect("pencil")}
      >
        <Pencil size={18} />
      </SidebarBtn>

      {/* Regla */}
      <SidebarBtn
        title="Regla"
        isActive={selectedTool === "ruler"}
        onClick={() => onToolSelect("ruler")}
      >
        <Ruler size={18} />
      </SidebarBtn>

      {/* Niebla de guerra — solo DM */}
      {isDM && (
        <div className="relative">
          <SidebarBtn
            title="Niebla de guerra"
            isActive={selectedTool === "fog" || isFogDropdownOpen}
            onClick={() => {
              onToolSelect("fog");
              onFogDropdownOpenChange((v) => !v);
            }}
          >
            <Cloud size={18} />
          </SidebarBtn>
          {isFogDropdownOpen && (
            <FogOfWarDropdown
              estado={nieblaEstado}
              onChange={(patch) => {
                onNieblaChange(patch);
              }}
              onClose={() => onFogDropdownOpenChange(false)}
            />
          )}
        </div>
      )}

      {/* Temporizador / iniciativa — solo DM */}
      {isDM && (
        <SidebarBtn
          title="Temporizador"
          isActive={selectedTool === "timer"}
          onClick={() => {
            if (selectedTool === "timer") {
              onActivarIniciativa(false);
              onToolSelect("move");
            } else {
              onActivarIniciativa(true);
              onToolSelect("timer");
            }
          }}
        >
          <Timer size={18} />
        </SidebarBtn>
      )}

      {/* Baúl */}
      <SidebarBtn title="Baúl" onClick={() => onToolSelect("chest")}>
        <Archive size={18} />
      </SidebarBtn>

      {/* Capas — solo DM */}
      {isDM && (
        <>
          <SidebarDivider label="Capas" />
          <SidebarBtn
            title="Fichas"
            isActive={selectedLayer === "fichas"}
            onClick={() => onLayerSelect("fichas")}
          >
            <User size={18} />
          </SidebarBtn>
          <SidebarBtn
            title="Mapa"
            isActive={selectedLayer === "mapa"}
            onClick={() => onLayerSelect("mapa")}
          >
            <Map size={18} />
          </SidebarBtn>
          <SidebarBtn
            title="DM"
            isActive={selectedLayer === "dm"}
            onClick={() => onLayerSelect("dm")}
          >
            <BookOpen size={18} />
          </SidebarBtn>
        </>
      )}
    </div>
  );
}
