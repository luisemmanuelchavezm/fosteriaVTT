import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import type { CharacterAbilityResponse } from "../../screens/personaje/utils/dndApi";
import {
  extractRollableExpressions,
  extractSpellMetadata,
  getSpellLevelLabel,
} from "./spellUtils";

interface SpellDetailModalProps {
  spell: CharacterAbilityResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onRollExpression: (spellName: string, expression: string) => void;
  onDelete?: (spell: CharacterAbilityResponse) => void;
}

interface SpellMetaRowProps {
  label: string;
  value: string | null;
}

function SpellMetaRow({ label, value }: SpellMetaRowProps) {
  return (
    <div className="rounded-2xl border border-stone-200/10 bg-black/25 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-100">{value ?? "--"}</p>
    </div>
  );
}

function renderRollableText(
  text: string,
  spellName: string,
  keyPrefix: string,
  onRollExpression: (spellName: string, expression: string) => void,
): ReactNode[] {
  const expressions = extractRollableExpressions(text);
  if (expressions.length === 0) {
    return [<span key={`${keyPrefix}-plain`}>{text}</span>];
  }

  const parts = text.split(/(\b\d+d\d+(?:\s*[+-]\s*\d+)?\b)/gi).filter(Boolean);

  return parts.map((part, index) => {
    if (expressions.includes(part)) {
      return (
        <button
          key={`${keyPrefix}-roll-${index}`}
          type="button"
          onClick={() => onRollExpression(spellName, part)}
          className="rounded-md border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 font-semibold text-amber-100 transition hover:border-amber-300/50 hover:bg-amber-300/20"
        >
          {part}
        </button>
      );
    }

    return <span key={`${keyPrefix}-text-${index}`}>{part}</span>;
  });
}

export default function SpellDetailModal({
  spell,
  isOpen,
  onClose,
  onRollExpression,
  onDelete,
}: SpellDetailModalProps) {
  if (!isOpen || !spell) {
    return null;
  }

  const metadata = extractSpellMetadata(spell.tags);
  const descriptionBlocks = (spell.descripcion ?? "")
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-stone-300/12 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_rgba(12,10,9,0.96)_52%)] text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-stone-300/10 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-sky-200/80">
              {getSpellLevelLabel(spell)}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              {spell.nombre}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de hechizo"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300/15 bg-black/45 text-xl text-white transition hover:border-amber-300/30 hover:bg-stone-900/70"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SpellMetaRow
              label="Tiempo de lanzamiento"
              value={metadata.tiempoLanzamiento}
            />
            <SpellMetaRow label="Alcance" value={metadata.alcance} />
            <SpellMetaRow label="Componentes" value={metadata.componentes} />
            <SpellMetaRow label="Duración" value={metadata.duracion} />
          </div>

          {spell.formula || metadata.formulaDado || metadata.escalado ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <SpellMetaRow
                label="Fórmula"
                value={spell.formula ?? metadata.formulaDado}
              />
              <SpellMetaRow label="Escalado" value={metadata.escalado} />
            </div>
          ) : null}

          <div className="mt-5 rounded-[24px] border border-stone-300/10 bg-black/30 p-5">
            <h4 className="text-lg font-semibold text-amber-100">
              Descripción
            </h4>
            {descriptionBlocks.length > 0 ? (
              <div className="mt-4 space-y-4 text-sm leading-7 text-stone-100/90">
                {descriptionBlocks.map((block, index) => (
                  <p key={`${spell.id}-block-${index}`}>
                    {renderRollableText(
                      block,
                      spell.nombre,
                      `${spell.id}-${index}`,
                      onRollExpression,
                    )}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-stone-300">
                No hay descripción disponible.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-stone-300/10 px-6 py-4">
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(spell)}
              className="rounded-full border border-rose-300/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100"
            >
              Eliminar
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-stone-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
