import { useEffect, useMemo, useState } from "react";
import {
  fetchDndBackgroundSummaries,
  fetchDndClassSummaries,
} from "../../utils/dndApi";
import type { DndBackgroundSummary, DndClassSummary } from "../../types";

export function useCreateDndCatalogs(classSearch: string) {
  const [availableClasses, setAvailableClasses] = useState<DndClassSummary[]>(
    [],
  );
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<
    DndBackgroundSummary[]
  >([]);
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);
  const [backgroundsError, setBackgroundsError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setAvailableClasses([]);
      setClassesError("No se pudo autenticar la carga de clases.");
      setAvailableBackgrounds([]);
      setBackgroundsError("No se pudo autenticar la carga de trasfondos.");
      return;
    }

    const abortController = new AbortController();

    const loadDndInfo = async () => {
      try {
        setIsLoadingClasses(true);
        setClassesError(null);
        setIsLoadingBackgrounds(true);
        setBackgroundsError(null);

        const [classes, backgrounds] = await Promise.all([
          fetchDndClassSummaries(token, abortController.signal),
          fetchDndBackgroundSummaries(token, abortController.signal),
        ]);

        setAvailableClasses(classes);
        setAvailableBackgrounds(backgrounds);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setAvailableClasses([]);
          setClassesError("No se pudo cargar la lista de clases.");
          setAvailableBackgrounds([]);
          setBackgroundsError("No se pudo cargar la lista de trasfondos.");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingClasses(false);
          setIsLoadingBackgrounds(false);
        }
      }
    };

    void loadDndInfo();

    return () => abortController.abort();
  }, []);

  const filteredClasses = useMemo(() => {
    const normalizedQuery = classSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return availableClasses;
    }

    return availableClasses.filter((item) =>
      item.nombre.toLowerCase().includes(normalizedQuery),
    );
  }, [availableClasses, classSearch]);

  return {
    availableClasses,
    filteredClasses,
    isLoadingClasses,
    classesError,
    availableBackgrounds,
    isLoadingBackgrounds,
    backgroundsError,
  };
}
