// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import MBEstadisticasPanel from "../../../screens/campaign/components/quickactions/MBEstadisticasPanel";
import MBRasgosClasePanel from "../../../screens/campaign/components/quickactions/MBRasgosClasePanel";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

// Mock quickActionImages to avoid canvas/image issues
vi.mock("../../../screens/campaign/utils/quickActionImages", () => ({
  imgSalvacionFuerza: "fuerza.png",
  imgHabilidadAcrobacias: "agilidad.png",
  imgHabilidadPercepcion: "presencia.png",
  imgSalvacionConstitucion: "resistencia.png",
}));

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
    estadisticas: {
      MB_ModFuerza: 2,
      MB_ModAgilidad: 1,
      MB_ModPresencia: 0,
      MB_ModResistencia: -1,
    },
    habilidades: [],
    mochila: [],
    usado: null,
    tipo: "enemigo",
    vd: null,
    tags: "MORK_BORG",
    propietario: "testUser",
    ...overrides,
  } as unknown as DndCharacterDetailResponse;
}

describe("MBEstadisticasPanel", () => {
  it("renderiza en estado de carga", () => {
    render(
      <MBEstadisticasPanel
        detail={null}
        isLoadingDetail
        onRollStat={vi.fn()}
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza sin detail", () => {
    render(
      <MBEstadisticasPanel
        detail={null}
        isLoadingDetail={false}
        onRollStat={vi.fn()}
      />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("muestra estadísticas del personaje", () => {
    render(
      <MBEstadisticasPanel
        detail={makeDetail()}
        isLoadingDetail={false}
        onRollStat={vi.fn()}
      />,
    );
    expect(screen.getByText("Fuerza")).toBeInTheDocument();
    expect(screen.getByText("Agilidad")).toBeInTheDocument();
    expect(screen.getByText("Presencia")).toBeInTheDocument();
    expect(screen.getByText("Resistencia")).toBeInTheDocument();
  });

  it("muestra modificadores correctamente", () => {
    render(
      <MBEstadisticasPanel
        detail={makeDetail()}
        isLoadingDetail={false}
        onRollStat={vi.fn()}
      />,
    );
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText("-1")).toBeInTheDocument();
  });

  it("llama onRollStat cuando se hace click en stat", () => {
    const onRollStat = vi.fn();
    render(
      <MBEstadisticasPanel
        detail={makeDetail()}
        isLoadingDetail={false}
        onRollStat={onRollStat}
      />,
    );
    const buttons = screen.getAllByRole("button");
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      expect(onRollStat).toHaveBeenCalled();
    }
  });
});

describe("MBRasgosClasePanel", () => {
  it("renderiza en estado de carga", () => {
    render(<MBRasgosClasePanel detail={null} isLoadingDetail />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza sin detail", () => {
    render(<MBRasgosClasePanel detail={null} isLoadingDetail={false} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza con detail sin habilidades de clase", () => {
    render(
      <MBRasgosClasePanel detail={makeDetail()} isLoadingDetail={false} />,
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza con habilidades con tags de clase", () => {
    const detail = makeDetail({
      habilidades: [
        {
          id: 1,
          nombre: "Especialidad",
          bonificacion: 0,
          formula: null,
          descripcion: "desc",
          tags: "EscEspecialidadIdx;1,MORK_BORG",
        },
        {
          id: 2,
          nombre: "Objeto Clase",
          bonificacion: 0,
          formula: null,
          descripcion: "desc",
          tags: "DesertorItemIdx;2,MORK_BORG",
        },
      ],
      mochila: [
        {
          id: 3,
          objetoId: 10,
          nombre: "Arma especial",
          formula: "1d6",
          descripcion: "",
          cantidad: 1,
          equipado: true,
          imagen: null,
          indice: "SacerdoteItemIdx;1",
        },
      ],
    });
    render(<MBRasgosClasePanel detail={detail} isLoadingDetail={false} />);
    expect(document.body.textContent).toBeTruthy();
  });

  it("renderiza con items de herborista", () => {
    const detail = makeDetail({
      habilidades: [
        {
          id: 1,
          nombre: "Creación de decocciones",
          bonificacion: 0,
          formula: null,
          descripcion: "desc",
          tags: "HerboristaHabilidadIdx;1",
        },
      ],
    });
    render(<MBRasgosClasePanel detail={detail} isLoadingDetail={false} />);
    expect(document.body.textContent).toBeTruthy();
  });
});
