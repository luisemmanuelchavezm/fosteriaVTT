import {
  imgAtaque,
  imgHabilidad,
  imgRecursos,
  imgSalvacionDestreza,
  imgHechizos,
} from "../../utils/quickActionImages";

export type ActionKind =
  | "ataque"
  | "habilidad"
  | "rasgos-clase"
  | "especialidad"
  | "botin"
  | "hechizos"
  | "recursos";

export const ACTIONS = [
  { key: "ataque", label: "Ataque", img: imgAtaque },
  { key: "habilidad", label: "Rasgos", img: imgHabilidad },
  { key: "rasgos-clase", label: "Rasgos", img: imgHechizos },
  { key: "especialidad", label: "Especialidad", img: imgSalvacionDestreza },
  { key: "botin", label: "Botín", img: imgRecursos },
  { key: "hechizos", label: "Hechizos", img: imgHechizos },
  { key: "recursos", label: "Recursos", img: imgRecursos },
] as const;
