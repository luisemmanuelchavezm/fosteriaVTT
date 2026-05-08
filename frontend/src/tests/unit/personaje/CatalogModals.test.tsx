// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dndApiMocks = vi.hoisted(() => ({
  fetchObjectCatalog: vi.fn(),
  fetchSpellCatalog: vi.fn(),
}));

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  ...dndApiMocks,
}));

import InventoryCatalogModal from "../../../screens/personaje/dndcharactersheet/components/InventoryCatalogModal";
import SpellCatalogModal from "../../../screens/personaje/dndcharactersheet/components/SpellCatalogModal";

beforeEach(() => {
  dndApiMocks.fetchObjectCatalog.mockResolvedValue([]);
  dndApiMocks.fetchSpellCatalog.mockResolvedValue([]);
});

describe("InventoryCatalogModal", () => {
  it("no renderiza nada cuando isOpen es false", () => {
    render(
      <InventoryCatalogModal
        token="tok"
        isOpen={false}
        onClose={vi.fn()}
        onAddItem={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renderiza el modal cuando isOpen es true", () => {
    render(
      <InventoryCatalogModal
        token="tok"
        isOpen={true}
        onClose={vi.fn()}
        onAddItem={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });
});

describe("SpellCatalogModal", () => {
  it("no renderiza nada cuando isOpen es false", () => {
    render(
      <SpellCatalogModal
        token="tok"
        isOpen={false}
        onClose={vi.fn()}
        onAddSpell={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renderiza el modal cuando isOpen es true", () => {
    render(
      <SpellCatalogModal
        token="tok"
        isOpen={true}
        onClose={vi.fn()}
        onAddSpell={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });
});
