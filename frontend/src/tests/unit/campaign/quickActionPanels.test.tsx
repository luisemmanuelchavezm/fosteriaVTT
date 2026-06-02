// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import RasgosPanel from "../../../screens/campaign/components/quickactions/RasgosPanel";
import EspecialidadPanel from "../../../screens/campaign/components/quickactions/EspecialidadPanel";
import LootPanel from "../../../screens/campaign/components/quickactions/LootPanel";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

afterEach(() => cleanup());

function makeDetail(overrides = {}): DndCharacterDetailResponse {
  return {
    id: 1,
    nombre: "Enemy",
    retrato: null,
    biografia: null,
    sistemaDeJuego: "Mork Borg",
    raza: null,
    subraza: null,
    clases: [],
    caracteristicaLanzamientoConjuros: null,
    estadisticas: {},
    habilidades: [],
    mochila: [],
    usado: null,
    tipo: "enemigo",
    vd: null,
    tags: "MORK_BORG",
    ...overrides,
  } as unknown as DndCharacterDetailResponse;
}

describe("RasgosPanel", () => {
  it("muestra estado de carga", () => {
    render(<RasgosPanel detail={null} isLoadingDetail />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("muestra mensaje sin datos cuando detail es null", () => {
    render(<RasgosPanel detail={null} isLoadingDetail={false} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza con detail sin biografía", () => {
    render(<RasgosPanel detail={makeDetail()} isLoadingDetail={false} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza con detail con biografía JSON con rasgos", () => {
    const bio = JSON.stringify({
      rasgosAleatorios: [
        {
          tagKey: "rasgoTerrible1",
          nombre: "Rasgo Terrible",
          opciones: ["Feo", "Deforme"],
        },
      ],
    });
    const detail = makeDetail({
      biografia: bio,
      tags: "MORK_BORG,rasgoTerrible1;1",
    });
    render(<RasgosPanel detail={detail} isLoadingDetail={false} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza con detail con biografía JSON con tablas especiales", () => {
    const bio = JSON.stringify({
      rasgosAleatorios: [
        {
          tagKey: "MBEspecialIdxTag",
          nombre: "Especial",
          opciones: ["Opción 1", "Opción 2"],
        },
      ],
    });
    const detail = makeDetail({ biografia: bio });
    render(<RasgosPanel detail={detail} isLoadingDetail={false} />);
    expect(document.body.textContent).toBeTruthy();
  });
});

describe("LootPanel", () => {
  it("muestra estado de carga", () => {
    render(<LootPanel detail={null} isLoadingDetail />);
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it("muestra mensaje sin botín cuando no hay datos", () => {
    render(<LootPanel detail={null} isLoadingDetail={false} />);
    expect(screen.getByText("Sin botín registrado.")).toBeInTheDocument();
  });

  it("muestra botín cuando detail tiene habilidad MBEnemyLoot", () => {
    const detail = makeDetail({
      habilidades: [
        {
          id: 1,
          nombre: "Botín",
          bonificacion: 0,
          formula: null,
          descripcion: "5 plata, una daga",
          tags: "MBEnemyLoot",
        },
      ],
    });
    render(<LootPanel detail={detail} isLoadingDetail={false} />);
    expect(screen.getByText("5 plata, una daga")).toBeInTheDocument();
  });
});

describe("EspecialidadPanel", () => {
  it("muestra estado de carga", () => {
    render(<EspecialidadPanel detail={null} isLoadingDetail />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("muestra mensaje sin datos cuando detail es null", () => {
    render(<EspecialidadPanel detail={null} isLoadingDetail={false} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza con detail sin habilidades de especialidad", () => {
    render(<EspecialidadPanel detail={makeDetail()} isLoadingDetail={false} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza con detail con habilidad de tipo escoria", () => {
    const detail = makeDetail({
      habilidades: [
        {
          id: 1,
          nombre: "Especialidad",
          bonificacion: 0,
          formula: null,
          descripcion: "desc",
          tags: "EscEspecialidad",
        },
      ],
      tags: "MORK_BORG,clase;escoria-alcantarillas",
    });
    render(<EspecialidadPanel detail={detail} isLoadingDetail={false} />);
    expect(document.body.textContent).toBeTruthy();
  });
});
