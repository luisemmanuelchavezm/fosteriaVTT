interface ExpertisePicklistSectionProps {
  anchorId?: string;
  title: string;
  description: string;
  options: string[];
  selectedValues: string[];
  selectionCount: number;
  error?: string;
  onChange: (values: string[]) => void;
}

export default function ExpertisePicklistSection({
  anchorId,
  title,
  description,
  options,
  selectedValues,
  selectionCount,
  error,
  onChange,
}: ExpertisePicklistSectionProps) {
  const handleSelectionChange = (index: number, value: string) => {
    const nextValues = Array.from(
      { length: selectionCount },
      (_, currentIndex) => selectedValues[currentIndex] ?? "",
    );
    nextValues[index] = value;
    onChange(nextValues);
  };

  return (
    <div id={anchorId} data-validation-error={error ? "true" : undefined}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-stone-300">{description}</p>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-amber-200/70">
          {selectedValues.filter((value) => value.trim().length > 0).length}/
          {selectionCount}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {Array.from({ length: selectionCount }, (_, index) => {
          const currentValue = selectedValues[index] ?? "";
          const availableOptions = options.filter(
            (option) =>
              option === currentValue ||
              !selectedValues.some(
                (selectedValue, selectedIndex) =>
                  selectedIndex !== index && selectedValue === option,
              ),
          );

          return (
            <label
              key={`${anchorId ?? title}-${index}`}
              className="flex flex-col gap-2 rounded-[18px] border border-stone-300/10 bg-black/20 p-4"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                Pericia {index + 1}
              </span>
              <select
                value={currentValue}
                onChange={(event) =>
                  handleSelectionChange(index, event.target.value)
                }
                disabled={availableOptions.length === 0}
                className="rounded-full border border-stone-300/15 bg-stone-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/45 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {availableOptions.length === 0
                    ? "Selecciona antes las competencias"
                    : "Selecciona una pericia"}
                </option>
                {availableOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>

      {error ? (
        <p className="mt-3 text-sm font-medium text-rose-200">{error}</p>
      ) : null}
    </div>
  );
}
