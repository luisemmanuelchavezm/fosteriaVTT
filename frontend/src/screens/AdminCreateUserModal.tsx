import { useState } from "react";
import { buildApiUrl } from "../lib/api";

interface CreateForm {
  username: string;
  email: string;
  password: string;
  role: string;
}

type FieldErrors = {
  username?: string;
  email?: string;
  password?: string;
};

interface AdminCreateUserModalProps {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminCreateUserModal({
  token,
  onClose,
  onSuccess,
}: AdminCreateUserModalProps) {
  const [form, setForm] = useState<CreateForm>({
    username: "",
    email: "",
    password: "",
    role: "USER",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    const u = form.username.trim();
    if (!u) errs.username = "El nombre de usuario es obligatorio";
    else if (u.length < 3) errs.username = "Mínimo 3 caracteres";
    else if (u.length > 100) errs.username = "Máximo 100 caracteres";

    const e = form.email.trim();
    if (!e) errs.email = "El email es obligatorio";
    else if (e.length > 100) errs.email = "Máximo 100 caracteres";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      errs.email = "Formato de email no válido";
    else if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(e))
      errs.email = "No se permiten emojis en el email";

    if (!form.password) errs.password = "La contraseña es obligatoria";
    else if (form.password.length < 8) errs.password = "Mínimo 8 caracteres";
    else if (form.password.length > 100)
      errs.password = "Máximo 100 caracteres";

    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setError(null);
    setCreating(true);
    fetch(buildApiUrl("/api/admin/users"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          const msg: string =
            (data as { error?: string }).error ?? "No se pudo crear el usuario";
          const lower = msg.toLowerCase();
          if (lower.includes("username") || lower.includes("usuario")) {
            setFieldErrors({ username: "Este usuario ya existe" });
          } else if (lower.includes("email") || lower.includes("correo")) {
            setFieldErrors({ email: "Este email ya existe" });
          } else {
            setError(msg);
          }
          return;
        }
        onSuccess();
        onClose();
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCreating(false));
  }

  function handleClose() {
    setFieldErrors({});
    setError(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-zinc-900 p-6 shadow-2xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-white">Crear usuario</h3>
        <div className="flex flex-col gap-3">
          {/* Username */}
          <div className="flex flex-col gap-1">
            <input
              type="text"
              placeholder="Username (mín. 3 caracteres)"
              value={form.username}
              onChange={(e) => {
                setForm((f) => ({ ...f, username: e.target.value }));
                setFieldErrors((fe) => ({ ...fe, username: undefined }));
              }}
              className={`h-10 w-full rounded-xl border bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/60 ${fieldErrors.username ? "border-rose-500/70" : "border-white/20"}`}
            />
            {fieldErrors.username && (
              <p className="text-xs text-rose-400">{fieldErrors.username}</p>
            )}
          </div>
          {/* Email */}
          <div className="flex flex-col gap-1">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => {
                setForm((f) => ({ ...f, email: e.target.value }));
                setFieldErrors((fe) => ({ ...fe, email: undefined }));
              }}
              className={`h-10 w-full rounded-xl border bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/60 ${fieldErrors.email ? "border-rose-500/70" : "border-white/20"}`}
            />
            {fieldErrors.email && (
              <p className="text-xs text-rose-400">{fieldErrors.email}</p>
            )}
          </div>
          {/* Password */}
          <div className="flex flex-col gap-1">
            <input
              type="password"
              placeholder="Contraseña (mín. 8 caracteres)"
              value={form.password}
              onChange={(e) => {
                setForm((f) => ({ ...f, password: e.target.value }));
                setFieldErrors((fe) => ({ ...fe, password: undefined }));
              }}
              className={`h-10 w-full rounded-xl border bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/60 ${fieldErrors.password ? "border-rose-500/70" : "border-white/20"}`}
            />
            {fieldErrors.password && (
              <p className="text-xs text-rose-400">{fieldErrors.password}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: "USER" }))}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                form.role === "USER"
                  ? "bg-amber-500/20 border-amber-400/60 text-amber-300"
                  : "bg-white/5 border-white/15 text-white/40 hover:bg-white/10"
              }`}
            >
              Usuario
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: "ADMIN" }))}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                form.role === "ADMIN"
                  ? "bg-red-900/40 border-red-500/60 text-red-300"
                  : "bg-white/5 border-white/15 text-white/40 hover:bg-white/10"
              }`}
            >
              Admin
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={creating}
            className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={creating}
            className="flex-1 rounded-xl border border-amber-500/50 bg-amber-900/30 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-900/50 transition-colors disabled:opacity-40"
          >
            {creating ? "Creando..." : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
