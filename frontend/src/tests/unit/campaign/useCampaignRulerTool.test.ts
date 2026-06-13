import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCampaignRulerTool } from "../../../screens/campaign/hooks/useCampaignRulerTool";
import type { GridGeometry } from "../../../screens/campaign/hooks/useCampaignRulerTool";

const GRID: GridGeometry = { rectX: 0, rectY: 0, rectW: 500, rectH: 500 };
const CELL_PX = 50;

function makeMockStage(pointer: { x: number; y: number } | null) {
  return {
    getPointerPosition: vi.fn(() => pointer),
    getAbsoluteTransform: vi.fn(() => ({
      copy: () => ({
        invert: () => undefined,
        point: (p: { x: number; y: number }) => p,
      }),
    })),
  };
}

describe("useCampaignRulerTool", () => {
  describe("estado inicial", () => {
    it("selectedShape es recta por defecto", () => {
      const stageRef = { current: null };
      const { result } = renderHook(() =>
        useCampaignRulerTool({
          enabled: false,
          stageRef,
          grid: GRID,
          cellPx: CELL_PX,
          unitDistance: 5,
          metric: "ft",
        }),
      );
      expect(result.current.selectedShape).toBe("recta");
    });

    it("measurement es null por defecto", () => {
      const stageRef = { current: null };
      const { result } = renderHook(() =>
        useCampaignRulerTool({
          enabled: false,
          stageRef,
          grid: GRID,
          cellPx: CELL_PX,
          unitDistance: 5,
          metric: "ft",
        }),
      );
      expect(result.current.measurement).toBeNull();
    });

    it("overlay es null cuando no hay medición", () => {
      const stageRef = { current: null };
      const { result } = renderHook(() =>
        useCampaignRulerTool({
          enabled: false,
          stageRef,
          grid: GRID,
          cellPx: CELL_PX,
          unitDistance: 5,
          metric: "ft",
        }),
      );
      expect(result.current.overlay).toBeNull();
    });
  });

  describe("setSelectedShape", () => {
    it("permite cambiar la forma seleccionada", () => {
      const stageRef = { current: null };
      const { result } = renderHook(() =>
        useCampaignRulerTool({
          enabled: true,
          stageRef,
          grid: GRID,
          cellPx: CELL_PX,
          unitDistance: 5,
          metric: "ft",
        }),
      );

      act(() => result.current.setSelectedShape("circular"));
      expect(result.current.selectedShape).toBe("circular");

      act(() => result.current.setSelectedShape("conica"));
      expect(result.current.selectedShape).toBe("conica");
    });
  });

  describe("handleMouseDown", () => {
    it("retorna false cuando está deshabilitado", () => {
      const stageRef = { current: null };
      const { result } = renderHook(() =>
        useCampaignRulerTool({
          enabled: false,
          stageRef,
          grid: GRID,
          cellPx: CELL_PX,
          unitDistance: 5,
          metric: "ft",
        }),
      );

      let returnValue: boolean = true;
      act(() => {
        returnValue = result.current.handleMouseDown();
      });
      expect(returnValue).toBe(false);
    });

    it("retorna false cuando no hay stage", () => {
      const stageRef = { current: null };
      const { result } = renderHook(() =>
        useCampaignRulerTool({
          enabled: true,
          stageRef,
          grid: GRID,
          cellPx: CELL_PX,
          unitDistance: 5,
          metric: "ft",
        }),
      );

      let returnValue: boolean = true;
      act(() => {
        returnValue = result.current.handleMouseDown();
      });
      expect(returnValue).toBe(false);
    });

    it("retorna false cuando el pointer está fuera del grid", () => {
      const mockStage = makeMockStage({ x: -10, y: -10 });
      const stageRef = { current: mockStage as never };
      const { result } = renderHook(() =>
        useCampaignRulerTool({
          enabled: true,
          stageRef,
          grid: GRID,
          cellPx: CELL_PX,
          unitDistance: 5,
          metric: "ft",
        }),
      );

      let returnValue: boolean = true;
      act(() => {
        returnValue = result.current.handleMouseDown();
      });
      expect(returnValue).toBe(false);
    });

    it("establece medición y retorna true cuando el pointer está en el grid", () => {
      const mockStage = makeMockStage({ x: 75, y: 75 });
      const stageRef = { current: mockStage as never };
      const { result } = renderHook(() =>
        useCampaignRulerTool({
          enabled: true,
          stageRef,
          grid: GRID,
          cellPx: CELL_PX,
          unitDistance: 5,
          metric: "ft",
        }),
      );

      let returnValue: boolean = false;
      act(() => {
        returnValue = result.current.handleMouseDown();
      });

      expect(returnValue).toBe(true);
      expect(result.current.measurement).not.toBeNull();
    });
  });

  describe("overlay - buildOverlayData", () => {
    it("calcula la etiqueta de distancia correctamente", () => {
      const mockStage = makeMockStage({ x: 75, y: 75 });
      const stageRef = { current: mockStage as never };
      const { result } = renderHook(() =>
        useCampaignRulerTool({
          enabled: true,
          stageRef,
          grid: GRID,
          cellPx: CELL_PX,
          unitDistance: 5,
          metric: "ft",
        }),
      );

      // Inicia medición en col=1, row=1
      act(() => {
        result.current.handleMouseDown();
      });

      // Mueve a col=3, row=1 (2 celdas en X, 0 en Y)
      mockStage.getPointerPosition.mockReturnValue({ x: 175, y: 75 });
      act(() => {
        result.current.handleMouseMove();
      });

      expect(result.current.overlay).not.toBeNull();
      // traversedCells = max(2, 0) = 2; distance = 2 * 5 = 10
      expect(result.current.overlay?.label).toBe("10 ft");
    });

    it("usa la métrica proporcionada en la etiqueta", () => {
      const mockStage = makeMockStage({ x: 75, y: 75 });
      const stageRef = { current: mockStage as never };
      const { result } = renderHook(() =>
        useCampaignRulerTool({
          enabled: true,
          stageRef,
          grid: GRID,
          cellPx: CELL_PX,
          unitDistance: 1.5,
          metric: "m",
        }),
      );

      act(() => result.current.handleMouseDown());
      mockStage.getPointerPosition.mockReturnValue({ x: 175, y: 75 });
      act(() => result.current.handleMouseMove());

      expect(result.current.overlay?.label).toContain("m");
    });

    it("calcula radiusPx para cono/circular", () => {
      const mockStage = makeMockStage({ x: 75, y: 75 });
      const stageRef = { current: mockStage as never };
      const { result } = renderHook(() =>
        useCampaignRulerTool({
          enabled: true,
          stageRef,
          grid: GRID,
          cellPx: CELL_PX,
          unitDistance: 5,
          metric: "ft",
        }),
      );

      act(() => result.current.handleMouseDown());
      mockStage.getPointerPosition.mockReturnValue({ x: 175, y: 75 });
      act(() => result.current.handleMouseMove());

      // radiusPx = distance from start center to end center
      expect(result.current.overlay?.radiusPx).toBeGreaterThan(0);
      expect(result.current.overlay?.conePoints).toHaveLength(6);
    });
  });

  describe("handleMouseUp", () => {
    it("detiene el arrastre al soltar", () => {
      const mockStage = makeMockStage({ x: 75, y: 75 });
      const stageRef = { current: mockStage as never };
      const { result } = renderHook(() =>
        useCampaignRulerTool({
          enabled: true,
          stageRef,
          grid: GRID,
          cellPx: CELL_PX,
          unitDistance: 5,
          metric: "ft",
        }),
      );

      act(() => result.current.handleMouseDown());
      act(() => result.current.handleMouseUp());

      // Después de mouseUp, handleMouseMove no actualiza medición
      mockStage.getPointerPosition.mockReturnValue({ x: 300, y: 300 });
      const prevMeasurement = result.current.measurement;
      act(() => result.current.handleMouseMove());
      expect(result.current.measurement).toEqual(prevMeasurement);
    });
  });
});
