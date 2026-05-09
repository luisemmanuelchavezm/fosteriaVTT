import { useEffect, useState } from "react";
import {
  fetchSpellCatalog,
  type CharacterAbilityResponse,
} from "../../utils/dndApi";
import { getSpellLevel } from "../utils/characterAbilities";

interface SpellCatalogModalProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onAddSpell: (abilityId: number) => Promise<void>;
}

const CLASS_FILTERS = [
  "",
  "Bardo",
  "Brujo",
  "Clerigo",
  "Druida",
  "Explorador",
  "Hechicero",
  "Mago",
  "Paladin",
];

export default function SpellCatalogModal({
  token,
  isOpen,
  onClose,
  onAddSpell,
}: SpellCatalogModalProps) {
  const [search, setSearch] = useState("");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState("");
  const [spells, setSpells] = useState<CharacterAbilityResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      void fetchSpellCatalog(
        token,
        {
          nombre: search.trim() || undefined,
          nivel:
            levelFilter === "" ? undefined : Number.parseInt(levelFilter, 10),
          clase: classFilter || undefined,
        },
        abortController.signal,
      )
        .then(setSpells)
        .catch((fetchError) => {
          if ((fetchError as Error).name === "AbortError") {
            return;
          }
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "No se pudo cargar el catálogo de hechizos.",
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
  }, [classFilter, isOpen, levelFilter, search, token]);

  const closeModal = () => {
    setSearch("");
    setLevelFilter("");
    setClassFilter("");
    setAdvancedFiltersOpen(false);
    setError(null);
    onClose();
  };

  const handleAdd = async (abilityId: number) => {
    try {
      setIsSubmitting(true);
      await onAddSpell(abilityId);
      closeModal();
    } catch (submitIssue) {
      setError(
        submitIssue instanceof Error
          ? submitIssue.message
          : "No se pudo añadir el hechizo al personaje.",
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
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-stone-300/12 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_rgba(12,10,9,0.96)_52%)] text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-stone-300/10 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-sky-200/80">Hechizos</p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Añadir hechizos
            </h3>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label="Cerrar modal de hechizos"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300/15 bg-black/45 text-xl text-white transition hover:border-amber-300/30 hover:bg-stone-900/70"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filtrar por nombre"
              className="rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
            />
            <button
              type="button"
              onClick={() => setAdvancedFiltersOpen((current) => !current)}
              className="rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm font-semibold text-stone-100"
            >
              Filtros avanzados
            </button>
          </div>

          {advancedFiltersOpen ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <select
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value)}
                className="rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">Todos los niveles</option>
                <option value="0">Truco</option>
                {Array.from({ length: 9 }, (_, index) => index + 1).map(
                  (level) => (
                    <option key={level} value={level}>
                      Nivel {level}
                    </option>
                  ),
                )}
              </select>

              <select
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
                className="rounded-[16px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">Todas las clases</option>
                {CLASS_FILTERS.filter(Boolean).map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-[16px] border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-5 text-sm text-stone-300">
                Cargando catálogo de hechizos...
              </div>
            ) : null}

            {!isLoading && spells.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm text-stone-400">
                No hay hechizos o trucos que coincidan con el filtro actual.
              </div>
            ) : null}

            {spells.map((spell) => (
              <article
                key={spell.id}
                className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-white">
                      {spell.nombre}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-400">
                      {getSpellLevel(spell) === 0
                        ? "Truco"
                        : `Nivel ${getSpellLevel(spell)}`}
                    </p>
                    {spell.formula ? (
                      <p className="mt-3 text-sm font-semibold text-amber-100">
                        {spell.formula}
                      </p>
                    ) : null}
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-300">
                      {spell.descripcion || "Sin descripción."}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleAdd(spell.id)}
                    className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 disabled:opacity-50"
                  >
                    Añadir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
