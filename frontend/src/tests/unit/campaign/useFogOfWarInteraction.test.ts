// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CampaignPositionResponse } from "../../../screens/campaign/types";
import { useFogOfWarInteraction } from "../../../screens/campaign/hooks/useFogOfWarInteraction";

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup(posiciones: CampaignPositionResponse[] = []) {
  const configurarVisionToken = vi.fn();
  const agregarAreasExploradasBatch = vi.fn();

  const { result } = renderHook(() =>
    useFogOfWarInteraction({
      positions: posiciones,
      configurarVisionToken,
      agregarAreasExploradasBatch,
    }),
  );

  return { result, configurarVisionToken, agregarAreasExploradasBatch };
}

// ── Estado inicial ────────────────────────────────────────────────────────────

describe("useFogOfWarInteraction - estado inicial", () => {
  it("nieblaEstado.activa empieza en false", () => {
    const { result } = setup();
    expect(result.current.nieblaEstado.activa).toBe(false);
  });

  it("nieblaEstado.zonasExploradas empieza en false", () => {
    const { result } = setup();
    expect(result.current.nieblaEstado.zonasExploradas).toBe(false);
  });

  it("nieblaEstado.vistaJugador empieza en false", () => {
    const { result } = setup();
    expect(result.current.nieblaEstado.vistaJugador).toBe(false);
  });

  it("nieblaEstado.visionConfigs empieza vacío", () => {
    const { result } = setup();
    expect(result.current.nieblaEstado.visionConfigs).toHaveLength(0);
  });

  it("nieblaEstado.exploredAreas empieza vacío", () => {
    const { result } = setup();
    expect(result.current.nieblaEstado.exploredAreas).toHaveLength(0);
  });

  it("contextMenu empieza en null", () => {
    const { result } = setup();
    expect(result.current.contextMenu).toBeNull();
  });

  it("visionArcTarget empieza en null", () => {
    const { result } = setup();
    expect(result.current.visionArcTarget).toBeNull();
  });

  it("liveRotationRef.current empieza en 0", () => {
    const { result } = setup();
    expect(result.current.liveRotationRef.current).toBe(0);
  });

  it("draggingTokenRef.current empieza en null", () => {
    const { result } = setup();
    expect(result.current.draggingTokenRef.current).toBeNull();
  });

  it("fogLayerRef.current empieza en null", () => {
    const { result } = setup();
    expect(result.current.fogLayerRef.current).toBeNull();
  });

  it("localPathRef.current empieza vacío", () => {
    const { result } = setup();
    expect(result.current.localPathRef.current).toHaveLength(0);
  });

  it("pendingAreasRef.current empieza vacío", () => {
    const { result } = setup();
    expect(result.current.pendingAreasRef.current).toHaveLength(0);
  });

  it("confirmedAreaIdsRef.current empieza vacío", () => {
    const { result } = setup();
    expect(result.current.confirmedAreaIdsRef.current.size).toBe(0);
  });

  it("lastDragCellRef.current empieza en null", () => {
    const { result } = setup();
    expect(result.current.lastDragCellRef.current).toBeNull();
  });

  it("rotationDragRef.current empieza en null", () => {
    const { result } = setup();
    expect(result.current.rotationDragRef.current).toBeNull();
  });

  it("exploredBitmapRef.current empieza en null", () => {
    const { result } = setup();
    expect(result.current.exploredBitmapRef.current).toBeNull();
  });
});

// ── Setters ───────────────────────────────────────────────────────────────────

describe("useFogOfWarInteraction - setters", () => {
  it("setContextMenu establece el menú contextual", () => {
    const { result } = setup();
    act(() => {
      result.current.setContextMenu({ posicionId: 1, x: 100, y: 200 });
    });
    expect(result.current.contextMenu).toEqual({
      posicionId: 1,
      x: 100,
      y: 200,
    });
  });

  it("setContextMenu puede limpiar el menú (null)", () => {
    const { result } = setup();
    act(() => {
      result.current.setContextMenu({ posicionId: 1, x: 0, y: 0 });
    });
    act(() => {
      result.current.setContextMenu(null);
    });
    expect(result.current.contextMenu).toBeNull();
  });

  it("setVisionArcTarget establece el target", () => {
    const { result } = setup();
    act(() => {
      result.current.setVisionArcTarget(42);
    });
    expect(result.current.visionArcTarget).toBe(42);
  });

  it("setVisionArcTarget puede limpiar el target (null)", () => {
    const { result } = setup();
    act(() => {
      result.current.setVisionArcTarget(42);
    });
    act(() => {
      result.current.setVisionArcTarget(null);
    });
    expect(result.current.visionArcTarget).toBeNull();
  });

  it("setNieblaEstado actualiza el estado de niebla", () => {
    const { result } = setup();
    act(() => {
      result.current.setNieblaEstado((prev) => ({ ...prev, activa: true }));
    });
    expect(result.current.nieblaEstado.activa).toBe(true);
  });
});

// ── handleNieblaChanged ───────────────────────────────────────────────────────

describe("useFogOfWarInteraction - handleNieblaChanged", () => {
  it("actualiza nieblaEstado con el nuevo estado", () => {
    const { result } = setup();
    const nuevoEstado = {
      activa: true,
      zonasExploradas: true,
      vistaJugador: false,
      visionConfigs: [],
      exploredAreas: [
        {
          id: "area-1",
          posicionX: 0,
          posicionY: 0,
          arcType: "cone" as const,
          radius: 5,
          apertura: 60,
          rotation: 0,
          angle: 0,
          length: 0,
          width: 0,
          height: 0,
          tokenSize: 1,
        },
      ],
    };
    act(() => {
      result.current.handleNieblaChanged(nuevoEstado);
    });
    expect(result.current.nieblaEstado.activa).toBe(true);
    expect(result.current.nieblaEstado.exploredAreas).toHaveLength(1);
  });

  it("actualiza confirmedAreaIdsRef con los IDs del estado", () => {
    const { result } = setup();
    const nuevoEstado = {
      activa: false,
      zonasExploradas: false,
      vistaJugador: false,
      visionConfigs: [],
      exploredAreas: [
        {
          id: "area-abc",
          posicionX: 0,
          posicionY: 0,
          arcType: "cone" as const,
          radius: 5,
          apertura: 60,
          rotation: 0,
          angle: 0,
          length: 0,
          width: 0,
          height: 0,
          tokenSize: 1,
        },
      ],
    };
    act(() => {
      result.current.handleNieblaChanged(nuevoEstado);
    });
    expect(result.current.confirmedAreaIdsRef.current.has("area-abc")).toBe(
      true,
    );
  });

  it("actualiza nieblaEstado.activa", () => {
    const { result } = setup();
    act(() => {
      result.current.handleNieblaChanged({
        activa: true,
        zonasExploradas: false,
        vistaJugador: false,
        visionConfigs: [],
        exploredAreas: [],
      });
    });
    expect(result.current.nieblaEstado.activa).toBe(true);
  });

  it("limpia pendingAreasRef de áreas ya confirmadas", () => {
    const { result } = setup();
    // Pre-populate pending areas
    result.current.pendingAreasRef.current = [
      {
        id: "area-confirmed",
        posicionX: 0,
        posicionY: 0,
        arcType: "cone" as const,
        radius: 5,
        apertura: 60,
        rotation: 0,
        angle: 0,
        length: 0,
        width: 0,
        height: 0,
        tokenSize: 1,
      },
    ];

    act(() => {
      result.current.handleNieblaChanged({
        activa: false,
        zonasExploradas: false,
        vistaJugador: false,
        visionConfigs: [],
        exploredAreas: [
          {
            id: "area-confirmed",
            posicionX: 0,
            posicionY: 0,
            arcType: "cone" as const,
            radius: 5,
            apertura: 60,
            rotation: 0,
            angle: 0,
            length: 0,
            width: 0,
            height: 0,
            tokenSize: 1,
          },
        ],
      });
    });

    expect(result.current.pendingAreasRef.current).toHaveLength(0);
  });
});

// ── Mouse event handlers (mousemove / mouseup) ────────────────────────────────

describe("useFogOfWarInteraction - mouseup handler", () => {
  it("mouseup sin rotationDragRef no hace nada", () => {
    setup();
    // rotationDragRef starts null, so mouseup should be a no-op
    expect(() => {
      act(() => {
        window.dispatchEvent(
          new MouseEvent("mouseup", { clientX: 50, clientY: 50 }),
        );
      });
    }).not.toThrow();
  });

  it("mouseup con drag sin movimiento abre contextMenu", () => {
    const { result } = setup();
    // Pre-populate rotationDragRef to simulate a right-click drag that didn't move
    act(() => {
      result.current.rotationDragRef.current = {
        posicionId: 7,
        startClientX: 100,
        startClientY: 100,
        tokenCenterClientX: 100,
        tokenCenterClientY: 100,
        hasMoved: false,
      } as never;
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent("mouseup", {
          clientX: 100,
          clientY: 200,
          bubbles: true,
        }),
      );
    });

    expect(result.current.contextMenu).toEqual({
      posicionId: 7,
      x: 100,
      y: 200,
    });
  });

  it("mouseup con drag limpia rotationDragRef", () => {
    const { result } = setup();
    act(() => {
      result.current.rotationDragRef.current = {
        posicionId: 3,
        startClientX: 10,
        startClientY: 10,
        tokenCenterClientX: 10,
        tokenCenterClientY: 10,
        hasMoved: false,
      } as never;
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent("mouseup", { clientX: 10, clientY: 10 }),
      );
    });

    expect(result.current.rotationDragRef.current).toBeNull();
  });

  it("mouseup con drag que sí se movió llama agregarAreasExploradasBatch", () => {
    const { result, agregarAreasExploradasBatch } = setup();

    act(() => {
      result.current.rotationDragRef.current = {
        posicionId: 5,
        startClientX: 0,
        startClientY: 0,
        tokenCenterClientX: 50,
        tokenCenterClientY: 50,
        hasMoved: true,
      } as never;
      // Set up visionConfigs so configurarVisionToken can be called
      result.current.setNieblaEstado((prev) => ({
        ...prev,
        visionConfigs: [
          {
            posicionId: 5,
            radius: 5,
            arcType: "circle" as const,
            apertura: 360,
            rotation: 45,
            angle: 360,
            length: 0,
            width: 0,
            height: 0,
            revelaArea: false,
          },
        ],
      }));
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent("mouseup", { clientX: 60, clientY: 50, bubbles: true }),
      );
    });

    // agregarAreasExploradasBatch should have been called (with empty array since localRotationAreasRef is empty)
    expect(agregarAreasExploradasBatch).toHaveBeenCalled();
    // rotationDragRef should be cleared
    expect(result.current.rotationDragRef.current).toBeNull();
  });
});

describe("useFogOfWarInteraction - mousemove handler", () => {
  it("mousemove sin rotationDragRef no hace nada", () => {
    setup();
    // Should not throw
    expect(() => {
      act(() => {
        window.dispatchEvent(
          new MouseEvent("mousemove", { clientX: 50, clientY: 50 }),
        );
      });
    }).not.toThrow();
  });

  it("mousemove con drag pequeño no pone hasMoved en true", () => {
    const { result } = setup();
    const drag = {
      posicionId: 2,
      startClientX: 100,
      startClientY: 100,
      tokenCenterClientX: 100,
      tokenCenterClientY: 100,
      hasMoved: false,
    };
    act(() => {
      result.current.rotationDragRef.current = drag as never;
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 103, clientY: 100 }), // dx=3, dy=0 — below threshold of 5
      );
    });

    expect(result.current.rotationDragRef.current?.hasMoved).toBe(false);
  });

  it("mousemove con drag grande pone hasMoved en true y actualiza visionConfigs", () => {
    const { result } = setup();
    act(() => {
      result.current.rotationDragRef.current = {
        posicionId: 9,
        startClientX: 100,
        startClientY: 100,
        tokenCenterClientX: 200,
        tokenCenterClientY: 200,
        hasMoved: false,
      } as never;
      result.current.setNieblaEstado((prev) => ({
        ...prev,
        visionConfigs: [
          {
            posicionId: 9,
            radius: 5,
            arcType: "circle" as const,
            apertura: 360,
            rotation: 0,
            angle: 360,
            length: 0,
            width: 0,
            height: 0,
            revelaArea: false,
          },
        ],
      }));
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 110, clientY: 100 }), // dx=10 — above threshold
      );
    });

    expect(result.current.rotationDragRef.current?.hasMoved).toBe(true);
    // liveRotationRef should be updated
    expect(typeof result.current.liveRotationRef.current).toBe("number");
  });
});
