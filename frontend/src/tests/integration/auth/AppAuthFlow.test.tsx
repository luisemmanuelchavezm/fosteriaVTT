// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "../../../App";

vi.mock("../../../screens/LoginScreen", () => ({
  default: ({
    onLoginSuccess,
    onSwitchToRegister,
  }: {
    onLoginSuccess: (token: string, username: string) => void;
    onSwitchToRegister: () => void;
  }) => (
    <div>
      <button onClick={() => onLoginSuccess("jwt-token", "Aria")}>login</button>
      <button onClick={onSwitchToRegister}>ir a registro</button>
    </div>
  ),
}));

vi.mock("../../../screens/RegisterScreen", () => ({
  default: ({
    onRegisterSuccess,
    onSwitchToLogin,
  }: {
    onRegisterSuccess: () => void;
    onSwitchToLogin: () => void;
  }) => (
    <div>
      <button onClick={onRegisterSuccess}>registro ok</button>
      <button onClick={onSwitchToLogin}>volver a login</button>
    </div>
  ),
}));

vi.mock("../../../screens/HomeScreen", () => ({
  default: ({
    username,
    onLogout,
  }: {
    username: string;
    onLogout: () => void;
  }) => (
    <div>
      <p>home {username}</p>
      <button onClick={onLogout}>logout</button>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("App auth flow", () => {
  it("permite pasar de login a registro y volver a login", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "ir a registro" }));
    expect(
      screen.getByRole("button", { name: "registro ok" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "volver a login" }));
    expect(screen.getByRole("button", { name: "login" })).toBeInTheDocument();
  });

  it("guarda usuario, entra en home y permite cerrar sesión", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "login" }));
    expect(localStorage.getItem("username")).toBe("Aria");
    expect(screen.getByText("home Aria")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "logout" }));
    expect(screen.getByRole("button", { name: "login" })).toBeInTheDocument();
    expect(localStorage.getItem("jwtToken")).toBeNull();
  });
});
