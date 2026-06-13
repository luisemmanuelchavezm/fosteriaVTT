import { getMbScrollByIdx } from "../utils/morkBorgUtils";
import {
  SubRollButton,
  PresenciaNota,
  ResultChip,
  PendingRollWarning,
} from "./MorkBorgEquipmentHelpers";
import { presenciaQty } from "./MorkBorgEquipmentConstants";
import {
  Z_IMPURO_IDX,
  Z_VENENO_CANT,
  Z_SAGRADO_IDX,
  Z_ELIXIR_CANT,
  Z_MONOS_CANT,
} from "./useMorkBorgEquipmentRolls";

type RollFn = (slot: string, expr: string, label: string) => void;
type IsZFn = (slot: string) => boolean;

// ── ContenedorResult ──────────────────────────────────────────────────────────

interface ContenedorResultProps {
  contenedor: {
    nombre: string | null;
    descripcion?: string | null;
    result: number;
  };
  contenedorChoice: string;
  setContenedorChoice: (v: string) => void;
}

export function ContenedorResult({
  contenedor,
  contenedorChoice,
  setContenedorChoice,
}: ContenedorResultProps) {
  if (contenedor.nombre === null)
    return <p className="italic text-stone-500">Nada</p>;
  const choices =
    contenedor.result === 5
      ? ["Mochila", "Saco"]
      : contenedor.result === 6
        ? ["Mochila", "Saco", "Cofre pequeño"]
        : null;
  return (
    <div>
      <p className="font-bold text-amber-200">{contenedor.nombre}</p>
      {contenedor.descripcion ? (
        <p className="text-xs text-stone-200">{contenedor.descripcion}</p>
      ) : null}
      {choices ? (
        <div className="mt-2">
          <p className="text-xs font-semibold text-amber-400">o elige:</p>
          <select
            value={contenedorChoice}
            onChange={(e) => setContenedorChoice(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-600 bg-stone-800 px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="">— elegir —</option>
            {choices.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {contenedorChoice ? (
            <p className="mt-1 text-xs font-bold text-white">
              Elegido: {contenedorChoice}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ── Item1Result ───────────────────────────────────────────────────────────────

interface Item1ResultProps {
  item1: { result: number; nombre: string | null };
  presenciaModifier: number | null;
  impuroIdx: number | null;
  venenoCant: number | null;
  hasAttemptedCreation: boolean;
  isRolling: boolean;
  roll: RollFn;
  isZ: IsZFn;
}

export function Item1Result({
  item1,
  presenciaModifier,
  impuroIdx,
  venenoCant,
  hasAttemptedCreation,
  isRolling,
  roll,
  isZ,
}: Item1ResultProps) {
  if (item1.nombre === null) return null;
  switch (item1.result) {
    case 1:
      return (
        <p className="font-bold text-amber-200">
          Cuerda{" "}
          <span className="font-normal text-xs text-stone-200">(30 pies)</span>
        </p>
      );
    case 2:
      return (
        <div>
          <p className="font-bold text-amber-200">
            <ResultChip>{presenciaQty(presenciaModifier, 4)}</ResultChip>{" "}
            Antorchas
          </p>
          <PresenciaNota modifier={presenciaModifier} />
        </div>
      );
    case 3:
      return (
        <div>
          <p className="font-bold text-amber-200">
            <ResultChip>{presenciaQty(presenciaModifier, 6)}</ResultChip>{" "}
            Faroles
          </p>
          <PresenciaNota modifier={presenciaModifier} />
        </div>
      );
    case 4:
      return <p className="font-bold text-amber-200">Tira de magnesio</p>;
    case 5: {
      const scroll =
        impuroIdx !== null ? getMbScrollByIdx("impuro", impuroIdx) : null;
      return (
        <div>
          <p className="font-bold text-amber-200">Pergamino impuro al azar</p>
          {scroll ? (
            <div className="mt-1 rounded-xl border border-red-400/40 bg-stone-900/80 px-3 py-2">
              <p className="text-sm font-bold text-red-400">{scroll.nombre}</p>
              <p className="text-xs text-stone-200 mt-0.5">
                {scroll.descripcion}
              </p>
            </div>
          ) : (
            <>
              <SubRollButton
                label="Tirar 1d10 (pergamino)"
                onClick={() =>
                  roll(Z_IMPURO_IDX, "1d10", "Pergamino impuro al azar")
                }
                disabled={isRolling}
              />
              {hasAttemptedCreation ? (
                <PendingRollWarning className="mt-2" />
              ) : null}
            </>
          )}
        </div>
      );
    }
    case 6:
      return <p className="font-bold text-amber-200">Aguja afilada</p>;
    case 7:
      return (
        <div>
          <p className="font-bold text-amber-200">
            <ResultChip>{presenciaQty(presenciaModifier, 4)}</ResultChip>{" "}
            Botiquines
          </p>
          <p className="text-xs text-stone-200">
            Detiene hemorragia / infección, cura d6 PV
          </p>
          <PresenciaNota modifier={presenciaModifier} />
        </div>
      );
    case 8:
      return (
        <p className="font-bold text-amber-200">Lima de metal y ganzúas</p>
      );
    case 9:
      return (
        <div>
          <p className="font-bold text-amber-200">Trampa para osos</p>
          <p className="text-xs text-stone-200">
            Presencia DR14 para detectar, daño d8
          </p>
        </div>
      );
    case 10:
      return (
        <div>
          <p className="font-bold text-amber-200">Bomba</p>
          <p className="text-xs text-stone-200">botella sellada, daño d10</p>
        </div>
      );
    case 11:
      return (
        <div>
          <p className="font-bold text-amber-200">Botella de veneno rojo</p>
          <p className="text-xs text-stone-200">Resistencia CD12 o daño d10</p>
          {venenoCant !== null ? (
            <p className="mt-1">
              <ResultChip>{venenoCant}</ResultChip>
              <span className="ml-1 text-xs text-stone-200">botellas</span>
            </p>
          ) : (
            <>
              <SubRollButton
                label="Tirar d4 (botellas)"
                onClick={() =>
                  roll(Z_VENENO_CANT, "1d4", "Número de botellas de veneno")
                }
                disabled={isRolling || isZ(Z_VENENO_CANT)}
              />
              {hasAttemptedCreation ? (
                <PendingRollWarning className="mt-2" />
              ) : null}
            </>
          )}
        </div>
      );
    case 12:
      return <p className="font-bold text-amber-200">Crucifijo de plata</p>;
    default:
      return <p className="font-bold text-amber-200">{item1.nombre}</p>;
  }
}

// ── Item2Result ───────────────────────────────────────────────────────────────

interface Item2ResultProps {
  item2: { result: number; nombre: string | null };
  sagradoIdx: number | null;
  elixirCant: number | null;
  monosCant: number | null;
  hasAttemptedCreation: boolean;
  isRolling: boolean;
  roll: RollFn;
  isZ: IsZFn;
}

export function Item2Result({
  item2,
  sagradoIdx,
  elixirCant,
  monosCant,
  hasAttemptedCreation,
  isRolling,
  roll,
  isZ,
}: Item2ResultProps) {
  if (item2.nombre === null) return null;
  switch (item2.result) {
    case 1:
      return (
        <div>
          <p className="font-bold text-amber-200">Elixir de vida</p>
          <p className="text-xs text-stone-200">
            d4 dosis. Cura d6 PV y elimina la infección
          </p>
          {elixirCant !== null ? (
            <p className="mt-1">
              <ResultChip>{elixirCant}</ResultChip>
              <span className="ml-1 text-xs text-stone-200">elixires</span>
            </p>
          ) : (
            <>
              <SubRollButton
                label="Tirar d4 (elixires)"
                onClick={() =>
                  roll(Z_ELIXIR_CANT, "1d4", "Número de elixires de vida")
                }
                disabled={isRolling || isZ(Z_ELIXIR_CANT)}
              />
              {hasAttemptedCreation ? (
                <PendingRollWarning className="mt-2" />
              ) : null}
            </>
          )}
        </div>
      );
    case 2: {
      const scroll =
        sagradoIdx !== null ? getMbScrollByIdx("sagrado", sagradoIdx) : null;
      return (
        <div>
          <p className="font-bold text-amber-200">Pergamino sagrado al azar</p>
          {scroll ? (
            <div className="mt-1 rounded-xl border border-amber-300/60 bg-stone-900/80 px-3 py-2">
              <p className="text-sm font-bold text-amber-300">
                {scroll.nombre}
              </p>
              <p className="text-xs text-stone-200 mt-0.5">
                {scroll.descripcion}
              </p>
            </div>
          ) : (
            <>
              <SubRollButton
                label="Tirar 1d10 (pergamino)"
                onClick={() =>
                  roll(Z_SAGRADO_IDX, "1d10", "Pergamino sagrado al azar")
                }
                disabled={isRolling || isZ(Z_SAGRADO_IDX)}
              />
              {hasAttemptedCreation ? (
                <PendingRollWarning className="mt-2" />
              ) : null}
            </>
          )}
        </div>
      );
    }
    case 3:
      return (
        <div>
          <p className="font-bold text-amber-200">Perro pequeño pero feroz</p>
          <p className="text-xs text-stone-200">
            d6+2 PV, mordisco d4. Solo obedece a su dueño
          </p>
        </div>
      );
    case 4:
      return (
        <div>
          <p className="font-bold text-amber-200">Monos</p>
          <p className="text-xs text-stone-200">
            d4+2 PV, puñetazo/mordisco d4. Te ignoran pero te quieren
          </p>
          {monosCant !== null ? (
            <p className="mt-1">
              <ResultChip>{monosCant}</ResultChip>
              <span className="ml-1 text-xs text-stone-200">monos</span>
            </p>
          ) : (
            <>
              <SubRollButton
                label="Tirar d4 (monos)"
                onClick={() => roll(Z_MONOS_CANT, "1d4", "Número de monos")}
                disabled={isRolling || isZ(Z_MONOS_CANT)}
              />
              {hasAttemptedCreation ? (
                <PendingRollWarning className="mt-2" />
              ) : null}
            </>
          )}
        </div>
      );
    case 5:
      return (
        <div>
          <p className="font-bold text-amber-200">Perfume exquisito</p>
          <p className="text-xs text-stone-200">por valor de 25s</p>
        </div>
      );
    case 6:
      return (
        <div>
          <p className="font-bold text-amber-200">Caja de herramientas</p>
          <p className="text-xs text-stone-200">
            10 clavos, tenazas, martillo, sierra pequeña y taladro
          </p>
        </div>
      );
    case 7:
      return (
        <div>
          <p className="font-bold text-amber-200">Cadena pesada</p>
          <p className="text-xs text-stone-200">15 pies</p>
        </div>
      );
    case 8:
      return <p className="font-bold text-amber-200">Gancho de escalada</p>;
    case 9:
      return (
        <div>
          <p className="font-bold text-amber-200">Escudo</p>
          <p className="text-xs text-stone-200">
            -1 PV de daño, o romper el escudo para ignorar un ataque
          </p>
        </div>
      );
    case 10:
      return (
        <div>
          <p className="font-bold text-amber-200">Palanca</p>
          <p className="text-xs text-stone-200">d4 daño</p>
        </div>
      );
    case 11:
      return (
        <div>
          <p className="font-bold text-amber-200">Manteca de cerdo</p>
          <p className="text-xs text-stone-200">
            puede funcionar como 5 comidas
          </p>
        </div>
      );
    case 12:
      return <p className="font-bold text-amber-200">Tienda de campaña</p>;
    default:
      return <p className="font-bold text-amber-200">{item2.nombre}</p>;
  }
}
