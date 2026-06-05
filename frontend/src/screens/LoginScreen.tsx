import { useState, useMemo } from "react";
import loginImage from "../assets/login.png";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import LogoLayout from "../components/LogoLayout";
import { buildApiUrl } from "../lib/api";

type ResetStep = "idle" | "enter_email" | "enter_code" | "enter_password";

interface LoginScreenProps {
  onLoginSuccess: (
    token: string,
    username: string,
    avatarUrl: string,
    role: string,
  ) => void;
  onSwitchToRegister: () => void;
  onGoHome?: () => void;
  joinMessage?: string;
}

export default function LoginScreen({
  onLoginSuccess,
  onSwitchToRegister,
  onGoHome,
}: LoginScreenProps) {
  // ── Login state ──────────────────────────────────────────────────────────────
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ── Reset state ──────────────────────────────────────────────────────────────
  const [resetStep, setResetStep] = useState<ResetStep>("idle");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const isResetMode = resetStep !== "idle";

  const canSubmitLogin = useMemo(
    () => username.trim() !== "" && password.length >= 8,
    [username, password],
  );

  // ── Login ────────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(buildApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || data.message || "Algo salió mal");
      localStorage.setItem("jwtToken", data.token);
      localStorage.setItem("avatar", data.avatar);
      setMessage(`¡Bienvenido ${data.username ?? username}!`);
      setTimeout(() => {
        onLoginSuccess(
          data.token,
          data.username ?? username,
          data.avatar,
          data.role ?? "USER",
        );
      }, 1000);
      setUsername("");
      setPassword("");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Reset: solicitar código ──────────────────────────────────────────────────
  const handleRequestCode = async () => {
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setResetError("");
    setResetMessage("");
    try {
      const res = await fetch(buildApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar el código");
      setResetMessage(
        "Código enviado. Revisa tu correo de spam si no lo encuentras.",
      );
      setResetStep("enter_code");
    } catch (error) {
      setResetError((error as Error).message);
    } finally {
      setResetLoading(false);
    }
  };

  // ── Reset: verificar código ──────────────────────────────────────────────────
  const handleVerifyCode = async () => {
    if (!resetCode.trim()) return;
    setResetLoading(true);
    setResetError("");
    setResetMessage("");
    try {
      const res = await fetch(buildApiUrl("/api/auth/verify-reset-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          code: resetCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código inválido o expirado");
      setResetStep("enter_password");
      setResetMessage("");
    } catch (error) {
      setResetError((error as Error).message);
    } finally {
      setResetLoading(false);
    }
  };

  // ── Reset: cambiar contraseña ────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (newPassword !== repeatPassword) {
      setResetError("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 8) {
      setResetError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setResetLoading(true);
    setResetError("");
    setResetMessage("");
    try {
      const res = await fetch(buildApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          code: resetCode.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "No se pudo cambiar la contraseña");
      setResetMessage("¡Contraseña cambiada! Ya puedes iniciar sesión.");
      setTimeout(() => {
        setResetStep("idle");
        setResetEmail("");
        setResetCode("");
        setNewPassword("");
        setRepeatPassword("");
        setResetMessage("");
      }, 2500);
    } catch (error) {
      setResetError((error as Error).message);
    } finally {
      setResetLoading(false);
    }
  };

  const enterResetMode = () => {
    setResetStep("enter_email");
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setRepeatPassword("");
    setResetMessage("");
    setResetError("");
    setMessage("");
  };

  const exitResetMode = () => {
    setResetStep("idle");
    setResetMessage("");
    setResetError("");
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <LogoLayout onLogoClick={onGoHome}>
      <div className="relative z-10 w-full max-w-3xl mt-16">
        <Card className="border-none ring-0 shadow-2xl overflow-hidden bg-transparent">
          <div
            className="relative p-0 min-h-[400px] w-full flex flex-col"
            style={{
              backgroundImage: `url(${loginImage})`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            <div className="relative z-20 flex flex-col min-h-[400px] w-full">
              {/* TÍTULO */}
              <div className="pt-[84px] pb-8 w-full md:w-[60%] md:ml-[23%] text-center">
                <h1 className="text-xl font-bold text-gray-200 tracking-widest uppercase drop-shadow-lg">
                  {isResetMode
                    ? "Recuperar contraseña"
                    : "Tarjeta de identificación"}
                </h1>
              </div>

              {/* CUERPO */}
              <div className="w-[60%] ml-auto pr-10 space-y-4 flex-grow flex flex-col justify-center">
                {/* ── LOGIN ────────────────────────────────────────────── */}
                {!isResetMode && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-black uppercase tracking-wider">
                        Usuario
                      </label>
                      <Input
                        type="text"
                        placeholder="Tu usuario"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setMessage("");
                        }}
                        required
                        minLength={3}
                        maxLength={100}
                        className="h-9 bg-black/10 text-black border-none placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-red-900/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-black uppercase tracking-wider">
                        Contraseña
                      </label>
                      <Input
                        type="password"
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setMessage("");
                        }}
                        required
                        minLength={8}
                        maxLength={100}
                        className="h-9 bg-black/10 text-black border-none placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-red-900/50"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!canSubmitLogin || isLoading}
                      className="w-full h-10 bg-red-950/90 hover:bg-black text-white mt-4 border border-red-800/50"
                    >
                      {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                    {message && (
                      <div className="w-full flex justify-center">
                        <p className="text-[12px] max-w-xs text-center text-red-800 font-extrabold mt-2 bg-red-100/90 border border-red-400 shadow-md px-3 py-1 rounded-md drop-shadow animate-pulse">
                          {message}
                        </p>
                      </div>
                    )}
                  </form>
                )}

                {/* ── STEP 1: email + código desactivado ───────────────── */}
                {resetStep === "enter_email" && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-black uppercase tracking-wider">
                        Email
                      </label>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="h-9 bg-black/10 text-black border-none placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-red-900/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-black/40 uppercase tracking-wider">
                        Código
                      </label>
                      <Input
                        disabled
                        placeholder="······"
                        className="h-9 bg-black/5 text-black border-none placeholder:text-black/20 opacity-50 cursor-not-allowed"
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={!resetEmail.trim() || resetLoading}
                      onClick={handleRequestCode}
                      className="w-full h-10 bg-red-950/90 hover:bg-black text-white border border-red-800/50"
                    >
                      {resetLoading ? "Enviando..." : "Solicitar código"}
                    </Button>
                  </div>
                )}

                {/* ── STEP 2: email + código activo ────────────────────── */}
                {resetStep === "enter_code" && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-black uppercase tracking-wider">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="h-9 bg-black/10 text-black border-none placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-red-900/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-black uppercase tracking-wider">
                        Código
                      </label>
                      <Input
                        type="text"
                        placeholder="Código de 6 dígitos"
                        value={resetCode}
                        onChange={(e) =>
                          setResetCode(
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        maxLength={6}
                        className="h-9 bg-black/10 text-black border-none placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-red-900/50 tracking-widest text-center"
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={resetCode.length < 6 || resetLoading}
                      onClick={handleVerifyCode}
                      className="w-full h-10 bg-red-950/90 hover:bg-black text-white border border-red-800/50"
                    >
                      {resetLoading ? "Verificando..." : "Verificar código"}
                    </Button>
                  </div>
                )}

                {/* ── STEP 3: nueva contraseña ──────────────────────────── */}
                {resetStep === "enter_password" && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-black uppercase tracking-wider">
                        Nueva contraseña
                      </label>
                      <Input
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setResetError("");
                        }}
                        minLength={8}
                        maxLength={100}
                        className="h-9 bg-black/10 text-black border-none placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-red-900/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-black uppercase tracking-wider">
                        Repetir contraseña
                      </label>
                      <Input
                        type="password"
                        placeholder="Repite la contraseña"
                        value={repeatPassword}
                        onChange={(e) => {
                          setRepeatPassword(e.target.value);
                          setResetError("");
                        }}
                        minLength={8}
                        maxLength={100}
                        className="h-9 bg-black/10 text-black border-none placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-red-900/50"
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={!newPassword || !repeatPassword || resetLoading}
                      onClick={handleChangePassword}
                      className="w-full h-10 bg-red-950/90 hover:bg-black text-white border border-red-800/50"
                    >
                      {resetLoading ? "Guardando..." : "Cambiar contraseña"}
                    </Button>
                  </div>
                )}

                {/* Mensajes de reset */}
                {resetMessage && (
                  <p className="text-[12px] text-center text-green-800 font-extrabold bg-green-100/90 border border-green-400 px-3 py-1 rounded-md">
                    {resetMessage}
                  </p>
                )}
                {resetError && (
                  <p className="text-[12px] text-center text-red-800 font-extrabold bg-red-100/90 border border-red-400 px-3 py-1 rounded-md animate-pulse">
                    {resetError}
                  </p>
                )}
              </div>

              {/* FOOTER */}
              <div
                className="text-center pb-10 pt-4 w-[60%] ml-auto pr-20 flex justify-center gap-4"
                style={{ transform: "translateX(-10px)" }}
              >
                {!isResetMode ? (
                  <>
                    <button
                      type="button"
                      onClick={onSwitchToRegister}
                      className="text-black font-black hover:text-red-900 transition-colors text-sm md:text-base underline decoration-black/50"
                    >
                      Crear cuenta
                    </button>
                    <span className="text-black/40 font-bold">·</span>
                    <button
                      type="button"
                      onClick={enterResetMode}
                      className="text-black font-black hover:text-red-900 transition-colors text-sm md:text-base underline decoration-black/50"
                    >
                      Cambiar contraseña
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={exitResetMode}
                    className="text-black font-black hover:text-red-900 transition-colors text-sm md:text-base underline decoration-black/50"
                  >
                    ← Volver al inicio de sesión
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </LogoLayout>
  );
}
