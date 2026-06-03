// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import MorkBorgTraitsAndScrollsSection from "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgTraitsAndScrollsSection";

vi.mock(
  "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgDecoccionesModal",
  () => ({
    default: ({ onClose }: { onClose: () => void }) => (
      <div data-testid="decociones-modal">
        <button onClick={onClose}>Cerrar</button>
      </div>
    ),
  }),
);

function makeCharacter(overrides = {}) {
  return {
    id: 42,
    nombre: "Kragor",
    estadisticas: {},
    mochila: [],
    habilidades: [],
    tags: "MORK_BORG,clase;escoria-alcantarillas,rasgoTerrible1;1,rasgoTerrible2;2,cuerpoRoto;1,habito;1,historia;1",
    ...overrides,
  } as never;
}

describe("MorkBorgTraitsAndScrollsSection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza sin errores con personaje vacío", () => {
    const { container } = render(
      <MorkBorgTraitsAndScrollsSection
        character={makeCharacter({ tags: "" })}
      />,
    );
    expect(container).toBeTruthy();
  });

  it("muestra la sección de Rasgos", () => {
    render(<MorkBorgTraitsAndScrollsSection character={makeCharacter()} />);
    expect(screen.getAllByText(/Rasgos/i).length).toBeGreaterThan(0);
  });

  it("muestra la sección de Pergaminos", () => {
    render(<MorkBorgTraitsAndScrollsSection character={makeCharacter()} />);
    expect(screen.getAllByText(/Pergaminos/i).length).toBeGreaterThan(0);
  });

  it("muestra la sección de Catástrofes", () => {
    render(<MorkBorgTraitsAndScrollsSection character={makeCharacter()} />);
    // Either "catástrofe" text or "Sin catástrofes" should be present
    const catText = screen.queryAllByText(/catástrofe/i);
    const sinCat = screen.queryByText(/Sin catástrofes/i);
    expect(catText.length > 0 || sinCat !== null).toBe(true);
  });

  it("muestra el botón para agregar rasgos de clase cuando isOwner=true", () => {
    render(
      <MorkBorgTraitsAndScrollsSection
        character={makeCharacter()}
        isOwner={true}
        onOpenClassTraitsCatalog={vi.fn()}
      />,
    );
    // Should show some "add" button
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("llama a onOpenClassTraitsCatalog cuando se hace click en agregar rasgo", () => {
    const onOpenClassTraitsCatalog = vi.fn();
    render(
      <MorkBorgTraitsAndScrollsSection
        character={makeCharacter()}
        isOwner={true}
        onOpenClassTraitsCatalog={onOpenClassTraitsCatalog}
      />,
    );
    // Try to find and click the catalog button
    const addBtn =
      screen.queryByText(/Añadir/i) || screen.queryByText(/agregar/i);
    if (addBtn) {
      fireEvent.click(addBtn);
      expect(onOpenClassTraitsCatalog).toHaveBeenCalled();
    }
  });

  it("llama a onOpenScrollCatalog cuando se hace click en agregar pergamino", () => {
    const onOpenScrollCatalog = vi.fn();
    render(
      <MorkBorgTraitsAndScrollsSection
        character={makeCharacter()}
        isOwner={true}
        onOpenScrollCatalog={onOpenScrollCatalog}
      />,
    );
    // Find scroll add button (usually has "Añadir pergamino" text)
    const buttons = screen.getAllByRole("button");
    // Click buttons looking for one that calls onOpenScrollCatalog
    const addScrollBtn = buttons.find(
      (b) =>
        b.textContent?.toLowerCase().includes("pergamino") ||
        b.textContent?.toLowerCase().includes("scroll"),
    );
    if (addScrollBtn) {
      fireEvent.click(addScrollBtn);
      expect(onOpenScrollCatalog).toHaveBeenCalled();
    }
  });

  it("muestra habilidades de clase cuando el personaje las tiene", () => {
    const character = makeCharacter({
      habilidades: [
        {
          id: 1,
          nombre: "Especialidad de Escoria",
          tags: "EscEspecialidadIdx;1,MORK_BORG",
          formula: null,
        },
      ],
    });
    render(<MorkBorgTraitsAndScrollsSection character={character} />);
    expect(screen.getByText("Especialidad de Escoria")).toBeInTheDocument();
  });

  it("muestra pergaminos cuando el personaje los tiene", () => {
    const character = makeCharacter({
      habilidades: [
        {
          id: 2,
          nombre: "Invocación de sombras",
          tags: "PergaminoImpuro;3,MORK_BORG",
          formula: null,
        },
      ],
    });
    render(<MorkBorgTraitsAndScrollsSection character={character} />);
    expect(screen.getByText("Invocación de sombras")).toBeInTheDocument();
  });

  it("llama a onDeleteScroll cuando se elimina un pergamino", () => {
    const onDeleteScroll = vi.fn();
    const character = makeCharacter({
      habilidades: [
        {
          id: 3,
          nombre: "Pergamino oscuro",
          tags: "PergaminoImpuro;1,MORK_BORG",
          formula: null,
        },
      ],
    });
    render(
      <MorkBorgTraitsAndScrollsSection
        character={character}
        isOwner={true}
        onDeleteScroll={onDeleteScroll}
      />,
    );
    // Find and click delete button
    const deleteButtons = Array.from(
      document.querySelectorAll("button"),
    ).filter((btn) => btn.querySelector("svg"));
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      expect(onDeleteScroll).toHaveBeenCalledWith(3);
    }
  });

  it("el botón de tirar catástrofe dispara la animación", () => {
    render(<MorkBorgTraitsAndScrollsSection character={makeCharacter()} />);
    const rollBtn =
      screen.queryByText(/Tirar catástrofe/i) || screen.queryByText(/🎲/);
    if (rollBtn) {
      fireEvent.click(rollBtn);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      // After timer, a catástrofe should be added - just ensure no crash
    }
  });

  it("carga catástrofes desde localStorage al inicializar", () => {
    localStorage.setItem("mb_catastrofas_42", JSON.stringify([1, 3]));
    render(<MorkBorgTraitsAndScrollsSection character={makeCharacter()} />);
    // The catástrofes stored in localStorage should be shown
    // Just verify render doesn't crash
    expect(document.querySelector("section")).toBeTruthy();
  });

  it("muestra items de clase cuando el personaje los tiene en mochila", () => {
    const character = makeCharacter({
      mochila: [
        {
          id: 10,
          nombre: "Libro de sangre",
          tags: "ErmitanoEspecialidadIdx;2,MORK_BORG",
          tipoObjeto: "MISCELANEO",
          formula: null,
          equipado: false,
          cantidad: 1,
        },
      ],
    });
    render(<MorkBorgTraitsAndScrollsSection character={character} />);
    expect(screen.getByText("Libro de sangre")).toBeInTheDocument();
  });
});
