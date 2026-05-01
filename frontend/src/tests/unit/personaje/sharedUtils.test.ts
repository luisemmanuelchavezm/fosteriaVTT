import { describe, expect, it } from "vitest";
import {
  normalizeCompetencyValue,
  inferToolCategory,
} from "../../../screens/personaje/dndcharactersheet/components/detailTabs/sharedUtils";

describe("normalizeCompetencyValue", () => {
  it("lowercases and removes accents", () => {
    expect(normalizeCompetencyValue("Armas Simples")).toBe("armassimples");
    expect(normalizeCompetencyValue("Protección")).toBe("proteccion");
    expect(normalizeCompetencyValue("Espada larga")).toBe("espadalarga");
  });

  it("removes non-alphanumeric characters", () => {
    expect(normalizeCompetencyValue("Juego de manos")).toBe("juegodemanos");
  });
});

describe("inferToolCategory", () => {
  it("identifies instruments", () => {
    expect(inferToolCategory("Instrumento de cuerda")).toBe("instrumentos");
    expect(inferToolCategory("Laúd")).toBe("instrumentos");
    expect(inferToolCategory("Flauta de caña")).toBe("instrumentos");
    expect(inferToolCategory("Tambor")).toBe("instrumentos");
    expect(inferToolCategory("Viola")).toBe("instrumentos");
    expect(inferToolCategory("Flauta dulce")).toBe("instrumentos");
    expect(inferToolCategory("Cornamusa")).toBe("instrumentos");
  });

  it("identifies games", () => {
    expect(inferToolCategory("Juego de dados")).toBe("juegos");
    expect(inferToolCategory("Dados comunes")).toBe("juegos");
    expect(inferToolCategory("Juego de cartas")).toBe("juegos");
    expect(inferToolCategory("Ajedrez tridimensional")).toBe("juegos");
    expect(inferToolCategory("Dragones y mazmorras")).toBe("juegos");
  });

  it("returns otros for unrecognized values", () => {
    expect(inferToolCategory("Herramientas de alquimia")).toBe("otros");
    expect(inferToolCategory("Kit de venenos")).toBe("otros");
    expect(inferToolCategory("Herramientas de zapatero")).toBe("otros");
  });
});
