import type { DndProgressionTable } from "../types";
import {
  extractSpellReferenceItems,
  isSpellReferenceColumn,
} from "../../../../components/spells/spellReferenceUtils";

interface ProgressionTablesBlockProps {
  tables: DndProgressionTable[];
  title?: string;
  onSpellReferenceClick?: (spellName: string) => void;
}

export default function ProgressionTablesBlock({
  tables,
  title = "Tablas de progresion",
  onSpellReferenceClick,
}: ProgressionTablesBlockProps) {
  if (tables.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 rounded-[22px] border border-stone-300/10 bg-black/25 p-4">
      <h4 className="text-base font-semibold text-amber-100">{title}</h4>

      <div className="mt-4 space-y-4">
        {tables.map((table) => (
          <section
            key={table.titulo}
            className="overflow-hidden rounded-2xl border border-stone-200/10 bg-stone-950/70"
          >
            <div className="border-b border-stone-200/10 px-4 py-3">
              <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">
                {table.titulo}
              </h5>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm text-stone-100/90">
                <thead>
                  <tr className="bg-white/5 text-left text-xs uppercase tracking-[0.16em] text-stone-300">
                    {table.columnas.map((column) => (
                      <th key={column} className="px-4 py-3 font-semibold">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.filas.map((row, rowIndex) => (
                    <tr
                      key={`${table.titulo}-${rowIndex}`}
                      className="border-t border-stone-200/10 align-top"
                    >
                      {row.map((cell, cellIndex) => {
                        const spellReferences = isSpellReferenceColumn(
                          table.columnas[cellIndex],
                        )
                          ? extractSpellReferenceItems(cell)
                          : [];

                        return (
                          <td
                            key={`${table.titulo}-${rowIndex}-${cellIndex}`}
                            className="px-4 py-3 leading-6"
                          >
                            {spellReferences.length > 0 &&
                            onSpellReferenceClick ? (
                              <div className="flex flex-wrap gap-2">
                                {spellReferences.map((reference) => (
                                  <button
                                    key={`${table.titulo}-${rowIndex}-${cellIndex}-${reference.lookupName}`}
                                    type="button"
                                    onClick={() =>
                                      onSpellReferenceClick(
                                        reference.lookupName,
                                      )
                                    }
                                    className="rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-left text-xs font-semibold text-sky-100 transition hover:border-sky-200/50 hover:bg-sky-400/20"
                                  >
                                    {reference.displayText}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              cell
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
