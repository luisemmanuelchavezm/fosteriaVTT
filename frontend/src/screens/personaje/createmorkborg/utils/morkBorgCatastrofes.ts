import rawData from "./morkBorgCatastrofes.json";

export interface MbCatastrofe {
  idx: number;
  visible: string;
  oculto: string | null;
}

export const MB_CATASTROFES: MbCatastrofe[] =
  rawData as unknown as MbCatastrofe[];
