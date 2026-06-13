import type {
  MBAyudaDmColumna,
  MBAyudaDmGrupo,
  MBAyudaDmTabla,
} from "../../../personaje/utils/mbApi";

type DmHelpTableItem = {
  roll: number;
  label: string;
  etiqueta?: string;
};

export const DM_HELP_TABLE_STYLE = {
  backgroundColor: "#171717",
  backgroundImage:
    "linear-gradient(45deg, rgba(166,166,166,0.12) 25%, transparent 25%, transparent 75%, rgba(166,166,166,0.12) 75%, rgba(166,166,166,0.12)), linear-gradient(45deg, rgba(75,75,75,0.2) 25%, transparent 25%, transparent 75%, rgba(75,75,75,0.2) 75%, rgba(75,75,75,0.2))",
  backgroundPosition: "0 0, 12px 12px",
  backgroundSize: "24px 24px",
};

export function getDmHelpDiceLabel(expression: string) {
  return expression.replace(/^1(?=d)/i, "");
}

export function getDmHelpDiceMax(expression: string) {
  const match = expression.match(/^(\d+)d(\d+)$/i);
  if (!match) return 20;
  return Number.parseInt(match[2], 10);
}

function buildDmHelpTableItems(
  items: readonly string[],
  etiquetas?: readonly string[],
): DmHelpTableItem[] {
  return items.map((label, index) => ({
    roll: index + 1,
    label,
    etiqueta: etiquetas?.[index],
  }));
}

function buildTwoColumnRows(items: readonly DmHelpTableItem[]) {
  const rows: DmHelpTableItem[][] = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }
  return rows;
}

export function matchesD66Etiqueta(
  etiqueta: string | undefined,
  d66result: number | null,
): boolean {
  if (!etiqueta || d66result === null) return false;
  if (etiqueta.includes("-")) {
    const parts = etiqueta.split("-");
    return d66result >= Number(parts[0]) && d66result <= Number(parts[1]);
  }
  if (etiqueta.includes(":")) {
    const parts = etiqueta.split(":");
    return d66result === Number(parts[0]) * 10 + Number(parts[1]);
  }
  return Number(etiqueta) === d66result;
}

export function renderEntryText(text: string, className: string) {
  const lines = text.split("\n");
  const hasSpecial = lines.some((l) => l.startsWith("*"));
  if (!hasSpecial) {
    return <span className={`whitespace-pre-line ${className}`}>{text}</span>;
  }
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={`${i}-${line.slice(0, 6)}`}>
          {i > 0 && <br />}
          {line.startsWith("**") ? (
            <strong className="font-bold text-amber-200">
              {line.slice(2)}
            </strong>
          ) : line.startsWith("*") ? (
            <em className="text-stone-300/70">{line.slice(1)}</em>
          ) : (
            line
          )}
        </span>
      ))}
    </span>
  );
}

export function renderDmHelpTable(
  items: readonly string[],
  selectedRoll: number | null,
  options?: {
    scrollable?: boolean;
    textClassName?: string;
    etiquetas?: readonly string[];
    isD66?: boolean;
  },
) {
  const rows = buildTwoColumnRows(
    buildDmHelpTableItems(items, options?.etiquetas),
  );

  return (
    <div
      className={[
        "rounded-[18px] border border-white/10 text-stone-100 shadow-[0_18px_45px_rgba(0,0,0,0.25)]",
        options?.scrollable
          ? "max-h-[420px] overflow-y-auto"
          : "overflow-hidden",
      ].join(" ")}
      style={DM_HELP_TABLE_STYLE}
    >
      {rows.map((rowPair, index) => (
        <div
          key={rowPair.map((item) => item.roll).join("-")}
          className={`grid grid-cols-2 gap-0 ${index < rows.length - 1 ? "border-b border-white/10" : ""}`}
        >
          {rowPair.map((item, pairIndex) => {
            const isSelected = options?.isD66
              ? matchesD66Etiqueta(item.etiqueta, selectedRoll)
              : selectedRoll === item.roll;

            return (
              <div
                key={item.roll}
                className={[
                  "px-4 py-3 text-sm transition-colors duration-300",
                  pairIndex === 0 ? "border-r border-white/10" : "",
                  isSelected ? "animate-pulse bg-red-900/80" : "bg-black/35",
                ].join(" ")}
              >
                <span
                  className={`font-bold ${isSelected ? "text-red-100" : "text-amber-200"}`}
                >
                  {item.etiqueta ?? `${item.roll}.`}
                </span>{" "}
                {renderEntryText(
                  item.label,
                  [
                    options?.textClassName ?? "",
                    isSelected ? "text-red-50" : "text-stone-100",
                  ].join(" "),
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const TWO_COL_HEADER_STYLES = [
  "border-b border-amber-700/40 bg-amber-700/55 text-amber-50",
  "border-b border-rose-700/40 bg-rose-700/55 text-rose-50",
] as const;

export function renderDmHelpTableGrouped(
  grupos: readonly MBAyudaDmGrupo[],
  selectedD66Roll: number | null,
) {
  return (
    <div
      className="overflow-hidden rounded-[18px] border border-white/10 text-stone-100 shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
      style={DM_HELP_TABLE_STYLE}
    >
      {grupos.map((grupo) => {
        const items = grupo.entradas.map((label, index) => ({
          roll: index + 1,
          label,
          etiqueta: grupo.etiquetas?.[index],
        }));
        const rows = buildTwoColumnRows(items);
        return (
          <div key={grupo.titulo}>
            <div className="border-b border-amber-700/40 bg-amber-700/55 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-50">
              {grupo.titulo}
            </div>
            {rows.map((rowPair, rowIndex) => (
              <div
                key={`${grupo.titulo}-${rowPair.map((i) => i.roll).join("-")}`}
                className={`grid grid-cols-2 gap-0 ${rowIndex < rows.length - 1 ? "border-b border-white/10" : ""}`}
              >
                {rowPair.map((item, pairIndex) => {
                  const isSelected = matchesD66Etiqueta(
                    item.etiqueta,
                    selectedD66Roll,
                  );
                  const isAlone = rowPair.length === 1;
                  return (
                    <div
                      key={item.roll}
                      className={[
                        "px-4 py-3 text-sm transition-colors duration-300",
                        isAlone
                          ? "col-span-2"
                          : pairIndex === 0
                            ? "border-r border-white/10"
                            : "",
                        isSelected
                          ? "animate-pulse bg-red-900/80"
                          : "bg-black/35",
                      ].join(" ")}
                    >
                      <span
                        className={`font-bold ${isSelected ? "text-red-100" : "text-amber-200"}`}
                      >
                        {item.etiqueta ?? `${item.roll}.`}
                      </span>{" "}
                      {renderEntryText(
                        item.label,
                        `leading-6 ${isSelected ? "text-red-50" : "text-stone-100"}`,
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function renderDmHelpTwoColumn(columnas: readonly MBAyudaDmColumna[]) {
  const isSingle = columnas.length === 1;
  return (
    <div
      className="overflow-hidden rounded-[18px] border border-white/10 text-stone-100 shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
      style={DM_HELP_TABLE_STYLE}
    >
      <div className={`grid ${isSingle ? "grid-cols-1" : "grid-cols-2"}`}>
        {columnas.map((col, idx) => (
          <div
            key={`h-${col.titulo}`}
            className={[
              "px-4 py-2.5 text-sm font-bold uppercase tracking-[0.16em]",
              TWO_COL_HEADER_STYLES[idx] ?? TWO_COL_HEADER_STYLES[0],
              !isSingle && idx === 0 ? "border-r border-amber-700/40" : "",
            ].join(" ")}
          >
            {col.titulo}
          </div>
        ))}
      </div>
      <div
        className={`grid ${isSingle ? "grid-cols-1" : "grid-cols-2 divide-x divide-white/10"}`}
      >
        {columnas.map((col) => (
          <div
            key={`c-${col.titulo}`}
            className="flex flex-col bg-black/35 px-4 py-4"
          >
            {col.bloques && col.bloques.length > 0 ? (
              <div className="space-y-0">
                {col.bloques.map((bloque, bIdx) => (
                  <div
                    key={bloque.titulo}
                    className={
                      bIdx > 0 ? "border-t border-white/10 pt-3 mt-3" : ""
                    }
                  >
                    {bIdx > 0 ? (
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80">
                        {bloque.titulo}
                      </p>
                    ) : null}
                    {bloque.descripcion ? (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-stone-300">
                        {bloque.descripcion}
                      </p>
                    ) : null}
                    {bloque.lista ? (
                      <ul className="mt-2 space-y-1.5">
                        {bloque.lista.map((entry: string) => {
                          const m = entry.match(/^(\d+)\.\s+([\s\S]*)/);
                          return (
                            <li key={entry} className="flex gap-1.5 text-sm">
                              <span className="shrink-0 font-bold text-amber-300">
                                {m ? `${m[1]}.` : "•"}
                              </span>
                              <span className="text-stone-100 leading-snug">
                                {m ? m[2] : entry}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <>
                {col.descripcion ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-stone-300">
                    {col.descripcion}
                  </p>
                ) : null}
                {col.lista ? (
                  <ul className="mt-3 space-y-2">
                    {col.lista.map((entry: string) => {
                      const m = entry.match(/^(\d+(?:-\d+)?)\s+(.*)/);
                      if (m) {
                        return (
                          <li
                            key={entry}
                            className="flex items-baseline gap-2 text-sm"
                          >
                            <span className="shrink-0 font-bold text-amber-300">
                              {m[1]}
                            </span>
                            <span className="text-stone-100">{m[2]}</span>
                          </li>
                        );
                      }
                      return (
                        <li
                          key={entry}
                          className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-2.5 text-sm font-semibold text-amber-50"
                        >
                          {entry}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderSingleTabla(tabla: MBAyudaDmTabla) {
  const gridCols = tabla.anchos
    ? tabla.anchos.map((a) => `${a}fr`).join(" ")
    : `repeat(${tabla.encabezados.length}, minmax(0, 1fr))`;
  return (
    <div
      className="overflow-hidden rounded-[18px] border border-white/10 text-stone-100 shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
      style={DM_HELP_TABLE_STYLE}
    >
      <div className="border-b border-amber-700/40 bg-amber-700/55 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-50">
        {tabla.titulo}
      </div>
      <div
        className="grid border-b border-white/10 bg-white/[0.04]"
        style={{ gridTemplateColumns: gridCols }}
      >
        {tabla.encabezados.map((enc, i) => (
          <div
            key={enc}
            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400/90 ${i > 0 ? "border-l border-white/10" : ""}`}
          >
            {enc}
          </div>
        ))}
      </div>
      {tabla.filas.map((fila, rowIdx) => (
        <div
          key={rowIdx}
          className={`grid bg-black/35 ${rowIdx < tabla.filas.length - 1 ? "border-b border-white/10" : ""}`}
          style={{ gridTemplateColumns: gridCols }}
        >
          {fila.map((celda, colIdx) => (
            <div
              key={colIdx}
              className={`px-3 py-2 text-sm leading-snug text-stone-100 ${colIdx > 0 ? "border-l border-white/10" : ""}`}
            >
              {celda}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function renderDmHelpTablas(
  tablas: readonly MBAyudaDmTabla[],
  layout?: string,
) {
  if (tablas.length === 0) return null;
  if (tablas.length === 1) return renderSingleTabla(tablas[0]);

  if (layout === "primera-izq-resto-der") {
    const [primera, ...resto] = tablas;
    return (
      <div className="grid grid-cols-2 items-start gap-3">
        <div>{renderSingleTabla(primera)}</div>
        <div className="space-y-3">
          {resto.map((tabla) => (
            <div key={tabla.titulo}>{renderSingleTabla(tabla)}</div>
          ))}
        </div>
      </div>
    );
  }

  if (tablas.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {tablas.map((tabla) => (
          <div key={tabla.titulo}>{renderSingleTabla(tabla)}</div>
        ))}
      </div>
    );
  }

  const [primera, ...resto] = tablas;
  return (
    <div className="space-y-3">
      {renderSingleTabla(primera)}
      <div className="grid grid-cols-2 gap-3">
        {resto.map((tabla) => (
          <div key={tabla.titulo}>{renderSingleTabla(tabla)}</div>
        ))}
      </div>
    </div>
  );
}
