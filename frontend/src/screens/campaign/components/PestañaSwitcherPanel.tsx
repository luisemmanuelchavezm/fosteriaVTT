import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { buildApiUrl } from "../../../lib/api";

interface PestañaCard {
  id: number;
  nombre: string;
  mapaCapaUrl?: string | null;
}

interface Player {
  username: string;
  dm: boolean;
}

interface PestañaSwitcherPanelProps {
  campaignId: string;
  currentPestañaId: number | null;
  isDM: boolean;
  username: string;
  onSelect: (pestañaId: number) => void;
  onClose: () => void;
  onForzarTodos: (pestañaId: number) => void;
  onForzarJugadores: (pestañaId: number, jugadores: string[]) => void;
}

export default function PestañaSwitcherPanel({
  campaignId,
  currentPestañaId,
  isDM,
  username,
  onSelect,
  onClose,
  onForzarTodos,
  onForzarJugadores,
}: PestañaSwitcherPanelProps) {
  const [pestañas, setPestañas] = useState<PestañaCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [pendingId, setPendingId] = useState<number | null>(null);
  const [pendingName, setPendingName] = useState<string>("");
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [dropdownMode, setDropdownMode] = useState<"options" | "players">(
    "options",
  );
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set(),
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchPestañas = () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    setIsLoading(true);
    fetch(buildApiUrl(`/api/campanas/${campaignId}/pestanas`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: PestañaCard[]) => setPestañas(data))
      .catch(() => setPestañas([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPestañas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // Close dropdown on outside click
  useEffect(() => {
    if (pendingId === null) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        resetDropdown();
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [pendingId]);

  const resetDropdown = () => {
    setPendingId(null);
    setPendingName("");
    setDropdownPos(null);
    setDropdownMode("options");
    setSelectedPlayers(new Set());
  };

  const handleCreate = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token || isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch(
        buildApiUrl(`/api/campanas/${campaignId}/pestanas`),
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return;
      const nueva = (await res.json()) as PestañaCard;
      setPestañas((prev) => [...prev, nueva]);
      onSelect(nueva.id);
    } catch {
      // ignore
    } finally {
      setIsCreating(false);
    }
  };

  const handleCardClick = (
    pestañaId: number,
    nombre: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!isDM) {
      onSelect(pestañaId);
      return;
    }
    if (pendingId === pestañaId) {
      resetDropdown();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownWidth = 224;
    const left = Math.min(rect.left, window.innerWidth - dropdownWidth - 12);
    setDropdownPos({ top: rect.bottom + 8, left });
    setPendingId(pestañaId);
    setPendingName(nombre);
    setDropdownMode("options");
    setSelectedPlayers(new Set());
  };

  const handleSelectPlayersMode = async () => {
    setDropdownMode("players");
    setLoadingPlayers(true);
    try {
      const token = localStorage.getItem("jwtToken");
      const res = await fetch(
        buildApiUrl(`/api/campanas/${campaignId}/jugadores`),
        { headers: { Authorization: `Bearer ${token ?? ""}` } },
      );
      const data = (await res.json()) as Player[];
      setPlayers(data.filter((p) => !p.dm));
    } catch {
      setPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const togglePlayer = (playerUsername: string) => {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(playerUsername)) next.delete(playerUsername);
      else next.add(playerUsername);
      return next;
    });
  };

  const handleMover = () => {
    if (pendingId === null) return;
    onForzarJugadores(pendingId, [username, ...Array.from(selectedPlayers)]);
    onSelect(pendingId);
    resetDropdown();
  };

  return (
    <>
      {/* Main panel strip */}
      <div className="absolute inset-x-0 top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
            Pestañas
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* Cards — horizontal scroll */}
        <div className="flex flex-nowrap gap-3 overflow-x-auto px-5 pb-4 [scrollbar-width:thin]">
          {isLoading ? (
            <p className="py-2 text-xs text-white/40">Cargando pestañas…</p>
          ) : (
            <>
              {pestañas.map((p) => {
                const isCurrent = p.id === currentPestañaId;
                const isPending = p.id === pendingId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={(e) => {
                      handleCardClick(p.id, p.nombre, e);
                    }}
                    className={`group relative flex w-40 shrink-0 flex-col overflow-hidden rounded-xl border transition ${
                      isPending
                        ? "border-sky-400/70 ring-1 ring-sky-400/40"
                        : isCurrent
                          ? "border-amber-400/70 ring-1 ring-amber-400/40"
                          : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="relative h-24 w-full overflow-hidden bg-stone-900">
                      {p.mapaCapaUrl ? (
                        <img
                          src={p.mapaCapaUrl}
                          alt={p.nombre}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="h-full w-full bg-white"
                          style={{
                            backgroundImage:
                              "linear-gradient(rgba(0,0,0,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.07) 1px, transparent 1px)",
                            backgroundSize: "14px 14px",
                          }}
                        />
                      )}
                      {isPending && (
                        <div className="absolute inset-0 bg-sky-400/10" />
                      )}
                      {isCurrent && !isPending && (
                        <div className="absolute inset-0 bg-amber-400/10" />
                      )}
                    </div>

                    <div className="bg-stone-900/60 px-2.5 py-2 text-left">
                      <p
                        className={`truncate text-xs font-semibold ${
                          isPending
                            ? "text-sky-300"
                            : isCurrent
                              ? "text-amber-200"
                              : "text-white/80"
                        }`}
                      >
                        {p.nombre}
                      </p>
                      {isCurrent && !isPending && (
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-400/70">
                          Activa
                        </p>
                      )}
                      {isPending && (
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-sky-400/70">
                          Seleccionada
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  void handleCreate();
                }}
                disabled={isCreating}
                className="flex h-[calc(96px+40px)] w-40 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 bg-white shadow-md transition hover:scale-[1.02] hover:shadow-lg disabled:opacity-40"
              >
                <span className="text-5xl font-light leading-none text-stone-400">
                  +
                </span>
                <span className="text-xs font-semibold text-stone-500">
                  Nueva pestaña
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Floating dropdown — teleported to body coordinates via fixed positioning */}
      {pendingId !== null && dropdownPos !== null && (
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          className="fixed z-50 w-56 rounded-xl border border-white/15 bg-black/90 p-3.5 shadow-2xl backdrop-blur-sm"
        >
          {dropdownMode === "options" ? (
            <>
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                {pendingName}
              </p>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(pendingId);
                    resetDropdown();
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-white/80 transition hover:bg-white/10"
                >
                  Cambiar solo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onForzarTodos(pendingId);
                    onSelect(pendingId);
                    resetDropdown();
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-amber-200 transition hover:bg-amber-400/10"
                >
                  Cambiar todos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSelectPlayersMode();
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-sky-200 transition hover:bg-sky-400/10"
                >
                  Seleccionar jugadores
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Seleccionar jugadores
                </p>
                <button
                  type="button"
                  onClick={() => setDropdownMode("options")}
                  className="text-white/40 transition hover:text-white/70"
                >
                  <X size={12} />
                </button>
              </div>

              <div className="mb-3 flex max-h-40 flex-col gap-1 overflow-y-auto [scrollbar-width:thin]">
                {loadingPlayers ? (
                  <p className="py-1 text-xs text-white/40">Cargando…</p>
                ) : players.length === 0 ? (
                  <p className="py-1 text-xs text-white/40">
                    No hay jugadores.
                  </p>
                ) : (
                  players.map((player) => (
                    <button
                      key={player.username}
                      type="button"
                      onClick={() => {
                        togglePlayer(player.username);
                      }}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/5"
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                          selectedPlayers.has(player.username)
                            ? "border-amber-400 bg-amber-400"
                            : "border-white/30"
                        }`}
                      >
                        {selectedPlayers.has(player.username) && (
                          <Check size={10} className="text-black" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-white/80">
                        {player.username}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={handleMover}
                disabled={selectedPlayers.size === 0}
                className="w-full rounded-lg bg-green-600 py-1.5 text-xs font-bold text-white transition hover:bg-green-500 disabled:opacity-40"
              >
                Mover
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
