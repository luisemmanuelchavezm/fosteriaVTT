import ValidationMessage from "./ValidationMessage";

interface ChoiceChecklistProps {
  title: string;
  description?: string;
  anchorId?: string;
  options: string[];
  selectedValues: string[];
  maxSelections: number;
  error?: string;
  onInfoClick?: (option: string) => void;
  showInfoAction?: boolean;
  onChange: (values: string[]) => void;
}

export default function ChoiceChecklist({
  title,
  description,
  anchorId,
  options,
  selectedValues,
  maxSelections,
  error,
  onInfoClick,
  showInfoAction = false,
  onChange,
}: ChoiceChecklistProps) {
  const toggleValue = (option: string) => {
    const isSelected = selectedValues.includes(option);

    if (isSelected) {
      onChange(selectedValues.filter((value) => value !== option));
      return;
    }

    if (selectedValues.length >= maxSelections) {
      return;
    }

    onChange([...selectedValues, option]);
  };

  return (
    <div id={anchorId} data-validation-error={error ? "true" : undefined}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-stone-300">
              {description}
            </p>
          ) : null}
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-amber-200/70">
          {selectedValues.length}/{maxSelections}
        </p>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option);
          const isDisabled =
            !isSelected && selectedValues.length >= maxSelections;

          if (showInfoAction && onInfoClick) {
            return (
              <div
                key={option}
                className={`flex items-center gap-3 rounded-[18px] border px-4 py-3 text-left text-sm transition ${
                  isSelected
                    ? "border-amber-300/60 bg-amber-300/10 text-amber-50"
                    : isDisabled
                      ? "border-stone-300/10 bg-black/15 text-stone-500"
                      : "border-stone-300/10 bg-black/20 text-stone-200 hover:border-amber-300/30 hover:bg-stone-950/55"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleValue(option)}
                  disabled={isDisabled}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                      isSelected
                        ? "border-amber-300 bg-amber-300 text-stone-950"
                        : "border-stone-400/50 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="min-w-0 flex-1 font-medium">{option}</span>
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onInfoClick(option);
                  }}
                  className="shrink-0 rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100 transition hover:border-sky-200/50 hover:bg-sky-400/20"
                >
                  Info+
                </button>
              </div>
            );
          }

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleValue(option)}
              disabled={isDisabled}
              className={`flex items-center gap-3 rounded-[18px] border px-4 py-3 text-left text-sm transition ${
                isSelected
                  ? "border-amber-300/60 bg-amber-300/10 text-amber-50"
                  : isDisabled
                    ? "border-stone-300/10 bg-black/15 text-stone-500"
                    : "border-stone-300/10 bg-black/20 text-stone-200 hover:border-amber-300/30 hover:bg-stone-950/55"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                  isSelected
                    ? "border-amber-300 bg-amber-300 text-stone-950"
                    : "border-stone-400/50 text-transparent"
                }`}
              >
                ✓
              </span>
              <span className="min-w-0 flex-1">{option}</span>
              {showInfoAction && onInfoClick ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onInfoClick(option);
                  }}
                  className="shrink-0 rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100 transition hover:border-sky-200/50 hover:bg-sky-400/20"
                >
                  Info+
                </button>
              ) : null}
            </button>
          );
        })}
      </div>

      {error ? <ValidationMessage message={error} className="mt-3" /> : null}
    </div>
  );
}
