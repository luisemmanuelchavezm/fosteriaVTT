// Tablas de referencia mostradas en los modales de info de cada zona de dados

export const D6_CONTAINER_INFO = [
  { label: "1–2", description: "Nada" },
  { label: "3", description: "Mochila para 7 artículos de tamaño normal" },
  { label: "4", description: "Saco para 10 prendas de tamaño normal" },
  {
    label: "5",
    description: "Cofre pequeño o un artículo de arriba a tu elección",
  },
  {
    label: "6",
    description: "Burro, no está mal. O uno de los anteriores a tu elección",
  },
];

export const D12_TABLE1_INFO = [
  { label: "1", description: "Cuerda de 30 pies" },
  { label: "2", description: "Presencia + 4 antorchas" },
  { label: "3", description: "Farol con aceite para Presencia + 6 horas" },
  { label: "4", description: "Tira de magnesio" },
  { label: "5", description: "Pergamino impuro al azar" },
  { label: "6", description: "Aguja afilada" },
  {
    label: "7",
    description:
      "Botiquín — Presencia + 4 usos (detiene hemorragia/infección, cura d6 PV)",
  },
  { label: "8", description: "Lima de metal y ganzúas" },
  {
    label: "9",
    description: "Trampa para osos (Presencia DR14 para detectar, daño d8)",
  },
  { label: "10", description: "Bomba — botella sellada, daño d10" },
  {
    label: "11",
    description:
      "Botella de veneno rojo — d4 dosis (Resistencia CD12 o daño d10)",
  },
  { label: "12", description: "Crucifijo de plata" },
];

export const D12_TABLE2_INFO = [
  {
    label: "1",
    description:
      "Elixir de vida con d4 dosis (cura d6 PV y elimina la infección)",
  },
  { label: "2", description: "Pergamino sagrado al azar" },
  {
    label: "3",
    description:
      "Perro pequeño pero feroz (d6+2 PV, mordisco d4, solo obedece a su dueño)",
  },
  {
    label: "4",
    description:
      "d4 monos que te ignoran pero te quieren (d4+2 PV, puñetazo/mordisco d4)",
  },
  { label: "5", description: "Perfume exquisito por valor de 25s" },
  {
    label: "6",
    description:
      "Caja de herramientas — 10 clavos, tenazas, martillo, sierra pequeña y taladro",
  },
  { label: "7", description: "Cadena pesada de 15 pies" },
  { label: "8", description: "Gancho de escalada" },
  {
    label: "9",
    description: "Escudo (-1 PV de daño o se rompe para ignorar un ataque)",
  },
  { label: "10", description: "Palanca (d4 daño)" },
  {
    label: "11",
    description:
      "Manteca de cerdo (puede funcionar como 5 comidas en caso de necesidad)",
  },
  { label: "12", description: "Tienda de campaña" },
];

export function presenciaQty(modifier: number | null, base: number): string {
  if (modifier === null) return `? + ${base}`;
  return String(Math.max(1, modifier + base));
}
