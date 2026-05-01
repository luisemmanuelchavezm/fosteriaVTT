// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RaceSelectionSection from "../../../screens/personaje/creatednd/sections/RaceSelectionSection";

vi.mock("../../../lib/api", () => ({
  buildApiUrl: (path: string) => path,
}));

const raceSummaries = [{ id: "elf", nombre: "Elfo" }];

const raceDetail = {
  id: "elf",
  nombre: "Elfo",
  descripcion: "Gráciles y longevos.",
  tamano: "Mediano",
  velocidad: 30,
  idiomas: ["Común", "Élfico", "1 idioma a elección"],
  aumentoCaracteristicas: ["Destreza +2", "+1 a una puntuación a elección"],
  competencias: ["habilidad: Percepción", "Herramienta a elegir"],
  rasgos: [
    {
      titulo: "Magia feérica",
      descripcion: "Conoces un truco racial.",
    },
  ],
  elecciones: [
    {
      id: "race-language",
      etiqueta: "Idioma extra",
      resumen: "Elige un idioma",
      catalogo: "idiomas",
      cantidad: 1,
      opciones: ["Dracónico", "Enano"],
      excluirOpciones: [],
    },
    {
      id: "race-ability",
      etiqueta: "Aumento flexible",
      resumen: "Elige una característica",
      catalogo: "puntuacionescaracteristica",
      cantidad: 1,
      opciones: ["Inteligencia", "Sabiduría"],
      excluirOpciones: [],
    },
    {
      id: "race-skill",
      etiqueta: "Competencia adicional",
      resumen: "Elige una habilidad",
      catalogo: "habilidades",
      cantidad: 1,
      opciones: ["Arcano", "Historia"],
      excluirOpciones: [],
    },
    {
      id: "race-spell",
      etiqueta: "Truco racial",
      resumen: "Elige un truco",
      catalogo: "trucosdemago",
      cantidad: 1,
      opciones: ["Luz", "Mano de mago"],
      excluirOpciones: [],
      adjuntarATitulo: "Magia feérica",
    },
  ],
  subrazas: [
    {
      id: "high-elf",
      nombre: "Alto elfo",
      descripcion: "Afinidad con la magia.",
      aumentoCaracteristicas: ["Inteligencia +1"],
      competencias: ["habilidad: Arcano", "Instrumento a elegir"],
      rasgos: [
        {
          titulo: "Entrenamiento extra",
          descripcion: "Aprendes una disciplina adicional.",
        },
      ],
      elecciones: [
        {
          id: "subrace-choice",
          etiqueta: "Competencia de subraza",
          resumen: "Elige una herramienta",
          catalogo: "instrumentos",
          cantidad: 1,
          opciones: ["Laúd", "Flauta"],
          excluirOpciones: [],
        },
      ],
    },
  ],
} as never;

function createFetchResponse(data: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(data),
  } as never;
}

describe("creacion de personaje - RaceSelectionSection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sin token muestra el error de autenticación y no intenta cargar razas", async () => {
    render(
      <RaceSelectionSection fieldErrors={{ race: "Campo obligatorio" }} />,
    );

    expect(
      screen.getByText(/Selecciona una raza en el desplegable/i),
    ).toBeInTheDocument();

    expect(
      await screen.findByText("No se pudo autenticar la carga de razas."),
    ).toBeInTheDocument();
    expect(screen.getByText("Campo obligatorio")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("muestra el error al cargar el detalle de la raza cuando la petición falla", async () => {
    localStorage.setItem("jwtToken", "jwt-token");
    vi.mocked(fetch)
      .mockResolvedValueOnce(createFetchResponse(raceSummaries))
      .mockResolvedValueOnce(createFetchResponse({}, false));

    render(<RaceSelectionSection />);

    await screen.findByRole("option", { name: "Elfo" });
    fireEvent.change(screen.getByLabelText("Selecciona una raza"), {
      target: { value: "elf" },
    });

    expect(
      await screen.findByText("No se pudo cargar la información de la raza."),
    ).toBeInTheDocument();
  });

  it("carga raza y subraza y propaga las elecciones resueltas", async () => {
    localStorage.setItem("jwtToken", "jwt-token");
    vi.mocked(fetch)
      .mockResolvedValueOnce(createFetchResponse(raceSummaries))
      .mockResolvedValueOnce(createFetchResponse(raceDetail));

    const onSelectionChange = vi.fn();
    const onSpellInfoRequest = vi.fn();

    render(
      <RaceSelectionSection
        onSelectionChange={onSelectionChange}
        onSpellInfoRequest={onSpellInfoRequest}
        fieldErrors={{ "race-language-0": "Elige un idioma" }}
      />,
    );

    await screen.findByRole("option", { name: "Elfo" });
    fireEvent.change(screen.getByLabelText("Selecciona una raza"), {
      target: { value: "elf" },
    });

    await screen.findByRole("heading", { name: "Elfo" });

    expect(screen.getByText("Gráciles y longevos.")).toBeInTheDocument();
    expect(screen.getByText("Destreza +2")).toBeInTheDocument();
    expect(screen.getByText("Percepción")).toBeInTheDocument();
    expect(screen.getByText("Elige un idioma")).toBeInTheDocument();

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "Dracónico" } });
    fireEvent.change(selects[2], { target: { value: "Inteligencia" } });
    fireEvent.change(selects[3], { target: { value: "Arcano" } });
    fireEvent.change(selects[4], { target: { value: "Luz" } });

    fireEvent.change(screen.getByLabelText("Subraza"), {
      target: { value: "high-elf" },
    });

    await screen.findByRole("heading", { name: "Alto elfo" });

    const updatedSelects = screen.getAllByRole("combobox");
    fireEvent.change(updatedSelects[6], { target: { value: "Laúd" } });

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          selectedRaceId: "elf",
          selectedSubraceId: "high-elf",
          selectedChoices: expect.any(Object),
        }),
      );
    });

    expect(screen.getByText("Rasgos de subraza")).toBeInTheDocument();
  });
});
