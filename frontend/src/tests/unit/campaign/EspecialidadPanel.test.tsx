// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import EspecialidadPanel from "../../../screens/campaign/components/quickactions/EspecialidadPanel";

afterEach(() => cleanup());

const BASE_DETAIL = {
  id: 1,
  nombre: "Goblin",
  sistema: "MORK_BORG",
  tags: "",
  habilidades: [],
  biografia: null,
  stats: {},
  nivel: null,
  tipo: null,
  descripcion: null,
};

describe("EspecialidadPanel", () => {
  it("renderiza el título Especialidad", () => {
    render(<EspecialidadPanel detail={null} isLoadingDetail={false} />);
    const matches = screen.queryAllByText(/especialidad/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("muestra cargando cuando isLoadingDetail es true", () => {
    render(<EspecialidadPanel detail={null} isLoadingDetail={true} />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it("muestra sin especialidad cuando detail es null y no está cargando", () => {
    render(<EspecialidadPanel detail={null} isLoadingDetail={false} />);
    expect(screen.getByText(/sin especialidad/i)).toBeInTheDocument();
  });

  it("muestra sin especialidad cuando no hay rasgos especiales", () => {
    render(
      <EspecialidadPanel
        detail={BASE_DETAIL as never}
        isLoadingDetail={false}
      />,
    );
    expect(screen.getByText(/sin especialidad/i)).toBeInTheDocument();
  });

  it("muestra especialidad estática cuando existe", () => {
    const detail = {
      ...BASE_DETAIL,
      habilidades: [
        {
          id: 1,
          nombre: "Especial",
          descripcion: "Puede volar",
          tags: "MBEnemyEspecial",
        },
      ],
    };
    render(
      <EspecialidadPanel detail={detail as never} isLoadingDetail={false} />,
    );
    expect(screen.getByText("Puede volar")).toBeInTheDocument();
  });

  it("muestra template cuando hay rasgos aleatorios sin instancia", () => {
    const bio = JSON.stringify({
      rasgosAleatorios: [
        {
          tagKey: "especial_algo",
          nombre: "Habilidad especial",
          opciones: ["Veneno", "Fuego", "Hielo"],
        },
      ],
    });
    const detail = {
      ...BASE_DETAIL,
      tags: "MBRasgosAleatorios",
      biografia: bio,
    };
    render(
      <EspecialidadPanel detail={detail as never} isLoadingDetail={false} />,
    );
    expect(document.body.textContent).toContain("Veneno");
  });
});
