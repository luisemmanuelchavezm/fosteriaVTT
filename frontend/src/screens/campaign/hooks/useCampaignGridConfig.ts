import { useCallback, useEffect, useRef, useState } from "react";
import { buildApiUrl } from "../../../lib/api";
import type { CampaignPestañaResponse } from "../types";

interface UseCampaignGridConfigParams {
  campaignId: string;
  pestañaId: number | null;
  pestaña: CampaignPestañaResponse | null;
  mapLayerImage: HTMLImageElement | null;
  onPestañaUpdated: (p: CampaignPestañaResponse) => void;
  onAfterSave?: (updated: CampaignPestañaResponse) => void;
}

export function useCampaignGridConfig({
  campaignId,
  pestañaId,
  pestaña,
  mapLayerImage,
  onPestañaUpdated,
  onAfterSave,
}: UseCampaignGridConfigParams) {
  const [settingsMode, setSettingsMode] = useState<
    "options" | "gridConfig" | null
  >(null);
  const [gridConfigForm, setGridConfigForm] = useState({
    nCuadriculasX: 20,
    nCuadriculasY: 20,
    distanciaCasilla: 5,
    sistemaMetrico: "ft",
  });
  const [isSavingGridConfig, setIsSavingGridConfig] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  // Close settings when clicking outside
  useEffect(() => {
    if (settingsMode === null) return;
    const handler = (e: MouseEvent) => {
      if (
        settingsDropdownRef.current &&
        !settingsDropdownRef.current.contains(e.target as Node)
      ) {
        setSettingsMode(null);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [settingsMode]);

  // Populate form from pestaña when entering gridConfig mode
  useEffect(() => {
    if (settingsMode === "gridConfig" && pestaña) {
      setGridConfigForm({
        nCuadriculasX: pestaña.nCuadriculasX,
        nCuadriculasY: pestaña.nCuadriculasY,
        distanciaCasilla: pestaña.distanciaCasilla,
        sistemaMetrico: pestaña.sistemaMetrico,
      });
    }
  }, [settingsMode, pestaña]);

  const handleSaveGridConfig = useCallback(async () => {
    if (!pestañaId || isSavingGridConfig) return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    setIsSavingGridConfig(true);
    try {
      const res = await fetch(
        buildApiUrl(
          `/api/campanas/${campaignId}/pestana/${pestañaId}/configuracion`,
        ),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gridConfigForm),
        },
      );
      if (!res.ok) return;
      const updated = (await res.json()) as CampaignPestañaResponse;
      onPestañaUpdated(updated);
      setSettingsMode(null); // close settings panel after successful save
      onAfterSave?.(updated);
    } catch {
      // ignore
    } finally {
      setIsSavingGridConfig(false);
    }
  }, [
    campaignId,
    gridConfigForm,
    isSavingGridConfig,
    onAfterSave,
    onPestañaUpdated,
    pestañaId,
  ]);

  const handleAutoGrid = useCallback(() => {
    if (
      !mapLayerImage ||
      mapLayerImage.naturalWidth <= 0 ||
      mapLayerImage.naturalHeight <= 0
    )
      return;
    const ratio = mapLayerImage.naturalWidth / mapLayerImage.naturalHeight;
    let autoX: number;
    let autoY: number;
    if (ratio >= 1) {
      autoX = 20;
      autoY = Math.round(20 / ratio);
    } else {
      autoY = 20;
      autoX = Math.round(20 * ratio);
    }
    setGridConfigForm((prev) => ({
      ...prev,
      nCuadriculasX: Math.max(10, Math.min(100, autoX)),
      nCuadriculasY: Math.max(10, Math.min(100, autoY)),
    }));
  }, [mapLayerImage]);

  return {
    settingsMode,
    setSettingsMode,
    gridConfigForm,
    setGridConfigForm,
    isSavingGridConfig,
    settingsDropdownRef,
    handleSaveGridConfig,
    handleAutoGrid,
  };
}
