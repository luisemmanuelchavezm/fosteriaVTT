// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import RegisterScreen from "../../../screens/RegisterScreen";

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

vi.mock("../../../components/PrivacyPolicyModal", () => ({
  default: () => null,
}));

function acceptPrivacy() {
  fireEvent.click(screen.getByRole("checkbox"));
}

describe("RegisterScreen", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    cleanup();
  });

  it("muestra validaciones locales y evita llamar al backend", async () => {
    render(
      <RegisterScreen onRegisterSuccess={vi.fn()} onSwitchToLogin={vi.fn()} />,
    );

    fireEvent.change(screen.getByPlaceholderText("Tu correo..."), {
      target: { value: "correo-invalido" },
    });
    fireEvent.change(screen.getByPlaceholderText("********"), {
      target: { value: "1234" },
    });
    acceptPrivacy();
    fireEvent.click(screen.getByRole("button", { name: "REGISTRARSE" }));

    expect(
      screen.getByText("El nombre de usuario es obligatorio"),
    ).toBeInTheDocument();
    expect(screen.getByText("Formato de email no válido")).toBeInTheDocument();
    expect(
      screen.getByText("Mínimo 8 caracteres requeridos"),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("traduce errores del backend para usuario o email duplicado", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Email already exists" }),
    } as Response);

    render(
      <RegisterScreen onRegisterSuccess={vi.fn()} onSwitchToLogin={vi.fn()} />,
    );

    fireEvent.change(screen.getByPlaceholderText("Tu nombre..."), {
      target: { value: "daria" },
    });
    fireEvent.change(screen.getByPlaceholderText("Tu correo..."), {
      target: { value: "daria@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("********"), {
      target: { value: "12345678" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repite tu contraseña"), {
      target: { value: "12345678" },
    });
    acceptPrivacy();
    fireEvent.click(screen.getByRole("button", { name: "REGISTRARSE" }));

    expect(await screen.findByText("Este email ya existe")).toBeInTheDocument();
  });

  it("muestra el mensaje de éxito y notifica cuando el registro termina", async () => {
    vi.useFakeTimers();

    const onRegisterSuccess = vi.fn();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ message: "User registered" }),
    } as Response);

    render(
      <RegisterScreen
        onRegisterSuccess={onRegisterSuccess}
        onSwitchToLogin={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Tu nombre..."), {
      target: { value: "daria" },
    });
    fireEvent.change(screen.getByPlaceholderText("Tu correo..."), {
      target: { value: "daria@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("********"), {
      target: { value: "12345678" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repite tu contraseña"), {
      target: { value: "12345678" },
    });
    acceptPrivacy();
    fireEvent.click(screen.getByRole("button", { name: "REGISTRARSE" }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText("¡Registro completado!")).toBeInTheDocument();
    expect(onRegisterSuccess).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("permite volver a login desde el pie del formulario", () => {
    const onSwitchToLogin = vi.fn();

    render(
      <RegisterScreen
        onRegisterSuccess={vi.fn()}
        onSwitchToLogin={onSwitchToLogin}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ya poseo tarjeta de identificación",
      }),
    );

    expect(onSwitchToLogin).toHaveBeenCalledTimes(1);
  });
});
