import { useMemo, useState, useEffect } from "react";

interface FormState {
  username: string;
  email: string;
  password: string;
}

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("jwtToken");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const canSubmit = useMemo(() => {
    if (mode === "login") {
      return form.username.trim() !== "" && form.password.length >= 8;
    }
    return (
      form.username.trim() !== "" &&
      form.email.trim() !== "" &&
      form.password.length >= 8
    );
  }, [form, mode]);

  const handleChange =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setMessage("");
    };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const endpoint =
      mode === "register" ? "/api/auth/register" : "/api/auth/login";
    const body =
      mode === "register"
        ? {
            username: form.username,
            email: form.email,
            password: form.password,
          }
        : {
            username: form.username,
            password: form.password,
          };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Something went wrong");
      }

      if (mode === "login") {
        setToken(data.token);
        localStorage.setItem("jwtToken", data.token);
        setMessage(`Bienvenido ${data.username ?? form.username}`);
      } else {
        setMessage("Registro completado. Inicia sesión.");
        setMode("login");
      }
      setForm({ username: "", email: "", password: "" });
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("jwtToken");
    setMessage("Sesión cerrada");
  };

  if (token) {
    return (
      <main
        className="auth-container"
        style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}
      >
        <h1>Autenticado</h1>
        <p>Estás logueado. ¡Disfruta FosteriaVTT!</p>
        <button onClick={logout}>Cerrar sesión</button>
        {message && <p>{message}</p>}
      </main>
    );
  }

  return (
    <main
      className="auth-container"
      style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}
    >
      <h1>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>
      <p>Conecta con tu cuenta y disfruta el proyecto FosteriaVTT</p>
      <div style={{ marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setMode("login")}
          disabled={mode === "login"}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          disabled={mode === "register"}
        >
          Registro
        </button>
      </div>
      <form onSubmit={submit}>
        <label>
          Usuario
          <input
            value={form.username}
            onChange={handleChange("username")}
            required
            minLength={3}
          />
        </label>
        {mode === "register" && (
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              required
            />
          </label>
        )}
        <label>
          Contraseña
          <input
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            required
            minLength={8}
          />
        </label>

        <button type="submit" disabled={!canSubmit} style={{ marginTop: 12 }}>
          {mode === "login" ? "Entrar" : "Registrarse"}
        </button>
        {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </form>

      <small style={{ display: "block", marginTop: 18 }}>
        Recomendado: contraseña segura de al menos 8 caracteres.
      </small>
    </main>
  );
}
