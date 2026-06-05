import { useState } from "react";
import loginImage from "../assets/Fondo login.jpeg";
import fondoRegistro from "../assets/registro.png";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import LogoLayout from "../components/LogoLayout";
import PrivacyPolicyModal from "../components/PrivacyPolicyModal";
import { buildApiUrl } from "../lib/api";

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  username?: string[];
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
}

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
  onGoHome?: () => void;
}

export default function RegisterScreen({
  onRegisterSuccess,
  onSwitchToLogin,
  onGoHome,
}: RegisterScreenProps) {
  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleChange =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
      setMessage("");
    };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!form.username.trim()) {
      newErrors.username = ["El nombre de usuario es obligatorio"];
    } else if (form.username.trim().length < 3) {
      newErrors.username = ["Mínimo 3 caracteres"];
    }

    const emailErrors: string[] = [];
    if (!form.email.trim()) {
      emailErrors.push("El email es obligatorio");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const tieneEmoji =
        /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(
          form.email,
        );

      if (!emailRegex.test(form.email)) {
        emailErrors.push("Formato de email no válido");
      } else if (tieneEmoji) {
        emailErrors.push("No se permiten emojis en el email");
      }
    }
    if (emailErrors.length > 0) newErrors.email = emailErrors;

    if (form.password.length < 8) {
      newErrors.password = ["Mínimo 8 caracteres requeridos"];
    }

    if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = ["Las contraseñas no coinciden"];
    }

    return newErrors;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      const res = await fetch(buildApiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        const backendErrors: FormErrors = {};
        const errMsg = (data.error ?? data.message ?? "").toLowerCase();
        if (errMsg.includes("username") || errMsg.includes("usuario")) {
          backendErrors.username = ["Este usuario ya existe"];
        }
        if (errMsg.includes("email") || errMsg.includes("correo")) {
          backendErrors.email = ["Este email ya existe"];
        }
        if (Object.keys(backendErrors).length === 0) {
          // Fallback: show a generic error so the user isn't left guessing
          setMessage(
            data.error ??
              data.message ??
              "Error al registrarse. Inténtalo de nuevo.",
          );
        }
        setErrors(backendErrors);
        return;
      }

      setMessage("¡Registro completado!");
      setTimeout(() => onRegisterSuccess(), 1500);
    } catch {
      setMessage("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full min-h-screen relative flex items-center justify-center"
      style={{
        backgroundImage: `url(${loginImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <LogoLayout onLogoClick={onGoHome}>
        <div className="relative z-10 w-full max-w-md mt-16 mx-4">
          <Card className="border-none ring-0 shadow-2xl overflow-hidden bg-transparent">
            <div
              className="relative p-0 min-h-[520px] w-full flex flex-col"
              style={{
                backgroundImage: `url(${fondoRegistro})`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <form
                onSubmit={submit}
                noValidate
                className="relative z-20 flex flex-col min-h-[520px] w-full px-10"
              >
                <div className="pt-[100px] pb-2 w-full text-center">
                  <h1 className="text-xl font-bold text-black tracking-widest uppercase drop-shadow-lg">
                    Solicitud de registro
                  </h1>
                </div>

                <div className="space-y-4 flex-grow flex flex-col justify-start pt-2 -mt-2">
                  {/* USUARIO */}
                  <div className="space-y-0.5">
                    <label className="block text-[10px] font-bold text-black uppercase tracking-wider">
                      Usuario
                    </label>
                    <Input
                      type="text"
                      placeholder="Tu nombre..."
                      value={form.username}
                      onChange={handleChange("username")}
                      className={`h-8 bg-black/10 text-black border-none placeholder:text-black/40 focus:ring-0 focus-visible:ring-0 ${errors.username ? "ring-2 ring-red-600" : ""}`}
                    />
                    {errors.username?.map((err, i) => (
                      <div key={i} className="w-full flex justify-start">
                        <p className="text-[12px] max-w-xs text-red-800 font-extrabold mt-1 bg-red-100/90 border border-red-400 shadow-md px-3 py-1 rounded-md drop-shadow animate-pulse transition-all duration-300">
                          {err}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* EMAIL */}
                  <div className="space-y-0.5">
                    <label className="block text-[10px] font-bold text-black uppercase tracking-wider">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="Tu correo..."
                      value={form.email}
                      onChange={handleChange("email")}
                      className={`h-8 bg-black/10 text-black border-none placeholder:text-black/40 focus:ring-0 focus-visible:ring-0 ${errors.email ? "ring-2 ring-red-600" : ""}`}
                    />
                    {errors.email?.map((err, i) => (
                      <div key={i} className="w-full flex justify-start">
                        <p className="text-[12px] max-w-xs text-red-800 font-extrabold mt-1 bg-red-100/90 border border-red-400 shadow-md px-3 py-1 rounded-md drop-shadow animate-pulse transition-all duration-300">
                          {err}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* CONTRASEÑA */}
                  <div className="space-y-0.5">
                    <label className="block text-[10px] font-bold text-black uppercase tracking-wider">
                      Contraseña
                    </label>
                    <Input
                      type="password"
                      placeholder="********"
                      value={form.password}
                      onChange={handleChange("password")}
                      className={`h-8 bg-black/10 text-black border-none placeholder:text-black/40 focus:ring-0 focus-visible:ring-0 ${errors.password ? "ring-2 ring-red-600" : ""}`}
                    />
                    {errors.password?.map((err, i) => (
                      <div key={i} className="w-full flex justify-start">
                        <p className="text-[12px] max-w-xs text-red-800 font-extrabold mt-1 bg-red-100/90 border border-red-400 shadow-md px-3 py-1 rounded-md drop-shadow animate-pulse transition-all duration-300">
                          {err}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* REPETIR CONTRASEÑA */}
                  <div className="space-y-0.5">
                    <label className="block text-[10px] font-bold text-black uppercase tracking-wider">
                      Repetir contraseña
                    </label>
                    <Input
                      type="password"
                      placeholder="Repite tu contraseña"
                      value={form.confirmPassword}
                      onChange={handleChange("confirmPassword")}
                      className={`h-8 bg-black/10 text-black border-none placeholder:text-black/40 focus:ring-0 focus-visible:ring-0 ${errors.confirmPassword ? "ring-2 ring-red-600" : ""}`}
                    />
                    {errors.confirmPassword?.map((err, i) => (
                      <div key={i} className="w-full flex justify-start">
                        <p className="text-[12px] max-w-xs text-red-800 font-extrabold mt-1 bg-red-100/90 border border-red-400 shadow-md px-3 py-1 rounded-md drop-shadow animate-pulse transition-all duration-300">
                          {err}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Privacy consent */}
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      id="privacy-accept"
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-red-900 cursor-pointer"
                    />
                    <label
                      htmlFor="privacy-accept"
                      className="text-[11px] text-black/70 leading-snug cursor-pointer"
                    >
                      He leído y acepto la{" "}
                      <button
                        type="button"
                        onClick={() => setShowPrivacy(true)}
                        className="font-bold text-black underline hover:text-red-900 transition-colors"
                      >
                        Política de Privacidad
                      </button>{" "}
                      y el tratamiento de mis datos personales. Confirmo tener
                      al menos 16 años.
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !accepted}
                    className="w-full h-9 bg-red-950/90 hover:bg-black text-white mt-2 border border-red-800/50 transition-all font-bold disabled:opacity-40"
                  >
                    {isLoading ? "PROCESANDO..." : "REGISTRARSE"}
                  </Button>

                  {message && (
                    <div className="w-full flex justify-center">
                      <p
                        className={`text-[12px] max-w-xs text-center font-extrabold mt-2 shadow-md px-3 py-1 rounded-md drop-shadow animate-pulse ${
                          message.includes("completado")
                            ? "text-emerald-800 bg-emerald-100/90 border border-emerald-400"
                            : "text-red-800 bg-red-100/90 border border-red-400"
                        }`}
                      >
                        {message}
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-center pb-12 pt-2 w-full">
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-black  text-base font-black hover:text-red-900 transition-colors text-[10px] underline decoration-black/50 uppercase"
                  >
                    Ya poseo tarjeta de identificación
                  </button>
                </div>
              </form>

              <PrivacyPolicyModal
                isOpen={showPrivacy}
                onClose={() => setShowPrivacy(false)}
              />
            </div>
          </Card>
        </div>
      </LogoLayout>
    </div>
  );
}
