// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateDndCharacter } from "../../../screens/personaje/creatednd/hooks/useCreateDndCharacter";

const dndApiMocks = vi.hoisted(() => ({
  fetchClassSubclassSkills: vi.fn(),
  fetchClassSkills: vi.fn(),
  fetchDndBackgroundDetail: vi.fn(),
  fetchDndBackgroundSummaries: vi.fn(),
  fetchDndClassDetail: vi.fn(),
  fetchDndClassSummaries: vi.fn(),
}));

vi.mock("../../../screens/personaje/creatednd/utils/dndApi", () => ({
  ...dndApiMocks,
}));

const classSummaries = [
  { id: "wizard", nombre: "Mago" },
  { id: "rogue", nombre: "Pícaro" },
];

const backgroundSummaries = [{ id: "sage", nombre: "Sabio" }];

const classDetail = {
  id: "wizard",
  nombre: "Mago",
  subclases: [{ id: "evocation", nombre: "Evocación", nivelDesbloqueo: 1 }],
  elecciones: [],
  equipamiento: null,
};

const classSkills = [
  { id: "wizard-skills", cantidad: 2, catalogo: "habilidades", opciones: [] },
];

const subclassSkills = [
  {
    id: "evocation-skills",
    cantidad: 1,
    catalogo: "habilidades",
    opciones: [],
  },
];

const backgroundDetail = {
  id: "sage",
  nombre: "Sabio",
  elecciones: [],
  equipamiento: null,
};

describe("creacion de personaje - useCreateDndCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    dndApiMocks.fetchDndClassSummaries.mockResolvedValue(classSummaries);
    dndApiMocks.fetchDndBackgroundSummaries.mockResolvedValue(
      backgroundSummaries,
    );
    dndApiMocks.fetchDndClassDetail.mockResolvedValue(classDetail);
    dndApiMocks.fetchClassSkills.mockResolvedValue(classSkills);
    dndApiMocks.fetchClassSubclassSkills.mockResolvedValue(subclassSkills);
    dndApiMocks.fetchDndBackgroundDetail.mockResolvedValue(backgroundDetail);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sin token marca errores de autenticacion para la carga inicial", async () => {
    const { result } = renderHook(() => useCreateDndCharacter());

    await waitFor(() => {
      expect(result.current.classesError).toBe(
        "No se pudo autenticar la carga de clases.",
      );
    });

    expect(result.current.availableBackgrounds).toEqual([]);
    expect(result.current.backgroundsError).toBe(
      "No se pudo autenticar la carga de trasfondos.",
    );
    expect(dndApiMocks.fetchDndClassSummaries).not.toHaveBeenCalled();
    expect(dndApiMocks.fetchDndBackgroundSummaries).not.toHaveBeenCalled();
  });

  it("carga clases y trasfondos y filtra por texto", async () => {
    localStorage.setItem("jwtToken", "jwt-token");

    const { result } = renderHook(() => useCreateDndCharacter());

    await waitFor(() => {
      expect(result.current.availableBackgrounds).toEqual(backgroundSummaries);
    });

    expect(result.current.filteredClasses).toEqual(classSummaries);

    act(() => {
      result.current.setClassSearch("mag");
    });

    expect(result.current.filteredClasses).toEqual([classSummaries[0]]);
    expect(dndApiMocks.fetchDndClassSummaries).toHaveBeenCalledWith(
      "jwt-token",
      expect.any(AbortSignal),
    );
    expect(dndApiMocks.fetchDndBackgroundSummaries).toHaveBeenCalledWith(
      "jwt-token",
      expect.any(AbortSignal),
    );
  });

  it("carga preview de clase y convierte errores de autenticacion en clase, subclase y trasfondo", async () => {
    localStorage.setItem("jwtToken", "jwt-token");

    const { result } = renderHook(() => useCreateDndCharacter());

    await waitFor(() => {
      expect(result.current.availableBackgrounds).toEqual(backgroundSummaries);
    });

    act(() => {
      result.current.openClassModal(classSummaries[0]);
    });

    await waitFor(() => {
      expect(result.current.isClassModalOpen).toBe(true);
      expect(result.current.previewClassDetail?.nombre).toBe("Mago");
      expect(result.current.classSkills).toEqual(classSkills);
    });

    localStorage.removeItem("jwtToken");

    act(() => {
      result.current.selectPreviewClass();
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetailError).toBe(
        "No se pudo autenticar la carga de la clase seleccionada.",
      );
    });

    act(() => {
      result.current.setSelectedSubclassId("evocation");
    });

    await waitFor(() => {
      expect(result.current.subclassSkillsError).toBe(
        "No se pudo autenticar la carga de la subclase.",
      );
    });

    act(() => {
      result.current.setSelectedBackgroundId("sage");
    });

    await waitFor(() => {
      expect(result.current.selectedBackgroundDetailError).toBe(
        "No se pudo autenticar la carga del trasfondo.",
      );
    });

    expect(result.current.selectedBackgroundName).toBe("Sabio");
    expect(result.current.isClassModalOpen).toBe(false);
    expect(result.current.previewClass).toBeNull();
  });

  it("carga detalle de clase, habilidades de subclase y detalle de trasfondo y permite limpiar la clase", async () => {
    localStorage.setItem("jwtToken", "jwt-token");

    const { result } = renderHook(() => useCreateDndCharacter());

    await waitFor(() => {
      expect(result.current.availableBackgrounds).toEqual(backgroundSummaries);
    });

    act(() => {
      result.current.openClassModal(classSummaries[0]);
    });

    await waitFor(() => {
      expect(result.current.previewClassDetail?.nombre).toBe("Mago");
    });

    act(() => {
      result.current.selectPreviewClass();
    });

    await waitFor(() => {
      expect(result.current.selectedClass?.id).toBe("wizard");
      expect(result.current.selectedSubclass).toBeNull();
    });

    act(() => {
      result.current.setSelectedSubclassId("evocation");
    });

    await waitFor(() => {
      expect(result.current.selectedSubclass?.nombre).toBe("Evocación");
      expect(result.current.subclassSkills).toEqual(subclassSkills);
    });

    act(() => {
      result.current.setSelectedBackgroundId("sage");
    });

    await waitFor(() => {
      expect(result.current.selectedBackgroundDetail?.nombre).toBe("Sabio");
    });

    act(() => {
      result.current.clearSelectedClass();
    });

    expect(result.current.selectedClass).toBeNull();
    expect(result.current.selectedClassDetail).toBeNull();
    expect(result.current.selectedSubclassId).toBe("");
    expect(result.current.subclassSkills).toEqual([]);
    expect(result.current.classSearch).toBe("");
  });

  it("abre el selector de archivos y genera la previsualizacion del retrato", async () => {
    const clickSpy = vi.fn();

    class MockFileReader {
      result: string | null = null;

      onload: null | (() => void) = null;

      readAsDataURL() {
        this.result = "data:image/png;base64,portrait";
        this.onload?.();
      }
    }

    vi.stubGlobal("FileReader", MockFileReader);

    const { result } = renderHook(() => useCreateDndCharacter());

    act(() => {
      result.current.fileInputRef.current = {
        click: clickSpy,
      } as HTMLInputElement;
      result.current.openFilePicker();
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);

    const portraitFile = new File(["portrait"], "portrait.png", {
      type: "image/png",
    });

    act(() => {
      result.current.handlePortraitSelection({
        target: { files: [portraitFile] },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await waitFor(() => {
      expect(result.current.portraitFile).toEqual(portraitFile);
      expect(result.current.portraitPreview).toBe(
        "data:image/png;base64,portrait",
      );
    });
  });
});
