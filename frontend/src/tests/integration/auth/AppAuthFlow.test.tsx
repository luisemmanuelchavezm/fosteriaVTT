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
    onGoCampaigns,
    onGoCharacters,
  }: {
    username: string;
    onLogout: () => void;
    onGoCampaigns: () => void;
    onGoCharacters: () => void;
  }) => (
    <div>
      <p>home {username}</p>
      <button onClick={onLogout}>logout</button>
      <button onClick={onGoCampaigns}>ir campañas</button>
      <button onClick={onGoCharacters}>ir personajes</button>
    </div>
  ),
}));

vi.mock("../../../screens/CampaignsScreen.tsx", () => ({
  default: ({ onGoHome }: { onGoHome: () => void }) => (
    <div>
      <p>campaigns</p>
      <button onClick={onGoHome}>volver home</button>
    </div>
  ),
}));

vi.mock("../../../screens/CharactersScreen", () => ({
  default: ({
    onCreateDndCharacter,
    onOpenDndCharacterSheet,
  }: {
    onCreateDndCharacter: () => void;
    onOpenDndCharacterSheet: (characterId: string) => void;
  }) => (
    <div>
      <p>characters</p>
      <button onClick={onCreateDndCharacter}>crear dnd</button>
      <button onClick={() => onOpenDndCharacterSheet("7")}>abrir hoja</button>
    </div>
  ),
}));

vi.mock("../../../screens/personaje/CreateDndCharacterScreen", () => ({
  default: ({
    onCharacterCreated,
  }: {
    onCharacterCreated: (characterId: string) => void;
  }) => (
    <div>
      <p>create dnd</p>
      <button onClick={() => onCharacterCreated("12")}>personaje creado</button>
    </div>
  ),
}));

vi.mock("../../../screens/personaje/DndCharacterSheetScreen", () => ({
  default: ({
    characterId,
    onGoCharacters,
  }: {
    characterId: string;
    onGoCharacters: () => void;
  }) => (
    <div>
      <p>sheet {characterId}</p>
      <button onClick={onGoCharacters}>volver personajes</button>
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

  it("navega entre campañas, personajes, creación y hoja DnD", () => {
    localStorage.setItem("jwtToken", "jwt-token");
    localStorage.setItem("username", "Aria");
    localStorage.setItem("avatar", "https://avatar.test");

    render(<App />);

    expect(screen.getByText("home Aria")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ir campañas" }));
    expect(screen.getByText("campaigns")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "volver home" }));
    fireEvent.click(screen.getByRole("button", { name: "ir personajes" }));
    expect(screen.getByText("characters")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "crear dnd" }));
    expect(screen.getByText("create dnd")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "personaje creado" }));
    expect(screen.getByText("sheet 12")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "volver personajes" }));
    fireEvent.click(screen.getByRole("button", { name: "abrir hoja" }));
    expect(screen.getByText("sheet 7")).toBeInTheDocument();
  });
});
