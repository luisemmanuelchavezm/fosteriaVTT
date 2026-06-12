// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import LoginScreen from "../../../screens/LoginScreen";
import { buildApiUrl } from "../../../lib/api";

vi.mock("../../../components/LogoLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../../../components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../../../components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("../../../components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it("deshabilita el envío hasta que el formulario es válido", () => {
    render(
      <LoginScreen onLoginSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />,
    );

    const submitButton = screen.getByRole("button", { name: "Entrar" });
    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Tu usuario"), {
      target: { value: "daria" },
    });
    fireEvent.change(screen.getByPlaceholderText("Tu contraseña"), {
      target: { value: "12345678" },
    });

    expect(submitButton).toBeEnabled();
  });

  it("envía las credenciales, guarda el token y notifica el login correcto", async () => {
    const onLoginSuccess = vi.fn();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ token: "jwt-token", username: "daria" }),
    } as Response);

    render(
      <LoginScreen
        onLoginSuccess={onLoginSuccess}
        onSwitchToRegister={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Tu usuario"), {
      target: { value: "daria" },
    });
    fireEvent.change(screen.getByPlaceholderText("Tu contraseña"), {
      target: { value: "12345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(buildApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "daria", password: "12345678" }),
      });
    });
    expect(localStorage.getItem("jwtToken")).toBe("jwt-token");
    expect(await screen.findByText("¡Bienvenido daria!")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(onLoginSuccess).toHaveBeenCalledWith(
          "jwt-token",
          "daria",
          undefined,
          "USER",
        );
      },
      { timeout: 1500 },
    );
  });

  it("muestra el mensaje devuelto por el backend si falla el login", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Contraseña incorrecta" }),
    } as Response);

    render(
      <LoginScreen onLoginSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />,
    );

    fireEvent.change(screen.getByPlaceholderText("Tu usuario"), {
      target: { value: "daria" },
    });
    fireEvent.change(screen.getByPlaceholderText("Tu contraseña"), {
      target: { value: "12345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("Contraseña incorrecta"),
    ).toBeInTheDocument();
  });

  it("permite cambiar a la pantalla de registro", () => {
    const onSwitchToRegister = vi.fn();

    render(
      <LoginScreen
        onLoginSuccess={vi.fn()}
        onSwitchToRegister={onSwitchToRegister}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(onSwitchToRegister).toHaveBeenCalledTimes(1);
  });

  // ── Reset flow ─────────────────────────────────────────────────────────────

  it("entra en modo recuperación al hacer clic en Cambiar contraseña", () => {
    render(
      <LoginScreen onLoginSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(screen.getByText("Recuperar contraseña")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("tu@email.com")).toBeInTheDocument();
  });

  it("sale del modo recuperación al hacer clic en Volver", () => {
    render(
      <LoginScreen onLoginSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
    expect(screen.getByText("Recuperar contraseña")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "← Volver al inicio de sesión" }),
    );

    expect(screen.getByPlaceholderText("Tu usuario")).toBeInTheDocument();
  });

  it("avanza al paso de código tras solicitar con éxito", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(
      <LoginScreen onLoginSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
    fireEvent.change(screen.getByPlaceholderText("tu@email.com"), {
      target: { value: "test@example.com" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Solicitar código" }));
    });

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Código de 6 dígitos"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(
        "Código enviado. Revisa tu correo de spam si no lo encuentras.",
      ),
    ).toBeInTheDocument();
  });

  it("muestra error si la solicitud del código falla", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Email no encontrado" }),
    } as Response);

    render(
      <LoginScreen onLoginSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
    fireEvent.change(screen.getByPlaceholderText("tu@email.com"), {
      target: { value: "nope@example.com" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Solicitar código" }));
    });

    expect(await screen.findByText("Email no encontrado")).toBeInTheDocument();
  });

  it("avanza al paso de contraseña tras verificar el código con éxito", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);

    render(
      <LoginScreen onLoginSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
    fireEvent.change(screen.getByPlaceholderText("tu@email.com"), {
      target: { value: "test@example.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Solicitar código" }));
    });
    await waitFor(() => screen.getByPlaceholderText("Código de 6 dígitos"));
    fireEvent.change(screen.getByPlaceholderText("Código de 6 dígitos"), {
      target: { value: "123456" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Verificar código" }));
    });

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Mínimo 8 caracteres"),
      ).toBeInTheDocument(),
    );
  });

  it("muestra error si el código de verificación es inválido", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Código inválido o expirado" }),
      } as Response);

    render(
      <LoginScreen onLoginSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
    fireEvent.change(screen.getByPlaceholderText("tu@email.com"), {
      target: { value: "test@example.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Solicitar código" }));
    });
    await waitFor(() => screen.getByPlaceholderText("Código de 6 dígitos"));
    fireEvent.change(screen.getByPlaceholderText("Código de 6 dígitos"), {
      target: { value: "000000" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Verificar código" }));
    });

    expect(
      await screen.findByText("Código inválido o expirado"),
    ).toBeInTheDocument();
  });

  it("muestra error cuando las contraseñas nuevas no coinciden", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);

    render(
      <LoginScreen onLoginSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
    fireEvent.change(screen.getByPlaceholderText("tu@email.com"), {
      target: { value: "test@example.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Solicitar código" }));
    });
    await waitFor(() => screen.getByPlaceholderText("Código de 6 dígitos"));
    fireEvent.change(screen.getByPlaceholderText("Código de 6 dígitos"), {
      target: { value: "123456" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Verificar código" }));
    });
    await waitFor(() => screen.getByPlaceholderText("Mínimo 8 caracteres"));

    fireEvent.change(screen.getByPlaceholderText("Mínimo 8 caracteres"), {
      target: { value: "password1" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repite la contraseña"), {
      target: { value: "password2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(
      screen.getByText("Las contraseñas no coinciden"),
    ).toBeInTheDocument();
  });

  it("muestra mensaje de éxito al cambiar la contraseña correctamente", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);

    render(
      <LoginScreen onLoginSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
    fireEvent.change(screen.getByPlaceholderText("tu@email.com"), {
      target: { value: "test@example.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Solicitar código" }));
    });
    await waitFor(() => screen.getByPlaceholderText("Código de 6 dígitos"));
    fireEvent.change(screen.getByPlaceholderText("Código de 6 dígitos"), {
      target: { value: "123456" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Verificar código" }));
    });
    await waitFor(() => screen.getByPlaceholderText("Mínimo 8 caracteres"));

    fireEvent.change(screen.getByPlaceholderText("Mínimo 8 caracteres"), {
      target: { value: "newpassword1" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repite la contraseña"), {
      target: { value: "newpassword1" },
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Cambiar contraseña" }),
      );
    });

    await waitFor(() =>
      expect(
        screen.getByText("¡Contraseña cambiada! Ya puedes iniciar sesión."),
      ).toBeInTheDocument(),
    );
  });
});
