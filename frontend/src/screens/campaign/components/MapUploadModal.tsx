import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

interface MapUploadModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    file: File;
    nombre: string;
    esPublico: boolean;
    tags: string[];
  }) => Promise<void>;
}

export default function MapUploadModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: MapUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mapName, setMapName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const previewUrl = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) {
    return null;
  }

  const handlePickFile = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Debes seleccionar una imagen para el mapa.");
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleAddTag = () => {
    const normalizedTag = tagInput.trim();

    if (!normalizedTag) {
      return;
    }

    if (normalizedTag.length > 20) {
      setErrorMessage("Cada tag puede tener maximo 20 caracteres.");
      return;
    }

    if (tags.length >= 3) {
      setErrorMessage("Solo puedes agregar hasta 3 tags.");
      return;
    }

    if (tags.some((tag) => tag.toLowerCase() === normalizedTag.toLowerCase())) {
      setErrorMessage("Ese tag ya existe.");
      return;
    }

    setTags((current) => [...current, normalizedTag]);
    setTagInput("");
    setErrorMessage(null);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((current) => current.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setErrorMessage("Debes subir una imagen para el mapa.");
      return;
    }

    const normalizedName = mapName.trim();
    if (!normalizedName) {
      setErrorMessage("Debes escribir el nombre del mapa.");
      return;
    }

    if (normalizedName.length > 100) {
      setErrorMessage("El nombre del mapa no puede superar 100 caracteres.");
      return;
    }

    if (isPublic && tags.some((tag) => tag.length > 20)) {
      setErrorMessage("Cada tag puede tener maximo 20 caracteres.");
      return;
    }

    try {
      setErrorMessage(null);
      await onSubmit({
        file: selectedFile,
        nombre: normalizedName,
        esPublico: isPublic,
        tags: isPublic ? tags : [],
      });

      setSelectedFile(null);
      setMapName("");
      setIsPublic(false);
      setTagInput("");
      setTags([]);
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo subir el mapa. Intentalo de nuevo.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-zinc-950 p-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="m-0 text-lg font-extrabold">Subir mapa</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/5 transition hover:bg-white/12"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handlePickFile(event.target.files?.[0] ?? null)}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handlePickFile(event.dataTransfer.files?.[0] ?? null);
          }}
          className={`mb-4 flex min-h-[180px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed px-3 py-4 transition ${
            isDragging
              ? "border-amber-300/80 bg-amber-200/10"
              : "border-white/25 bg-black/25 hover:bg-black/35"
          }`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Vista previa del mapa"
              className="max-h-[220px] w-full object-cover"
            />
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-amber-100" />
              <span className="mt-2 text-sm font-semibold">
                Arrastra una imagen o pulsa para subirla
              </span>
            </>
          )}
        </button>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-semibold text-white/85">
            Nombre
          </label>
          <input
            value={mapName}
            onChange={(event) => setMapName(event.target.value)}
            placeholder="Nombre del mapa"
            className="h-10 w-full rounded-lg border border-white/22 bg-black/35 px-2.5 text-sm text-white outline-none transition placeholder:text-white/65 focus:border-white/40"
          />
        </div>

        <div className="mb-3 flex items-center justify-between rounded-lg border border-white/14 bg-black/20 px-3 py-2">
          <span className="text-sm font-semibold">Público</span>
          <button
            type="button"
            onClick={() => setIsPublic((current) => !current)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
              isPublic
                ? "border-amber-300/70 bg-amber-400/35"
                : "border-white/30 bg-white/15"
            }`}
            aria-label="Alternar público"
            aria-pressed={isPublic}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                isPublic ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {isPublic ? (
          <div className="mb-3 rounded-lg border border-white/14 bg-black/20 p-3">
            <label className="mb-1 block text-xs font-semibold text-white/85">
              Tags (maximo 3, 20 caracteres cada uno)
            </label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                placeholder="Escribe un tag"
                maxLength={20}
                className="h-9 flex-1 rounded-lg border border-white/22 bg-black/35 px-2.5 text-sm text-white outline-none transition placeholder:text-white/65 focus:border-white/40"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={tags.length >= 3}
                className="h-9 rounded-lg border border-white/22 bg-white/10 px-3 text-xs font-bold text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anadir tag
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="rounded-full border border-amber-300/50 bg-amber-200/12 px-2.5 py-1 text-xs font-semibold text-amber-100 transition hover:bg-amber-200/18"
                  title="Quitar tag"
                >
                  {tag} x
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="mb-3 rounded-lg border border-red-300/45 bg-red-900/30 px-2.5 py-2 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-white/22 bg-white/8 px-3.5 text-xs font-bold text-white transition hover:bg-white/12"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={isSubmitting}
            className="h-9 rounded-lg border border-amber-300/40 bg-amber-200/10 px-3.5 text-xs font-bold text-amber-100 transition hover:bg-amber-200/16 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSubmitting ? "Subiendo..." : "Subir mapa"}
          </button>
        </div>
      </div>
    </div>
  );
}
