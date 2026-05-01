import FeatDetailModal from "./FeatDetailModal";
import SpellDetailModal from "../../../../components/spells/SpellDetailModal";
import type {
  DndCharacterDetailResponse,
  LevelUpDndCharacterRequest,
} from "../../utils/dndApi";
import LevelUpAsiSection from "./levelUp/LevelUpAsiSection";
import LevelUpSelectionColumn from "./levelUp/LevelUpSelectionColumn";
import LevelUpSummaryColumn from "./levelUp/LevelUpSummaryColumn";
import { useLevelUpModalState } from "../hooks/useLevelUpModalState";

interface LevelUpModalProps {
  token: string;
  character: DndCharacterDetailResponse;
  classCompetencies: string[];
  isOpen: boolean;
  mode: "up" | "down";
  onClose: () => void;
  onSubmit: (payload: LevelUpDndCharacterRequest) => Promise<void>;
  onLevelDown: (classId: string) => Promise<void>;
}

export default function LevelUpModal(props: LevelUpModalProps) {
  const controller = useLevelUpModalState(props);

  if (!props.isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/85 px-4 py-6 backdrop-blur-md">
      <SpellDetailModal
        spell={controller.selectedSpell}
        isOpen={controller.selectedSpell !== null}
        onClose={controller.closeSpellDetail}
        onRollExpression={() => undefined}
      />
      <FeatDetailModal
        feat={controller.selectedFeatDetail}
        isOpen={controller.selectedFeatDetail !== null}
        onClose={() => controller.setSelectedFeatDetail(null)}
      />
      <div className="mx-auto w-full max-w-6xl rounded-[30px] border border-stone-300/12 bg-[linear-gradient(180deg,rgba(12,10,9,0.98),rgba(28,25,23,0.96))] p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)] md:p-8">
        <div className="flex flex-col gap-4 border-b border-stone-300/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-amber-200/75">
              Avance de personaje
            </p>
            <h3 className="mt-2 text-3xl font-bold text-white">
              {controller.isDownMode ? "Bajar de nivel" : "Subir de nivel"}
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
              {controller.isDownMode
                ? "Elige una clase existente del personaje para retirarle un nivel. Solo aparecen clases con nivel actual igual o superior a 1."
                : "Elige una clase existente o añade una nueva clase. Si alguna clase o dote no cumple requisitos, se marca como advertencia homebrew pero sigue siendo seleccionable."}
            </p>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-stone-100"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <LevelUpSelectionColumn
            controller={controller}
            character={props.character}
            token={props.token}
            asiSection={<LevelUpAsiSection controller={controller} />}
          />
          <LevelUpSummaryColumn
            controller={controller}
            onClose={props.onClose}
          />
        </div>
      </div>
    </div>
  );
}
