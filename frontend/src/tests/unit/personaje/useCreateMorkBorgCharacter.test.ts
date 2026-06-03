// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCreateMorkBorgCharacter } from "../../../screens/personaje/createmorkborg/hooks/useCreateMorkBorgCharacter";
import type { MorkBorgClass } from "../../../screens/personaje/createmorkborg/utils/morkBorgUtils";

// URL.createObjectURL no existe en jsdom
vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:fake-url") });

const mockClass: MorkBorgClass = {
  id: "escoria-alcantarillas",
  nombre: "Escoria de las Alcantarillas",
  insignia: "EA",
  descripcion: "desc",
  rasgos: [],
  opciones: [],
};

describe("useCreateMorkBorgCharacter", () => {
  it("inicia con valores por defecto", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    expect(result.current.name).toBe("");
    expect(result.current.selectedClass).toBeNull();
    expect(result.current.activePhaseIndex).toBe(0);
    expect(result.current.equipmentComplete).toBe(false);
    expect(result.current.rasgosComplete).toBe(false);
    expect(result.current.statsSnapshot).toBeNull();
    expect(result.current.equipmentSnapshot).toBeNull();
    expect(result.current.traitsData).toBeNull();
    expect(result.current.portraitFile).toBeNull();
    expect(result.current.portraitPreview).toBeNull();
  });

  it("setName actualiza el nombre", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    act(() => result.current.setName("Kragor"));
    expect(result.current.name).toBe("Kragor");
  });

  it("selectClass asigna la clase y resetea el estado derivado", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());

    // Primero ponemos algo de estado
    act(() => {
      result.current.notifyPresenciaRolled(2);
      result.current.notifyAllMainStatsRolled();
      result.current.notifyAllStatsComplete();
    });

    act(() => result.current.selectClass(mockClass));

    expect(result.current.selectedClass).toEqual(mockClass);
    expect(result.current.claseOpciones).toEqual([]);
    expect(result.current.presenciaModifier).toBeNull();
    expect(result.current.allMainStatsRolled).toBe(false);
    expect(result.current.allStatsComplete).toBe(false);
    expect(result.current.statsSnapshot).toBeNull();
    expect(result.current.equipmentComplete).toBe(false);
    expect(result.current.equipmentSnapshot).toBeNull();
  });

  it("clearClass elimina la clase y resetea todo", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());

    act(() => result.current.selectClass(mockClass));
    act(() => result.current.clearClass());

    expect(result.current.selectedClass).toBeNull();
    expect(result.current.claseOpciones).toEqual([]);
    expect(result.current.allMainStatsRolled).toBe(false);
  });

  it("notifyClaseOpcionRolled actualiza opciones de clase", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    act(() => result.current.notifyClaseOpcionRolled([0, 2]));
    expect(result.current.claseOpciones).toEqual([0, 2]);
  });

  it("notifyPresenciaRolled actualiza presenciaModifier", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    act(() => result.current.notifyPresenciaRolled(3));
    expect(result.current.presenciaModifier).toBe(3);
  });

  it("notifyAllMainStatsRolled pone allMainStatsRolled en true", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    act(() => result.current.notifyAllMainStatsRolled());
    expect(result.current.allMainStatsRolled).toBe(true);
  });

  it("notifyAllStatsComplete pone allStatsComplete en true", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    act(() => result.current.notifyAllStatsComplete());
    expect(result.current.allStatsComplete).toBe(true);
  });

  it("notifyStatsSnapshot guarda el snapshot de estadísticas", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    const snap = {
      fuerza: 10,
      modFuerza: 0,
      agilidad: 12,
      modAgilidad: 0,
      presencia: 8,
      modPresencia: -1,
      resistencia: 14,
      modResistencia: 1,
      vida: 8,
      presagios: 3,
      carga: 3,
    };
    act(() => result.current.notifyStatsSnapshot(snap));
    expect(result.current.statsSnapshot).toEqual(snap);
  });

  it("notifyEquipmentComplete(true, snapshot) guarda el snapshot de equipo", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    const snap = {
      plata: 50,
      comida: 3,
      armaIdx: 2,
      armaduraNivel: 1,
      contenedorResult: 3,
      item1Result: 5,
      item2Result: 7,
      wantsScroll: false,
      perScrollTipo: null,
      perScrollIdx: null,
      esotScrollTipo: null,
      esotScrollIdx: null,
    };
    act(() => result.current.notifyEquipmentComplete(true, snap));
    expect(result.current.equipmentComplete).toBe(true);
    expect(result.current.equipmentSnapshot).toEqual(snap);
  });

  it("notifyEquipmentComplete(false) pone equipmentComplete en false sin cambiar snapshot", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    const snap = {
      plata: 50,
      comida: 3,
      armaIdx: 2,
      armaduraNivel: 1,
      contenedorResult: null,
      item1Result: null,
      item2Result: null,
      wantsScroll: false,
      perScrollTipo: null,
      perScrollIdx: null,
      esotScrollTipo: null,
      esotScrollIdx: null,
    };
    act(() => result.current.notifyEquipmentComplete(true, snap));
    act(() => result.current.notifyEquipmentComplete(false));
    expect(result.current.equipmentComplete).toBe(false);
    expect(result.current.equipmentSnapshot).toEqual(snap); // snapshot no se borra
  });

  it("notifyRasgosComplete(true, data) guarda rasgos", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    const data = {
      rasgoTerrible1: 1,
      rasgoTerrible2: 2,
      cuerpoRoto: 3,
      habito: 4,
      historiaperturbadora: 5,
    };
    act(() => result.current.notifyRasgosComplete(true, data));
    expect(result.current.rasgosComplete).toBe(true);
    expect(result.current.traitsData).toEqual(data);
  });

  it("notifyRasgosComplete(false) pone rasgosComplete en false", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    act(() =>
      result.current.notifyRasgosComplete(true, {
        rasgoTerrible1: 1,
        rasgoTerrible2: 2,
        cuerpoRoto: 1,
        habito: 1,
        historiaperturbadora: 1,
      }),
    );
    act(() => result.current.notifyRasgosComplete(false));
    expect(result.current.rasgosComplete).toBe(false);
  });

  it("setActivePhaseIndex actualiza la fase activa", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    act(() => result.current.setActivePhaseIndex(2));
    expect(result.current.activePhaseIndex).toBe(2);
  });

  it("handleOpenFilePicker invoca click en el fileInputRef", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    const clickSpy = vi.fn();
    Object.defineProperty(result.current.fileInputRef, "current", {
      value: { click: clickSpy },
      writable: true,
    });
    act(() => result.current.handleOpenFilePicker());
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("handlePortraitSelection sin archivos no hace nada", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    const fakeEvent = { target: { files: null } } as never;
    act(() => result.current.handlePortraitSelection(fakeEvent));
    expect(result.current.portraitFile).toBeNull();
    expect(result.current.portraitPreview).toBeNull();
  });

  it("handlePortraitSelection con archivo actualiza portraitFile y portraitPreview", () => {
    const { result } = renderHook(() => useCreateMorkBorgCharacter());
    const fakeFile = new File(["img"], "avatar.png", { type: "image/png" });
    const fakeEvent = { target: { files: [fakeFile] } } as never;
    act(() => result.current.handlePortraitSelection(fakeEvent));
    expect(result.current.portraitFile).toBe(fakeFile);
    expect(result.current.portraitPreview).toBe("blob:fake-url");
  });
});
