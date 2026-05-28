import { useState, useMemo } from "react";
import loginImage from "../assets/login.png";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import LogoLayout from "../components/LogoLayout";
import { buildApiUrl } from "../lib/api";

interface FormState {
  username: string;
  password: string;
}

interface LoginScreenProps {
  onLoginSuccess: (token: string, username: string, avatarUrl: string) => void;
  onSwitchToRegister: () => void;
  onGoHome?: () => void;
  joinMessage?: string;
}

export default function LoginScreen({
  onLoginSuccess,
  onSwitchToRegister,
  onGoHome,
}: LoginScreenProps) {
  const [form, setForm] = useState<FormState>({ username: "", password: "" });
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return form.username.trim() !== "" && form.password.length >= 8;
  }, [form]);

  const handleChange =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setMessage("");
    };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(buildApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Algo salió mal");
      }

      localStorage.setItem("jwtToken", data.token);
      localStorage.setItem("avatar", data.avatar);
      setMessage(`¡Bienvenido ${data.username ?? form.username}!`);
      setTimeout(() => {
        onLoginSuccess(data.token, data.username ?? form.username, data.avatar);
      }, 1000);
      setForm({ username: "", password: "" });
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LogoLayout onLogoClick={onGoHome}>
      {/* Contenedor del formulario */}
      <div className="relative z-10 w-full max-w-3xl mt-16">
        <Card className="border-none shadow-2xl overflow-hidden bg-transparent">
          <div
            className="relative p-  0 min-h-[400px] w-full flex flex-col"
            style={{
              backgroundImage: `url(${loginImage})`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            <form
              onSubmit={submit}
              className="relative z-20 flex flex-col min-h-[400px] w-full"
            >
              {/* 1. TÍTULO */}
              <div className="pt-[84px] pb-8 w-full md:w-[60%] md:ml-[23%] text-center">
                <h1 className="text-xl font-bold text-gray-200 tracking-widest uppercase drop-shadow-lg">
                  Tarjeta de identificación
                </h1>
              </div>

              {/* 2. CUERPO: Inputs y Labels */}
              <div className="w-[60%] ml-auto pr-10 space-y-4 flex-grow flex flex-col justify-center">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-black uppercase tracking-wider">
                    Usuario
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Tu usuario"
                    value={form.username}
                    onChange={handleChange("username")}
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
                    id="password"
                    type="password"
                    placeholder="Tu contraseña"
                    value={form.password}
                    onChange={handleChange("password")}
                    required
                    minLength={8}
                    maxLength={100}
                    className="h-9 bg-black/10 text-black border-none placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-red-900/50" // sin borde azul
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit || isLoading}
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
              </div>

              {/* 3. FOOTER: Crear cuenta */}
              <div className="text-center pb-10 pt-4 w-[60%] ml-auto pr-10">
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-black font-black hover:text-red-900 transition-colors text-sm md:text-base underline decoration-black/50"
                >
                  Crear cuenta
                </button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </LogoLayout>
  );
}
