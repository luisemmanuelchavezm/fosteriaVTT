// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  fetchSpellCatalog: vi.fn().mockResolvedValue([]),
}));

import SpellCatalogModal from "../../../screens/personaje/dndcharactersheet/components/SpellCatalogModal";
import * as dndApi from "../../../screens/personaje/utils/dndApi";
import type { CharacterAbilityResponse } from "../../../screens/personaje/utils/dndApi";

const SAMPLE_SPELL: CharacterAbilityResponse = {
  id: 1,
  nombre: "Bola de fuego",
  formula: "8d6",
  descripcion: "Lanza una bola de fuego.",
  bonificacion: null,
  tags: "hechizo;3", // Level 3 spell — getSpellLevel reads tags field
};

const DEFAULT_PROPS = {
  token: "test-token",
  isOpen: true,
  onClose: vi.fn(),
  onAddSpell: vi.fn().mockResolvedValue(undefined),
};

describe("SpellCatalogModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dndApi.fetchSpellCatalog).mockResolvedValue([]);
  });

  // ── Visibility ────────────────────────────────────────────────────────────

  it("renders null when isOpen is false", () => {
    const { container } = render(
      <SpellCatalogModal {...DEFAULT_PROPS} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders title 'Añadir hechizos' when open", () => {
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Añadir hechizos")).toBeInTheDocument();
  });

  it("renders 'Hechizos' subtitle", () => {
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Hechizos")).toBeInTheDocument();
  });

  // ── Search & filters ──────────────────────────────────────────────────────

  it("renders search input with placeholder 'Filtrar por nombre'", () => {
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    expect(
      screen.getByPlaceholderText("Filtrar por nombre"),
    ).toBeInTheDocument();
  });

  it("renders 'Filtros avanzados' toggle button", () => {
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Filtros avanzados")).toBeInTheDocument();
  });

  it("shows advanced filters when 'Filtros avanzados' is clicked", () => {
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    expect(screen.queryByText("Todos los niveles")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Filtros avanzados"));
    expect(screen.getByText("Todos los niveles")).toBeInTheDocument();
    expect(screen.getByText("Todas las clases")).toBeInTheDocument();
  });

  it("renders level filter options when advanced filters open", () => {
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText("Filtros avanzados"));
    expect(screen.getByRole("option", { name: "Truco" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Nivel 1" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Nivel 9" })).toBeInTheDocument();
  });

  it("renders class filter options when advanced filters open", () => {
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText("Filtros avanzados"));
    expect(screen.getByRole("option", { name: "Mago" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Bardo" })).toBeInTheDocument();
  });

  // ── Close button ──────────────────────────────────────────────────────────

  it("calls onClose when × button is clicked", () => {
    const onClose = vi.fn();
    render(<SpellCatalogModal {...DEFAULT_PROPS} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Cerrar modal de hechizos"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── Catalog fetch ─────────────────────────────────────────────────────────

  it("calls fetchSpellCatalog when open", async () => {
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(
      () => expect(vi.mocked(dndApi.fetchSpellCatalog)).toHaveBeenCalled(),
      { timeout: 2000 },
    );
  });

  it("shows spell items after fetch resolves", async () => {
    vi.mocked(dndApi.fetchSpellCatalog).mockResolvedValueOnce([SAMPLE_SPELL]);
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(
      () => expect(screen.getByText("Bola de fuego")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("shows spell formula when available", async () => {
    vi.mocked(dndApi.fetchSpellCatalog).mockResolvedValueOnce([SAMPLE_SPELL]);
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => expect(screen.getByText("8d6")).toBeInTheDocument(), {
      timeout: 2000,
    });
  });

  it("shows spell description", async () => {
    vi.mocked(dndApi.fetchSpellCatalog).mockResolvedValueOnce([SAMPLE_SPELL]);
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(
      () =>
        expect(
          screen.getByText("Lanza una bola de fuego."),
        ).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("shows spell level", async () => {
    vi.mocked(dndApi.fetchSpellCatalog).mockResolvedValueOnce([SAMPLE_SPELL]);
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(
      () => expect(screen.getByText("Nivel 3")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("shows 'Truco' label for level 0 spells", async () => {
    const cantrip = {
      ...SAMPLE_SPELL,
      tags: "truco",
      id: 2,
      nombre: "Taumaturgia",
    };
    vi.mocked(dndApi.fetchSpellCatalog).mockResolvedValueOnce([cantrip]);
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(() => expect(screen.getByText("Truco")).toBeInTheDocument(), {
      timeout: 2000,
    });
  });

  it("shows 'Sin descripción.' when spell has no description", async () => {
    const spellNoDesc = { ...SAMPLE_SPELL, descripcion: null, id: 3 };
    vi.mocked(dndApi.fetchSpellCatalog).mockResolvedValueOnce([spellNoDesc]);
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(
      () => expect(screen.getByText("Sin descripción.")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("shows empty state when fetch returns empty array", () => {
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    expect(
      screen.getByText(
        "No hay hechizos o trucos que coincidan con el filtro actual.",
      ),
    ).toBeInTheDocument();
  });

  it("shows error message when fetch fails", async () => {
    vi.mocked(dndApi.fetchSpellCatalog).mockRejectedValueOnce(
      new Error("Error de red"),
    );
    render(<SpellCatalogModal {...DEFAULT_PROPS} />);
    await waitFor(
      () => expect(screen.getByText("Error de red")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  // ── Add spell ─────────────────────────────────────────────────────────────

  it("calls onAddSpell with spell id when Añadir is clicked", async () => {
    const onAddSpell = vi.fn().mockResolvedValue(undefined);
    vi.mocked(dndApi.fetchSpellCatalog).mockResolvedValueOnce([SAMPLE_SPELL]);
    render(<SpellCatalogModal {...DEFAULT_PROPS} onAddSpell={onAddSpell} />);
    await waitFor(
      () => expect(screen.getByText("Bola de fuego")).toBeInTheDocument(),
      { timeout: 2000 },
    );
    fireEvent.click(screen.getByText("Añadir"));
    await waitFor(() => expect(onAddSpell).toHaveBeenCalledWith(1));
  });

  it("closes modal after successfully adding a spell", async () => {
    const onClose = vi.fn();
    const onAddSpell = vi.fn().mockResolvedValue(undefined);
    // Use a spell with a unique id to avoid mock bleed
    const spell2 = { ...SAMPLE_SPELL, id: 10, nombre: "Escudo Mágico" };
    vi.mocked(dndApi.fetchSpellCatalog).mockResolvedValueOnce([spell2]);
    render(
      <SpellCatalogModal
        {...DEFAULT_PROPS}
        onClose={onClose}
        onAddSpell={onAddSpell}
      />,
    );
    await waitFor(
      () => expect(screen.getByText("Escudo Mágico")).toBeInTheDocument(),
      { timeout: 2000 },
    );
    fireEvent.click(screen.getByText("Añadir"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows error when onAddSpell fails", async () => {
    const onAddSpell = vi
      .fn()
      .mockRejectedValueOnce(new Error("Hechizo ya conocido"));
    const spell3 = { ...SAMPLE_SPELL, id: 20, nombre: "Rayo" };
    vi.mocked(dndApi.fetchSpellCatalog).mockResolvedValueOnce([spell3]);
    render(<SpellCatalogModal {...DEFAULT_PROPS} onAddSpell={onAddSpell} />);
    await waitFor(() => expect(screen.getByText("Rayo")).toBeInTheDocument(), {
      timeout: 2000,
    });
    fireEvent.click(screen.getByText("Añadir"));
    await waitFor(() =>
      expect(screen.getByText("Hechizo ya conocido")).toBeInTheDocument(),
    );
  });
});
