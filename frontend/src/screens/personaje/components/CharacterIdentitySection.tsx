import { ImagePlus, Shield } from "lucide-react";
import type { RefObject } from "react";

interface CharacterIdentitySectionProps {
  name: string;
  portraitPreview: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onNameChange: (value: string) => void;
  onPortraitSelection: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFilePicker: () => void;
}

export default function CharacterIdentitySection({
  name,
  portraitPreview,
  fileInputRef,
  onNameChange,
  onPortraitSelection,
  onOpenFilePicker,
}: CharacterIdentitySectionProps) {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-100/85">
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
          className="mt-3 flex min-h-[210px] w-full flex-col items-center justify-center overflow-hidden rounded-[28px] border border-dashed border-stone-300/20 bg-[linear-gradient(180deg,rgba(28,25,23,0.65),rgba(12,10,9,0.3))] text-center transition hover:border-amber-300/40 hover:bg-stone-950/55"
        >
          {portraitPreview ? (
            <img
              src={portraitPreview}
              alt="Vista previa del personaje"
              className="h-[210px] w-full object-cover"
            />
          ) : (
            <>
              <ImagePlus className="h-10 w-10 text-amber-100" />
              <span className="mt-3 px-4 text-sm font-semibold text-white">
                Arrastra una imagen o pulsa para subirla
              </span>
              <span className="mt-2 text-xs text-stone-300/80">
                Retrato del aventurero
              </span>
            </>
          )}
        </button>
      </div>

      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-100/85">
          <Shield className="h-4 w-4" />
          Nombre
        </p>
        <input
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Escribe el nombre del personaje"
          className="mt-3 h-14 w-full rounded-[20px] border border-stone-300/15 bg-black/30 px-5 text-base text-white outline-none transition placeholder:text-stone-400 focus:border-amber-300/50"
        />
      </div>
    </div>
  );
}
