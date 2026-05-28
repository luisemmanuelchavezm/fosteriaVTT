import { SKILL_ROWS } from "../../personaje/dndcharactersheet/data";
import imgAtaque from "../../../assets/habilidades DND/ataque neutral.jpeg";
import imgAtaqueVentaja from "../../../assets/habilidades DND/ataque ventaja.jpeg";
import imgAtaqueDesventaja from "../../../assets/habilidades DND/ataque desventaja.jpeg";
import imgDanoNeutral from "../../../assets/habilidades DND/daño neutral.jpeg";
import imgDanoVentaja from "../../../assets/habilidades DND/daño ventaja.jpeg";
import imgHabilidad from "../../../assets/habilidades DND/tirada de habilidad.jpeg";
import imgHabilidadAcrobacias from "../../../assets/habilidades DND/habilidad acrobacias.jpeg";
import imgHabilidadArcanos from "../../../assets/habilidades DND/habilidad arcanos.jpeg";
import imgHabilidadAtletismo from "../../../assets/habilidades DND/habilidad atletismo.jpeg";
import imgHabilidadEnganar from "../../../assets/habilidades DND/habilidad engañar.jpeg";
import imgHabilidadHistoria from "../../../assets/habilidades DND/habilidad historia.jpeg";
import imgHabilidadInterpretacion from "../../../assets/habilidades DND/habilidad interpretacion.jpeg";
import imgHabilidadIntimidacion from "../../../assets/habilidades DND/habilidad intimidacion.jpeg";
import imgHabilidadInvestigacion from "../../../assets/habilidades DND/habilidad investigacion.jpeg";
import imgHabilidadMedicina from "../../../assets/habilidades DND/habilidad medicina.jpeg";
import imgHabilidadNaturaleza from "../../../assets/habilidades DND/habilidad naturaleza.jpeg";
import imgHabilidadPercepcion from "../../../assets/habilidades DND/habilidad percepcion.jpeg";
import imgHabilidadPerspicacia from "../../../assets/habilidades DND/habilidad perspicacia.jpeg";
import imgHabilidadPersuasion from "../../../assets/habilidades DND/habilidad persuasion.jpeg";
import imgHabilidadReligion from "../../../assets/habilidades DND/habilidad religion.jpeg";
import imgHabilidadSigilo from "../../../assets/habilidades DND/habilidad sigilo.jpeg";
import imgHabilidadSupervivencia from "../../../assets/habilidades DND/habilidad supervivencia.jpeg";
import imgHabilidadTratoConAnimales from "../../../assets/habilidades DND/habilidad trato con animales.jpeg";
import imgJuegoDeManos from "../../../assets/habilidades DND/juego de manos.jpeg";
import imgRecursos from "../../../assets/habilidades DND/Recursos.jpeg";
import imgSalvacion from "../../../assets/habilidades DND/tirada de salvacion.jpeg";
import imgHechizos from "../../../assets/habilidades DND/hechizos.jpeg";

export const SKILL_IMAGE_MAP: Record<string, string> = {
  Acrobacias: imgHabilidadAcrobacias,
  Atletismo: imgHabilidadAtletismo,
  Arcano: imgHabilidadArcanos,
  Engano: imgHabilidadEnganar,
  Historia: imgHabilidadHistoria,
  Interpretacion: imgHabilidadInterpretacion,
  Intimidacion: imgHabilidadIntimidacion,
  Investigacion: imgHabilidadInvestigacion,
  "Juego de manos": imgJuegoDeManos,
  Medicina: imgHabilidadMedicina,
  Naturaleza: imgHabilidadNaturaleza,
  Percepcion: imgHabilidadPercepcion,
  Perspicacia: imgHabilidadPerspicacia,
  Persuasión: imgHabilidadPersuasion,
  Religión: imgHabilidadReligion,
  Sigilo: imgHabilidadSigilo,
  Supervivencia: imgHabilidadSupervivencia,
  "Trato con Animales": imgHabilidadTratoConAnimales,
};

export const SKILLS = SKILL_ROWS.map((row) => ({
  name: row.name,
  displayName: row.displayName,
  statName: row.statName,
  image: SKILL_IMAGE_MAP[row.name] || imgHabilidad,
}));

export {
  imgAtaque,
  imgAtaqueVentaja,
  imgAtaqueDesventaja,
  imgDanoNeutral,
  imgDanoVentaja,
  imgHabilidad,
  imgRecursos,
  imgSalvacion,
  imgHechizos,
};
