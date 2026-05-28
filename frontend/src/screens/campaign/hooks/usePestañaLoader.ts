import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildApiUrl } from "../../../lib/api";
import type { CampaignPestañaResponse } from "../types";

const CELL_SIZE = 70; // px fijos por celda

export function usePestañaLoader(campaignId: string) {
  const [pestaña, setPestaña] = useState<CampaignPestañaResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLayerImageUrl, setMapLayerImageUrl] = useState<string | null>(null);
  const [mapLayerImage, setMapLayerImage] = useState<HTMLImageElement | null>(
    null,
  );
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const pestañaIdRef = useRef<number | null>(pestaña?.id ?? null);
  useEffect(() => {
    pestañaIdRef.current = pestaña?.id ?? null;
  }, [pestaña?.id]);

  const pestañaRef = useRef(pestaña);
  useEffect(() => {
    pestañaRef.current = pestaña;
  }, [pestaña]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setStageSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load map layer image when URL changes
  useEffect(() => {
    if (!mapLayerImageUrl) {
      setMapLayerImage(null);
      return;
    }
    const img = new Image();
    img.src = mapLayerImageUrl;
    img.onload = () => setMapLayerImage(img);
  }, [mapLayerImageUrl]);

  // Open or create the campaign tab
  const openOrCreatePestaña = useCallback(async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setLoadError("No hay sesión activa.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);

      const response = await fetch(
        buildApiUrl(`/api/campanas/${campaignId}/pestana/abrir`),
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo abrir la pestaña de campaña.");
      }

      const data = (await response.json()) as CampaignPestañaResponse;
      setPestaña(data);
      setMapLayerImageUrl(data.mapaCapaUrl ?? null);
    } catch (error) {
      setLoadError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void openOrCreatePestaña();
  }, [openOrCreatePestaña]);

  const campaignIdNumber = useMemo(() => {
    const parsed = Number(campaignId);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [campaignId]);

  const grid = useMemo(() => {
    const cols = Math.max(10, Math.min(100, pestaña?.nCuadriculasX ?? 20));
    const rows = Math.max(10, Math.min(100, pestaña?.nCuadriculasY ?? 20));
    const cellPx = CELL_SIZE;
    const cellPxY = CELL_SIZE;
    const rectW = cols * CELL_SIZE;
    const rectH = rows * CELL_SIZE;
    const rectX = (stageSize.width - rectW) / 2;
    const rectY = (stageSize.height - rectH) / 2;
    const vLines = Array.from(
      { length: cols + 1 },
      (_, index) => index * cellPx,
    );
    const hLines = Array.from(
      { length: rows + 1 },
      (_, index) => index * cellPxY,
    );

    return {
      cols,
      rows,
      cellPx,
      cellPxY,
      rectW,
      rectH,
      rectX,
      rectY,
      vLines,
      hLines,
    };
  }, [pestaña, stageSize]);

  return {
    pestaña,
    setPestaña,
    loadError,
    isLoading,
    mapLayerImageUrl,
    setMapLayerImageUrl,
    mapLayerImage,
    stageSize,
    campaignIdNumber,
    pestañaIdRef,
    pestañaRef,
    grid,
  };
}
