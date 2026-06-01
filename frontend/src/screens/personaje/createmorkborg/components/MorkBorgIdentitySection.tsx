import { ImagePlus, Shield } from "lucide-react";
import type { RefObject } from "react";

interface MorkBorgIdentitySectionProps {
  name: string;
  portraitPreview: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  portraitError?: string;
  nameError?: string;
  onNameChange: (value: string) => void;
  onPortraitSelection: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFilePicker: () => void;
}

export default function MorkBorgIdentitySection({
  name,
  portraitPreview,
  fileInputRef,
  portraitError,
  nameError,
  onNameChange,
  onPortraitSelection,
  onOpenFilePicker,
}: MorkBorgIdentitySectionProps) {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      {/* Retrato */}
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-300/80">
          <ImagePlus className="h-4 w-4" />
          Retrato
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onPortraitSelection}
          className="hidden"
        />
        <button
          type="button"
          onClick={onOpenFilePicker}
          data-validation-error={portraitError ? "true" : undefined}
          className={`mt-3 flex min-h-[210px] w-full flex-col items-center justify-center overflow-hidden rounded-[28px] border border-dashed transition ${
            portraitError
              ? "border-rose-400/60 bg-rose-950/20 ring-2 ring-rose-400/30"
              : "border-stone-300/20 bg-stone-900/40 hover:border-amber-300/30 hover:bg-stone-900/60"
          }`}
        >
          {portraitPreview ? (
            <img
              src={portraitPreview}
              alt="Vista previa del personaje"
              className="h-[210px] w-full object-cover"
            />
          ) : (
            <>
              <ImagePlus className="h-10 w-10 text-stone-500" />
              <span className="mt-3 px-4 text-sm font-semibold text-stone-400">
                Arrastra una imagen o pulsa para subirla
              </span>
              <span className="mt-2 text-xs text-stone-500">
                Retrato del personaje
              </span>
            </>
          )}
        </button>
        {portraitError ? (
          <p className="mt-2 rounded-md border border-rose-400/50 bg-rose-950/20 px-3 py-1 text-xs font-semibold text-rose-300">
            {portraitError}
          </p>
        ) : null}
      </div>

      {/* Nombre */}
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-300/80">
          <Shield className="h-4 w-4" />
          Nombre
        </p>
        <input
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Escribe el nombre del personaje"
          data-validation-error={nameError ? "true" : undefined}
          className={`mt-3 h-14 w-full rounded-[20px] border bg-stone-900/60 px-5 text-base text-white outline-none transition placeholder:text-stone-500 ${
            nameError
              ? "border-rose-400/60 ring-2 ring-rose-400/30 focus:border-rose-400"
              : "border-stone-300/20 focus:border-amber-300/50 focus:bg-stone-900/80"
          }`}
        />
        {nameError ? (
          <p className="mt-2 rounded-md border border-rose-400/50 bg-rose-950/20 px-3 py-1 text-xs font-semibold text-rose-300">
            {nameError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
