import { useEffect, useMemo, useState } from "react";
import { fetchDndBackgroundDetail } from "../../utils/dndApi";
import type { DndBackgroundDetail, DndBackgroundSummary } from "../../types";

export function useCreateDndBackgroundState(
  availableBackgrounds: DndBackgroundSummary[],
) {
  const [selectedBackgroundId, setSelectedBackgroundId] = useState("");
  const [selectedBackgroundDetail, setSelectedBackgroundDetail] =
    useState<DndBackgroundDetail | null>(null);
  const [
    isLoadingSelectedBackgroundDetail,
    setIsLoadingSelectedBackgroundDetail,
  ] = useState(false);
  const [selectedBackgroundDetailError, setSelectedBackgroundDetailError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!selectedBackgroundId) {
      setSelectedBackgroundDetail(null);
      setSelectedBackgroundDetailError(null);
      setIsLoadingSelectedBackgroundDetail(false);
      return;
    }

    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setSelectedBackgroundDetail(null);
      setSelectedBackgroundDetailError(
        "No se pudo autenticar la carga del trasfondo.",
      );
      return;
    }

    const abortController = new AbortController();

    const loadSelectedBackgroundDetail = async () => {
      try {
        setIsLoadingSelectedBackgroundDetail(true);
        setSelectedBackgroundDetailError(null);
        const data = await fetchDndBackgroundDetail(
          token,
          selectedBackgroundId,
          abortController.signal,
        );
        setSelectedBackgroundDetail(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSelectedBackgroundDetail(null);
          setSelectedBackgroundDetailError(
            "No se pudo cargar la información del trasfondo.",
          );
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingSelectedBackgroundDetail(false);
        }
      }
    };

    void loadSelectedBackgroundDetail();

    return () => abortController.abort();
  }, [selectedBackgroundId]);

  const selectedBackgroundName = useMemo(() => {
    if (selectedBackgroundDetail) {
      return selectedBackgroundDetail.nombre;
    }

    return (
      availableBackgrounds.find(
        (background) => background.id === selectedBackgroundId,
      )?.nombre ?? selectedBackgroundId
    );
  }, [availableBackgrounds, selectedBackgroundDetail, selectedBackgroundId]);

  return {
    selectedBackgroundId,
    setSelectedBackgroundId,
    selectedBackgroundDetail,
    isLoadingSelectedBackgroundDetail,
    selectedBackgroundDetailError,
    selectedBackgroundName,
  };
}
