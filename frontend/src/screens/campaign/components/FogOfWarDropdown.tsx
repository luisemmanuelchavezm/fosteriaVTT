import { useEffect, useRef } from "react";
import type { NieblaEstado } from "../hooks/useCampaignRealtime";

interface FogOfWarDropdownProps {
  estado: NieblaEstado;
  onChange: (patch: Partial<NieblaEstado>) => void;
  onClose: () => void;
}

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-amber-500" : "bg-white/20"
      } ${disabled ? "cursor-not-allowed opacity-35" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function FogOfWarDropdown({
  estado,
  onChange,
  onClose,
}: FogOfWarDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-11 top-0 z-50 min-w-[220px] rounded-xl border border-white/15 bg-black/90 p-3.5 shadow-2xl backdrop-blur-sm"
    >
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
        Niebla de guerra
      </p>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="text-sm font-semibold text-white">Activa</span>
          <ToggleSwitch
            checked={estado.activa}
            onChange={(v) => onChange({ activa: v })}
          />
        </label>

        <label
          title="La zona ya vista permanece parcialmente visible para los jugadores"
          className={`flex cursor-pointer items-center justify-between gap-3 transition-opacity ${
            !estado.activa ? "pointer-events-none opacity-35" : ""
          }`}
        >
          <span className="text-sm text-white/80">Zonas exploradas</span>
          <ToggleSwitch
            checked={estado.zonasExploradas}
            disabled={!estado.activa}
            onChange={(v) => onChange({ zonasExploradas: v })}
          />
        </label>

        <label
          title="Te permite ver como ven los jugadores"
          className={`flex cursor-pointer items-center justify-between gap-3 transition-opacity ${
            !estado.activa ? "pointer-events-none opacity-35" : ""
          }`}
        >
          <span className="text-sm text-white/80">Vista de jugador</span>
          <ToggleSwitch
            checked={estado.vistaJugador}
            disabled={!estado.activa}
            onChange={(v) => onChange({ vistaJugador: v })}
          />
        </label>
      </div>
    </div>
  );
}
