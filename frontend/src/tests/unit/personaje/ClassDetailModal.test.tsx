import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import ClassDetailModal from "../../../screens/personaje/creatednd/components/ClassDetailModal";

function buildProps(
  overrides: Partial<ComponentProps<typeof ClassDetailModal>> = {},
) {
  return {
    previewClass: {
      id: "explorador",
      nombre: "Explorador",
      insignia: "Ex",
    } as never,
    previewClassDetail: null,
    classSkills: [],
    isOpen: true,
    isLoadingPreviewClassDetail: false,
    previewClassDetailError: null,
    isLoadingClassSkills: false,
    classSkillsError: null,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    ...overrides,
  };
}

describe("creacion de personaje - ClassDetailModal", () => {
  it("no renderiza cuando esta cerrado o no hay clase", () => {
    const { rerender } = render(
      <ClassDetailModal {...buildProps({ isOpen: false })} />,
    );
    expect(screen.queryByText("Clase seleccionada")).not.toBeInTheDocument();

    rerender(<ClassDetailModal {...buildProps({ previewClass: null })} />);
    expect(screen.queryByText("Clase seleccionada")).not.toBeInTheDocument();
  });

  it("muestra estados de carga y error", () => {
    render(
      <ClassDetailModal
        {...buildProps({
          isLoadingPreviewClassDetail: true,
          isLoadingClassSkills: true,
        })}
      />,
    );

    expect(
      screen.getByText("Cargando información de clase..."),
    ).toBeInTheDocument();
    expect(screen.getByText("Cargando habilidades...")).toBeInTheDocument();
    expect(
      screen.getByText("Cargando equipamiento inicial..."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar" })).toBeDisabled();
  });

  it("renderiza detalle completo y permite seleccionar/cerrar", () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <ClassDetailModal
        {...buildProps({
          onClose,
          onSelect,
          previewClassDetail: {
            descripcion: "Acechador de fronteras.",
            puntosGolpe: {
              dadoGolpe: "1d10",
              primerNivel: "10 + CON",
              nivelesSuperiores: "1d10 + CON",
            },
            competencias: {
              armaduras: ["Ligeras"],
              armas: ["Simples"],
              herramientas: [],
              salvaciones: ["Fuerza", "Destreza"],
              habilidades: ["Naturaleza"],
            },
            subclases: [
              {
                id: "cazador",
                nombre: "Cazador",
                descripcion: "Especialista contra presas.",
                nivelDesbloqueo: 3,
                tablas: [],
              },
            ],
            equipamiento: {
              fijos: [
                {
                  id: 1,
                  etiqueta: "Espada corta",
                  cantidad: 1,
                  objeto: {
                    id: 2,
                    nombre: "Espada corta",
                    formula: "1d6",
                    indice: "ASCuerpo,Ligera",
                    descripcion: "",
                    tipoObjeto: "ARMA",
                    cantidad: 1,
                  },
                  catalogo: null,
                  opcionesCatalogo: [],
                },
              ],
              gruposEleccion: [
                {
                  id: "armas",
                  etiqueta: "Armas",
                  opciones: [
                    {
                      id: "a",
                      etiqueta: "Dos armas simples cuerpo a cuerpo",
                      cantidad: 2,
                      objeto: null,
                      catalogo: "ASCuerpo",
                      opcionesCatalogo: [],
                    },
                  ],
                },
              ],
            },
          } as never,
          classSkills: [
            {
              nivel: 1,
              habilidades: [
                {
                  id: 90,
                  nombre: "Enemigo predilecto",
                  formula: null,
                  descripcion: "Obtienes ventaja para rastrear.",
                  tags: null,
                },
              ],
            },
          ],
        })}
      />,
    );

    expect(
      screen.getByText("Información básica de Explorador"),
    ).toBeInTheDocument();
    expect(screen.getByText("Acechador de fronteras.")).toBeInTheDocument();
    expect(screen.getByText("Subclases de Explorador")).toBeInTheDocument();
    expect(screen.getByText("Cazador")).toBeInTheDocument();
    expect(screen.getByText("Nivel 1")).toBeInTheDocument();
    expect(screen.getByText("Daño: 1d6")).toBeInTheDocument();
    expect(
      screen.getByText("Armas: Dos armas simples cuerpo a cuerpo"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Seleccionar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    fireEvent.click(screen.getByLabelText("Cerrar modal de clase"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
