import { useState, type ReactNode } from "react";
import { EmptyRowsMessage } from "../SheetPrimitives";
import { CompetencyChip } from "./shared";

interface ToolOption {
  name: string;
  category: "instrumentos" | "juegos" | "otros";
}

interface BiographyTabProps {
  isEditMode: boolean;
  languages: string[];
  biographySections: {
    alignment: string | null;
    personalHistory: string | null;
  };
  editableLanguagesText?: string;
  editableAlignment?: string;
  editablePersonalHistory?: string;
  editableWeaponArmorCompetencies: string[];
  editableToolCompetencies: string[];
  filteredWeaponArmorCatalog: string[];
  filteredToolCatalog: ToolOption[];
  onLanguagesTextChange?: (value: string) => void;
  onAlignmentChange?: (value: string) => void;
  onPersonalHistoryChange?: (value: string) => void;
  onRemoveWeaponArmorCompetency?: (value: string) => void;
  onRemoveToolCompetency?: (value: string) => void;
  onAddWeaponArmorCompetency?: (value: string) => void;
  onAddToolCompetency?: (value: string) => void;
  onWeaponArmorSearchChange: (value: string) => void;
  onToolSearchChange: (value: string) => void;
  onWeaponArmorFilterChange: (value: "all" | "weapon" | "armor") => void;
  onToolFilterChange: (
    value: "all" | "instrumentos" | "juegos" | "otros",
  ) => void;
  weaponArmorSearch: string;
  toolSearch: string;
  weaponArmorFilter: "all" | "weapon" | "armor";
  toolFilter: "all" | "instrumentos" | "juegos" | "otros";
}

function CompetencyPanel({
  title,
  items,
  isEditMode,
  buttonLabel,
  renderItem,
  renderPanel,
  emptyMessage,
}: {
  title: string;
  items: string[];
  isEditMode: boolean;
  buttonLabel: string;
  renderItem: (item: string) => ReactNode;
  renderPanel: () => ReactNode;
  emptyMessage: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => renderItem(item))}
        </div>
      ) : (
        <EmptyRowsMessage message={emptyMessage} />
      )}

      {isEditMode ? (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100"
          >
            {buttonLabel}
          </button>
          {isOpen ? renderPanel() : null}
        </div>
      ) : null}
    </div>
  );
}

export default function BiographyTab(props: BiographyTabProps) {
  const {
    isEditMode,
    languages,
    biographySections,
    editableLanguagesText,
    editableAlignment,
    editablePersonalHistory,
    editableWeaponArmorCompetencies,
    editableToolCompetencies,
    filteredWeaponArmorCatalog,
    filteredToolCatalog,
    onLanguagesTextChange,
    onAlignmentChange,
    onPersonalHistoryChange,
    onRemoveWeaponArmorCompetency,
    onRemoveToolCompetency,
    onAddWeaponArmorCompetency,
    onAddToolCompetency,
    onWeaponArmorSearchChange,
    onToolSearchChange,
    onWeaponArmorFilterChange,
    onToolFilterChange,
    weaponArmorSearch,
    toolSearch,
    weaponArmorFilter,
    toolFilter,
  } = props;

  return (
    <div className="mt-5 space-y-6">
      <div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
        <h3 className="text-lg font-bold text-white">Idiomas que hablas</h3>
        {isEditMode ? (
          <textarea
            value={editableLanguagesText ?? languages.join(", ")}
            onChange={(event) => onLanguagesTextChange?.(event.target.value)}
            rows={4}
            className="mt-3 w-full rounded-[16px] border border-white/10 bg-black/35 px-4 py-3 text-sm leading-6 text-stone-100 outline-none"
          />
        ) : languages.length > 0 ? (
          <p className="mt-3 text-sm leading-6 text-stone-200">
            {languages.join(", ")}
          </p>
        ) : (
          <EmptyRowsMessage message="No hay idiomas registrados para este personaje." />
        )}
      </div>

      <div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
        <h3 className="text-lg font-bold text-white">Alineamiento</h3>
        {isEditMode ? (
          <select
            value={editableAlignment ?? ""}
            onChange={(event) => onAlignmentChange?.(event.target.value)}
            className="mt-3 w-full rounded-[16px] border border-white/10 bg-black/35 px-4 py-3 text-sm text-stone-100 outline-none"
          >
            <option value="">Sin alineamiento</option>
            {[
              "Legal bueno",
              "Neutral bueno",
              "Caótico bueno",
              "Legal neutral",
              "Neutral",
              "Caótico neutral",
              "Legal malvado",
              "Neutral malvado",
              "Caótico malvado",
            ].map((alignment) => (
              <option key={alignment} value={alignment}>
                {alignment}
              </option>
            ))}
          </select>
        ) : (
          <p className="mt-3 text-sm leading-6 text-stone-200">
            {biographySections.alignment ?? "No indicado"}
          </p>
        )}
      </div>

      <CompetencyPanel
        title="Competencias con armas y armaduras"
        items={editableWeaponArmorCompetencies}
        isEditMode={isEditMode}
        buttonLabel="Añadir nueva competencia"
        emptyMessage="No hay competencias con armas o armaduras registradas para este personaje."
        renderItem={(competency) => (
          <CompetencyChip
            key={`weapon-armor-${competency}`}
            label={competency}
            onRemove={
              isEditMode
                ? () => onRemoveWeaponArmorCompetency?.(competency)
                : undefined
            }
          />
        )}
        renderPanel={() => (
          <div className="rounded-[18px] border border-white/10 bg-black/25 p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
              <input
                type="text"
                value={weaponArmorSearch}
                onChange={(event) =>
                  onWeaponArmorSearchChange(event.target.value)
                }
                placeholder="Buscar por nombre"
                className="rounded-[14px] border border-white/10 bg-black/35 px-4 py-3 text-sm text-stone-100 outline-none"
              />
              <select
                value={weaponArmorFilter}
                onChange={(event) =>
                  onWeaponArmorFilterChange(
                    event.target.value as "all" | "weapon" | "armor",
                  )
                }
                className="rounded-[14px] border border-white/10 bg-black/35 px-4 py-3 text-sm text-stone-100 outline-none"
              >
                <option value="all">Todas</option>
                <option value="weapon">Armas</option>
                <option value="armor">Armaduras y escudos</option>
              </select>
            </div>
            <div className="mt-3 max-h-52 overflow-y-auto space-y-2 pr-1">
              {filteredWeaponArmorCatalog.length > 0 ? (
                filteredWeaponArmorCatalog.map((competency) => (
                  <button
                    key={`add-weapon-armor-${competency}`}
                    type="button"
                    onClick={() => onAddWeaponArmorCompetency?.(competency)}
                    className="flex w-full items-center justify-between rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-stone-100 transition hover:border-amber-300/30 hover:bg-white/10"
                  >
                    <span>{competency}</span>
                    <span className="text-amber-100">+</span>
                  </button>
                ))
              ) : (
                <EmptyRowsMessage message="No hay competencias disponibles con ese filtro." />
              )}
            </div>
          </div>
        )}
      />

      <CompetencyPanel
        title="Competencias con herramientas"
        items={editableToolCompetencies}
        isEditMode={isEditMode}
        buttonLabel="Añadir nueva competencia"
        emptyMessage="No hay competencias con herramientas registradas para este personaje."
        renderItem={(competency) => (
          <CompetencyChip
            key={`tool-${competency}`}
            label={competency}
            onRemove={
              isEditMode
                ? () => onRemoveToolCompetency?.(competency)
                : undefined
            }
          />
        )}
        renderPanel={() => (
          <div className="rounded-[18px] border border-white/10 bg-black/25 p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
              <input
                type="text"
                value={toolSearch}
                onChange={(event) => onToolSearchChange(event.target.value)}
                placeholder="Buscar por nombre"
                className="rounded-[14px] border border-white/10 bg-black/35 px-4 py-3 text-sm text-stone-100 outline-none"
              />
              <select
                value={toolFilter}
                onChange={(event) =>
                  onToolFilterChange(
                    event.target.value as
                      | "all"
                      | "instrumentos"
                      | "juegos"
                      | "otros",
                  )
                }
                className="rounded-[14px] border border-white/10 bg-black/35 px-4 py-3 text-sm text-stone-100 outline-none"
              >
                <option value="all">Todas</option>
                <option value="instrumentos">Instrumentos</option>
                <option value="juegos">Juegos</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            <div className="mt-3 max-h-52 overflow-y-auto space-y-2 pr-1">
              {filteredToolCatalog.length > 0 ? (
                filteredToolCatalog.map((competency) => (
                  <button
                    key={`add-tool-${competency.name}`}
                    type="button"
                    onClick={() => onAddToolCompetency?.(competency.name)}
                    className="flex w-full items-center justify-between rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-stone-100 transition hover:border-amber-300/30 hover:bg-white/10"
                  >
                    <span>{competency.name}</span>
                    <span className="text-xs uppercase tracking-[0.14em] text-stone-400">
                      {competency.category}
                    </span>
                  </button>
                ))
              ) : (
                <EmptyRowsMessage message="No hay competencias disponibles con ese filtro." />
              )}
            </div>
          </div>
        )}
      />

      <div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
        <h3 className="text-lg font-bold text-white">Historia personal</h3>
        {isEditMode ? (
          <textarea
            value={editablePersonalHistory ?? ""}
            onChange={(event) => onPersonalHistoryChange?.(event.target.value)}
            rows={8}
            className="mt-3 w-full rounded-[16px] border border-white/10 bg-black/35 px-4 py-3 text-sm leading-7 text-stone-100 outline-none"
          />
        ) : (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-200">
            {biographySections.personalHistory ??
              "No hay historia personal registrada."}
          </p>
        )}
      </div>
    </div>
  );
}
