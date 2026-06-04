import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { subirMapaAdmin } from "../lib/adminApi";

interface AdminMapUploadModalProps {
  token: string;
  onClose: () => void;
  onUploaded: () => void;
}

export default function AdminMapUploadModal({
  token,
  onClose,
  onUploaded,
}: AdminMapUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nombre, setNombre] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    nombre?: string;
    file?: string;
  }>({});

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;
    setFile(selected);
    setFieldErrors((fe) => ({ ...fe, file: undefined }));
    const reader = new FileReader();
    reader.onload = (ev) => setPreview((ev.target?.result as string) ?? null);
    reader.readAsDataURL(selected);
  }

  async function handleSubmit() {
    const errs: { nombre?: string; file?: string } = {};
    if (!nombre.trim()) errs.nombre = "El nombre es obligatorio.";
    if (!file) errs.file = "La imagen es obligatoria.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await subirMapaAdmin(token, nombre.trim(), file!);
      onUploaded();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el mapa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl border border-white/20 bg-zinc-900 p-6 shadow-2xl flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/70">
            Admin — Sistema
          </p>
          <h3 className="mt-1 text-lg font-bold text-white">
            Subir mapa al marketplace
          </h3>
        </div>

        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-white/80">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setFieldErrors((fe) => ({ ...fe, nombre: undefined }));
            }}
            placeholder="Nombre del mapa"
            className={`h-10 w-full rounded-xl border bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400/60 ${fieldErrors.nombre ? "border-rose-500/70" : "border-white/20"}`}
          />
          {fieldErrors.nombre && (
            <p className="text-xs text-rose-400">{fieldErrors.nombre}</p>
          )}
        </div>

        {/* Imagen */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-white/80">
            Imagen del mapa
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${fieldErrors.file ? "border-rose-500/70 bg-rose-500/5" : "border-white/20 bg-black/20 hover:border-emerald-400/40"}`}
          >
            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/30">
                <ImagePlus size={28} />
                <span className="text-xs">Seleccionar imagen</span>
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {fieldErrors.file && (
            <p className="text-xs text-rose-400">{fieldErrors.file}</p>
          )}
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-emerald-700/80 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Subiendo..." : "Subir mapa"}
          </button>
        </div>
      </div>
    </div>
  );
}
