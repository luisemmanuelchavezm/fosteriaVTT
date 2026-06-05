import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Camera, Loader2, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { buildApiUrl } from "../lib/api";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  currentAvatarUrl: string;
  onSuccess: (username: string, avatar: string) => void;
  onAccountDeleted: () => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  currentUsername,
  currentAvatarUrl,
  onSuccess,
  onAccountDeleted,
}: EditProfileModalProps) {
  // Original values (to detect actual changes)
  const [originalUsername, setOriginalUsername] = useState(currentUsername);
  const [originalEmail, setOriginalEmail] = useState("");

  // Form data
  const [username, setUsername] = useState(currentUsername);
  const [usernameEditable, setUsernameEditable] = useState(false);
  const [email, setEmail] = useState("");
  const [emailEditable, setEmailEditable] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(currentAvatarUrl);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalMessage, setGlobalMessage] = useState("");
  const [isSuccessMsg, setIsSuccessMsg] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  // Save confirmation overlay
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");

  // Delete view
  const [view, setView] = useState<"edit" | "delete">("edit");
  const [deleteText, setDeleteText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current user data when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem("jwtToken");
    fetch(buildApiUrl("/api/users/me"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const fetchedUsername = data.username ?? currentUsername;
        const fetchedEmail = data.email ?? "";
        setUsername(fetchedUsername);
        setOriginalUsername(fetchedUsername);
        setEmail(fetchedEmail);
        setOriginalEmail(fetchedEmail);
        setAvatarPreview(data.avatar || currentAvatarUrl);
      })
      .catch(() => {});
  }, [isOpen, currentUsername, currentAvatarUrl]);

  // Reset everything on close
  useEffect(() => {
    if (!isOpen) {
      setView("edit");
      setUsernameEditable(false);
      setEmailEditable(false);
      setNewPassword("");
      setRepeatPassword("");
      setAvatarFile(null);
      setErrors({});
      setGlobalMessage("");
      setIsSuccessMsg(false);
      setShowConfirmSave(false);
      setConfirmPassword("");
      setConfirmError("");
      setDeleteText("");
      setDeletePassword("");
      setDeleteError("");
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((p) => ({ ...p, avatar: "Solo se permiten imágenes" }));
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setErrors((p) => ({ ...p, avatar: "" }));
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const trimUser = username.trim();
    if (!trimUser) errs.username = "El nombre de usuario es obligatorio";
    else if (trimUser.length < 3) errs.username = "Mínimo 3 caracteres";
    else if (trimUser.length > 50) errs.username = "Máximo 50 caracteres";

    const trimEmail = email.trim();
    if (!trimEmail) errs.email = "El email es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail))
      errs.email = "Formato de email no válido";
    else if (trimEmail.length > 100) errs.email = "Máximo 100 caracteres";

    if (newPassword) {
      if (newPassword.length < 8) errs.newPassword = "Mínimo 8 caracteres";
      else if (newPassword.length > 100)
        errs.newPassword = "Máximo 100 caracteres";
      if (newPassword !== repeatPassword)
        errs.repeatPassword = "Las contraseñas no coinciden";
    }
    return errs;
  };

  const handleSaveClick = async () => {
    // 1. Format validation
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      scrollBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 2. Uniqueness checks — only for fields that actually changed
    const token = localStorage.getItem("jwtToken");
    const uniqueErrors: Record<string, string> = {};

    if (username.trim() !== originalUsername) {
      try {
        const res = await fetch(
          buildApiUrl(
            `/api/users/check-username?username=${encodeURIComponent(username.trim())}`,
          ),
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (!data.available) uniqueErrors.username = "Este usuario ya existe";
      } catch {
        uniqueErrors.username = "Error al verificar el usuario";
      }
    }

    if (email.trim().toLowerCase() !== originalEmail) {
      try {
        const res = await fetch(
          buildApiUrl(
            `/api/users/check-email?email=${encodeURIComponent(email.trim().toLowerCase())}`,
          ),
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (!data.available) uniqueErrors.email = "Este email ya está en uso";
      } catch {
        uniqueErrors.email = "Error al verificar el email";
      }
    }

    if (Object.keys(uniqueErrors).length > 0) {
      setErrors(uniqueErrors);
      scrollBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 3. All clear — open password confirmation overlay
    setConfirmPassword("");
    setConfirmError("");
    setShowConfirmSave(true);
  };

  const handleConfirmedSave = async () => {
    if (!confirmPassword) {
      setConfirmError("Introduce tu contraseña actual");
      return;
    }
    setLoading(true);
    setConfirmError("");
    const token = localStorage.getItem("jwtToken");

    try {
      let finalAvatar = currentAvatarUrl;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const avatarRes = await fetch(buildApiUrl("/api/users/me/avatar"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const avatarData = await avatarRes.json();
        if (!avatarRes.ok)
          throw new Error(avatarData.error || "Error al subir la imagen");
        finalAvatar = avatarData.avatar;
      }

      const body: Record<string, string> = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        currentPassword: confirmPassword,
      };
      if (newPassword) body.newPassword = newPassword;

      const res = await fetch(buildApiUrl("/api/users/me"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        const errMsg = (data.error ?? "").toLowerCase();
        if (
          res.status === 401 ||
          errMsg.includes("contraseña") ||
          errMsg.includes("password")
        ) {
          setConfirmError(data.error || "Contraseña incorrecta");
        } else if (errMsg.includes("username") || errMsg.includes("usuario")) {
          setShowConfirmSave(false);
          setErrors({ username: "Este usuario ya existe" });
        } else if (errMsg.includes("email") || errMsg.includes("correo")) {
          setShowConfirmSave(false);
          setErrors({ email: "Este email ya está en uso" });
        } else {
          setShowConfirmSave(false);
          setGlobalMessage(data.error || "Error al guardar cambios");
        }
        return;
      }

      if (data.token) localStorage.setItem("jwtToken", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("avatar", finalAvatar);
      window.dispatchEvent(
        new CustomEvent("fosteria:profile-updated", {
          detail: { username: data.username, avatar: finalAvatar },
        }),
      );
      onSuccess(data.username, finalAvatar);
      setShowConfirmSave(false);
      setGlobalMessage("¡Cambios guardados!");
      setIsSuccessMsg(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setConfirmError((err as Error).message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "borrar") return;
    if (!deletePassword) {
      setDeleteError("Introduce tu contraseña actual");
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    const token = localStorage.getItem("jwtToken");
    try {
      const res = await fetch(buildApiUrl("/api/users/me"), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar la cuenta");
      onAccountDeleted();
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      {/* Modal container — relative so the confirm overlay can be absolute inside */}
      <div className="relative w-full max-w-md rounded-2xl border border-amber-400/25 bg-stone-950 shadow-[0_24px_60px_rgba(0,0,0,0.7)] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-amber-400/15 shrink-0">
          <h2 className="text-base font-bold text-amber-300 uppercase tracking-widest">
            {view === "delete" ? "Eliminar cuenta" : "Editar perfil"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-stone-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body — buttons live at the bottom of the scroll */}
        <div
          ref={scrollBodyRef}
          className="overflow-y-auto flex-1 px-6 py-5 space-y-5"
        >
          {view === "edit" ? (
            <>
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group"
                >
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-[88px] h-[88px] rounded-full object-cover border-2 border-amber-400/40 shadow-lg"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={22} className="text-amber-300" />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-amber-400/60 hover:text-amber-300 transition-colors underline decoration-amber-400/30"
                >
                  Cambiar foto
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {errors.avatar && <FieldError message={errors.avatar} />}
              </div>

              <GoldDivider />

              {/* Username — locked by default */}
              <LockableField
                label="Usuario"
                error={errors.username}
                editable={usernameEditable}
                onUnlock={() => setUsernameEditable(true)}
              >
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrors((p) => ({ ...p, username: "" }));
                  }}
                  disabled={!usernameEditable}
                  maxLength={50}
                  className={`h-10 bg-stone-800/60 text-stone-100 text-sm border-stone-700/60 pr-10 placeholder:text-stone-500 focus-visible:ring-amber-500/30 ${!usernameEditable ? "opacity-60" : ""} ${errors.username ? "ring-2 ring-red-500/70" : ""}`}
                />
              </LockableField>

              {/* Email — locked by default */}
              <LockableField
                label="Email"
                error={errors.email}
                editable={emailEditable}
                onUnlock={() => setEmailEditable(true)}
              >
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((p) => ({ ...p, email: "" }));
                  }}
                  disabled={!emailEditable}
                  maxLength={100}
                  className={`h-10 bg-stone-800/60 text-stone-100 text-sm border-stone-700/60 pr-10 placeholder:text-stone-500 focus-visible:ring-amber-500/30 ${!emailEditable ? "opacity-60" : ""} ${errors.email ? "ring-2 ring-red-500/70" : ""}`}
                />
              </LockableField>

              <GoldDivider />

              {/* Password change */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Cambiar contraseña
                </p>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Nueva contraseña
                  </label>
                  <Input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors((p) => ({ ...p, newPassword: "" }));
                    }}
                    maxLength={100}
                    className={`h-10 bg-stone-800/60 text-stone-100 text-sm border-stone-700/60 placeholder:text-stone-500 ${errors.newPassword ? "ring-2 ring-red-500/70" : ""}`}
                  />
                  {errors.newPassword && (
                    <FieldError message={errors.newPassword} />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Repetir contraseña
                  </label>
                  <Input
                    type="password"
                    placeholder="Repite la nueva contraseña"
                    value={repeatPassword}
                    onChange={(e) => {
                      setRepeatPassword(e.target.value);
                      setErrors((p) => ({ ...p, repeatPassword: "" }));
                    }}
                    maxLength={100}
                    className={`h-10 bg-stone-800/60 text-stone-100 text-sm border-stone-700/60 placeholder:text-stone-500 ${errors.repeatPassword ? "ring-2 ring-red-500/70" : ""}`}
                  />
                  {errors.repeatPassword && (
                    <FieldError message={errors.repeatPassword} />
                  )}
                </div>
              </div>

              {globalMessage && (
                <p
                  className={`text-sm text-center font-bold px-3 py-2 rounded-md ${
                    isSuccessMsg
                      ? "text-emerald-300 bg-emerald-900/30 border border-emerald-500/30"
                      : "text-red-300 bg-red-900/30 border border-red-500/30"
                  }`}
                >
                  {globalMessage}
                </p>
              )}

              <GoldDivider />

              {/* Save button — only active when something actually changed */}
              <Button
                type="button"
                onClick={handleSaveClick}
                disabled={
                  avatarFile === null &&
                  username.trim() === originalUsername &&
                  email.trim().toLowerCase() === originalEmail &&
                  newPassword.trim() === ""
                }
                className="w-full h-11 bg-amber-800/70 hover:bg-amber-700 text-white text-sm font-bold border border-amber-600/30 transition-colors disabled:opacity-35"
              >
                Guardar cambios
              </Button>

              <GoldDivider />

              {/* Delete zone */}
              <div className="rounded-xl bg-red-950/40 border border-red-800/40 px-4 py-3 flex items-center justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-red-300">Cuidado</p>
                  <p className="text-xs text-red-400/60 mt-0.5">
                    Esta acción no se puede deshacer
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setView("delete");
                    setGlobalMessage("");
                  }}
                  className="shrink-0 px-4 py-1.5 rounded-lg bg-red-800/60 hover:bg-red-700/80 text-red-200 text-sm font-bold border border-red-600/40 transition-colors"
                >
                  Eliminar cuenta
                </button>
              </div>
            </>
          ) : (
            /* Delete confirmation view */
            <>
              <p className="text-stone-300 text-sm leading-relaxed">
                Esta acción es{" "}
                <strong className="text-red-400">
                  permanente e irreversible
                </strong>
                . Se eliminarán todos tus datos, personajes y campañas.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Confirma escribiendo "borrar"
                </label>
                <Input
                  type="text"
                  placeholder="borrar"
                  value={deleteText}
                  onChange={(e) => {
                    setDeleteText(e.target.value);
                    setDeleteError("");
                  }}
                  className="h-10 bg-stone-800/60 text-stone-100 text-sm border-stone-700/60 placeholder:text-stone-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Contraseña actual
                </label>
                <Input
                  type="password"
                  placeholder="Tu contraseña actual"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError("");
                  }}
                  className="h-10 bg-stone-800/60 text-stone-100 text-sm border-stone-700/60 placeholder:text-stone-600"
                />
              </div>

              {deleteError && (
                <p className="text-sm text-red-300 bg-red-900/30 border border-red-500/30 text-center font-bold px-3 py-2 rounded-md">
                  {deleteError}
                </p>
              )}

              <GoldDivider />

              <div className="flex gap-3 pb-2">
                <Button
                  type="button"
                  onClick={() => {
                    setView("edit");
                    setDeleteText("");
                    setDeletePassword("");
                    setDeleteError("");
                  }}
                  className="flex-1 h-11 bg-transparent text-stone-300 text-sm border border-stone-700 hover:bg-stone-800 font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={
                    deleteText !== "borrar" || !deletePassword || deleteLoading
                  }
                  className="flex-1 h-11 bg-red-900/70 hover:bg-red-800 text-white text-sm font-bold border border-red-700/40 disabled:opacity-35 transition-colors"
                >
                  {deleteLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Eliminar cuenta"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Confirm-save overlay — appears on top of everything inside the modal */}
        {showConfirmSave && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl">
            <div className="bg-stone-900 border border-amber-400/25 rounded-xl p-6 mx-4 w-full max-w-xs space-y-4">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                Confirmar cambios
              </h3>
              <p className="text-stone-400 text-sm">
                Introduce tu contraseña actual para guardar los cambios:
              </p>
              <Input
                type="password"
                placeholder="Tu contraseña actual"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmError("");
                }}
                className="h-10 bg-stone-800/60 text-stone-100 text-sm border-stone-700/60 placeholder:text-stone-500"
                autoFocus
              />
              {confirmError && (
                <p className="text-xs text-red-400 font-semibold">
                  {confirmError}
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowConfirmSave(false);
                    setConfirmPassword("");
                    setConfirmError("");
                  }}
                  className="flex-1 h-10 bg-transparent border border-stone-700 text-stone-300 hover:bg-stone-800 text-sm"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmedSave}
                  disabled={!confirmPassword || loading}
                  className="flex-1 h-10 bg-amber-800/70 hover:bg-amber-700 text-white text-sm font-bold border border-amber-600/30"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    "Confirmar"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs text-red-400 font-semibold mt-0.5">{message}</p>;
}

function LockableField({
  label,
  children,
  error,
  editable,
  onUnlock,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  editable: boolean;
  onUnlock: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {children}
        <button
          type="button"
          onClick={onUnlock}
          title={editable ? "Campo en edición" : "Editar campo"}
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
            editable
              ? "text-amber-400"
              : "text-amber-400/45 hover:text-amber-300"
          }`}
        >
          <Pencil size={13} />
        </button>
      </div>
      {error && <FieldError message={error} />}
    </div>
  );
}
