import { describe, expect, it } from "vitest";
import { computeRaceAbilityBonuses } from "../../../screens/personaje/creatednd/utils/raceBonuses";
import type { RaceSelectionSnapshot } from "../../../screens/personaje/types";

describe("raceBonuses", () => {
  it("combina bonos fijos y elecciones de raza y subraza", () => {
    const selection: RaceSelectionSnapshot = {
      selectedRaceId: "half-elf",
      selectedRace: {
        id: "half-elf",
        nombre: "Semielfo",
        descripcion: "",
        aumentoCaracteristicas: ["+2 Carisma"],
        edad: "",
        tamano: "Mediano",
        velocidad: 30,
        idiomas: ["Comun", "Elfico"],
        competencias: [],
        rasgos: [],
        elecciones: [
          {
            id: "race-asi",
            etiqueta: "Bonos",
            resumen: "+1 a dos puntuaciones",
            catalogo: "puntuacionesCaracteristica",
            cantidad: 2,
            adjuntarATitulo: null,
            opciones: ["Fuerza", "Destreza", "Sabiduria"],
            excluirOpciones: [],
          },
        ],
        subrazas: [],
      },
      selectedSubraceId: "",
      selectedSubrace: {
        id: "custom-subrace",
        nombre: "Linaje mixto",
        descripcion: "",
        aumentoCaracteristicas: ["+1 Inteligencia"],
        competencias: [],
        rasgos: [],
        elecciones: [
          {
            id: "subrace-asi",
            etiqueta: "Bono",
            resumen: "+1 a una puntuación",
            catalogo: "puntuacionesCaracteristica",
            cantidad: 1,
            adjuntarATitulo: null,
            opciones: ["Constitucion", "Sabiduria"],
            excluirOpciones: [],
          },
        ],
      },
      selectedChoices: {
        "race-asi": ["Fuerza", "Destreza"],
        "subrace-asi": ["Sabiduria"],
      },
    };

    expect(computeRaceAbilityBonuses(selection)).toEqual({
      bonuses: {
        strength: 1,
        dexterity: 1,
        constitution: 0,
        intelligence: 1,
        wisdom: 1,
        charisma: 2,
      },
      summary: [
        "Fuerza +1",
        "Destreza +1",
        "Inteligencia +1",
        "Sabiduria +1",
        "Carisma +2",
      ],
    });
  });

  it("devuelve bonos vacios cuando no hay raza seleccionada", () => {
    expect(computeRaceAbilityBonuses(null).summary).toEqual([]);
  });
});
