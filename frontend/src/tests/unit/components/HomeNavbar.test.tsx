// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import HomeNavbar from "../../../components/HomeNavbar";

describe("HomeNavbar", () => {
  afterEach(() => {
    cleanup();
  });

  it("usa onTabChange cuando se proporciona", () => {
    const onTabChange = vi.fn();

    render(<HomeNavbar activeTab="home" onTabChange={onTabChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Ir a Campaña" }));

    expect(onTabChange).toHaveBeenCalledWith("campaigns");
  });

  it("gestiona el tab activo internamente si no hay callback", () => {
    render(<HomeNavbar activeTab="home" />);

    const charactersButton = screen.getByRole("button", {
      name: "Ir a Personajes",
    });
    fireEvent.click(charactersButton);

    expect(charactersButton).toHaveAttribute("aria-pressed", "true");
  });
});
