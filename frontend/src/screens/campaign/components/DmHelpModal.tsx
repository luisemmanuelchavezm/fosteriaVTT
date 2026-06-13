import { BookOpen, Minimize2, X } from "lucide-react";
import type {
  MBAyudaDmCatalogo,
  MBAyudaDmCategoria,
  MBAyudaDmSeccion,
} from "../../personaje/utils/mbApi";
import {
  DM_HELP_TABLE_STYLE,
  getDmHelpDiceLabel,
  renderDmHelpTable,
  renderDmHelpTableGrouped,
  renderDmHelpTablas,
  renderDmHelpTwoColumn,
  renderEntryText,
} from "./dmHelp/dmHelpRenderers";

interface DmHelpModalProps {
  position: { x: number; y: number };
  isMinimized: boolean;
  catalog: MBAyudaDmCatalogo | null;
  isLoading: boolean;
  error: string;
  section: string;
  onSectionChange: (id: string) => void;
  rolls: Record<string, number>;
  isRolling: boolean;
  onRoll: (section: MBAyudaDmSeccion) => void;
  onDragStart: (
    e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
  ) => void;
  onMinimize: () => void;
  onExpand: () => void;
  onClose: () => void;
}

export default function DmHelpModal({
  position,
  isMinimized,
  catalog,
  isLoading,
  error,
  section,
  onSectionChange,
  rolls,
  isRolling,
  onRoll,
  onDragStart,
  onMinimize,
  onExpand,
  onClose,
}: DmHelpModalProps) {
  const sections = catalog?.secciones ?? [];
  const activeSection = sections.find(
    (s: MBAyudaDmSeccion) => s.id === section,
  );

  return (
    <div className="fixed z-[45]" style={{ left: position.x, top: position.y }}>
      {isMinimized ? (
        <button
          type="button"
          onMouseDown={onDragStart}
          onClick={onExpand}
          className="flex h-11 min-w-[240px] items-center justify-between rounded-2xl border border-sky-300/25 bg-[linear-gradient(180deg,rgba(18,24,39,0.98)_0%,rgba(7,12,20,0.98)_100%)] px-4 text-sm font-semibold text-sky-100 shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
        >
          <span className="flex items-center gap-2">
            <BookOpen size={15} />
            Ayuda al DM
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-sky-200/60">
            Abrir
          </span>
        </button>
      ) : (
        <div className="flex max-h-[80vh] w-[min(760px,calc(100vw-32px))] flex-col overflow-hidden rounded-[24px] border border-sky-300/20 bg-[linear-gradient(180deg,rgba(17,24,39,0.98)_0%,rgba(4,7,14,0.99)_100%)] text-white shadow-[0_28px_70px_rgba(0,0,0,0.5)]">
          <div
            onMouseDown={onDragStart}
            className="flex shrink-0 cursor-move items-center justify-between border-b border-white/10 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-sky-200" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/65">
                  DM
                </p>
                <p className="text-sm font-bold text-white">Ayuda al DM</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onMinimize}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                title="Minimizar"
              >
                <Minimize2 size={14} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                title="Cerrar"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-black/10 px-5 py-4">
            {section === "index" ? (
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-amber-300">Indice</h4>
                {isLoading ? (
                  <p className="text-sm text-stone-300">
                    Cargando apartados...
                  </p>
                ) : error ? (
                  <p className="text-sm text-rose-300">{error}</p>
                ) : sections.length === 0 ? (
                  <p className="text-sm text-stone-300">
                    No hay apartados disponibles.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {(catalog?.categorias ?? []).length > 0 ? (
                      catalog!.categorias!.map((cat: MBAyudaDmCategoria) => {
                        const isVerde = cat.color === "verde";
                        const isRojo = cat.color === "rojo";
                        const catSections = cat.seccionIds
                          .map((sid) =>
                            sections.find(
                              (s: MBAyudaDmSeccion) => s.id === sid,
                            ),
                          )
                          .filter(Boolean) as MBAyudaDmSeccion[];
                        if (catSections.length === 0) return null;
                        return (
                          <div key={cat.id}>
                            <p
                              className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${isVerde ? "text-emerald-300/70" : isRojo ? "text-rose-300/70" : "text-stone-400/80"}`}
                            >
                              {cat.titulo}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {catSections.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => onSectionChange(s.id)}
                                  className={
                                    isVerde
                                      ? "flex h-10 min-w-[140px] items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
                                      : isRojo
                                        ? "flex h-10 min-w-[140px] items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20"
                                        : "flex h-10 min-w-[140px] items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20"
                                  }
                                >
                                  {s.titulo}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        {sections.map((s: MBAyudaDmSeccion) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => onSectionChange(s.id)}
                            className="flex h-10 min-w-[140px] items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20"
                          >
                            {s.titulo}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeSection ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      onClick={() => onSectionChange("index")}
                      className="mb-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      Volver
                    </button>
                    <h4 className="text-lg font-bold text-amber-300">
                      {activeSection.titulo}
                      {activeSection.dado
                        ? ` ${getDmHelpDiceLabel(activeSection.dado)}`
                        : ""}
                    </h4>
                  </div>

                  {activeSection.dado ? (
                    <div className="flex items-center gap-2">
                      {activeSection.dado !== "2d6" &&
                      rolls[activeSection.id] ? (
                        <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-sm font-bold text-amber-100">
                          {rolls[activeSection.id]}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onRoll(activeSection)}
                        disabled={isRolling}
                        className="flex items-center gap-1.5 rounded-full border border-rose-500/35 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-950/50 disabled:cursor-not-allowed disabled:opacity-40"
                        title={`Tirar ${getDmHelpDiceLabel(activeSection.dado)}`}
                      >
                        <span className="text-base leading-none">
                          {isRolling ? "..." : "🎲"}
                        </span>
                        {getDmHelpDiceLabel(activeSection.dado)}
                      </button>
                    </div>
                  ) : null}
                </div>

                {activeSection.descripcion ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">
                    {activeSection.descripcion}
                  </p>
                ) : null}

                {activeSection.tablas && activeSection.tablas.length > 0
                  ? renderDmHelpTablas(
                      activeSection.tablas,
                      activeSection.layout,
                    )
                  : activeSection.columnas && activeSection.columnas.length > 0
                    ? renderDmHelpTwoColumn(activeSection.columnas)
                    : activeSection.grupos && activeSection.grupos.length > 0
                      ? renderDmHelpTableGrouped(
                          activeSection.grupos,
                          rolls[activeSection.id] ?? null,
                        )
                      : renderDmHelpTable(
                          activeSection.entradas,
                          rolls[activeSection.id] ?? null,
                          {
                            scrollable: false,
                            textClassName: "leading-6",
                            etiquetas: activeSection.etiquetas,
                            isD66: !!activeSection.etiquetas,
                          },
                        )}

                {activeSection.nota ? (
                  <div
                    className="overflow-hidden rounded-[18px] border border-white/10 bg-black/35 px-5 py-4 text-sm leading-relaxed shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
                    style={DM_HELP_TABLE_STYLE}
                  >
                    {renderEntryText(
                      activeSection.nota,
                      "text-stone-300 leading-relaxed",
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => onSectionChange("index")}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Volver
                </button>
                <p className="text-sm text-stone-300">
                  No se encontró la sección solicitada.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
