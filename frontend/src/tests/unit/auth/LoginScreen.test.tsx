// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import LoginScreen from "../../../screens/LoginScreen";

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
      expect(fetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "daria", password: "12345678" }),
      });
    });
    expect(localStorage.getItem("jwtToken")).toBe("jwt-token");
    expect(await screen.findByText("¡Bienvenido daria!")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(onLoginSuccess).toHaveBeenCalledWith("jwt-token", "daria");
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
});
