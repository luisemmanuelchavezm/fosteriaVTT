import DndCharacterSheetScreen from "../../personaje/dndcharactersheet/DndCharacterSheetScreen";

interface CharacterSheetModalProps {
  characterId: number;
  username: string;
  avatarUrl: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onClose: () => void;
}

/** Modal que muestra la hoja de personaje completa encima del tablero. */
export default function CharacterSheetModal({
  characterId,
  username,
  avatarUrl,
  onLogout,
  onGoHome,
  onGoCampaigns,
  onClose,
}: CharacterSheetModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative h-[92vh] w-[min(1500px,96vw)] overflow-hidden rounded-[28px] border border-white/15 bg-[linear-gradient(180deg,rgba(18,18,18,0.98)_0%,rgba(10,10,10,0.99)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-[60] rounded-full border border-white/25 bg-black/60 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80"
        >
          Cerrar
        </button>

        <div className="h-full overflow-auto">
          <DndCharacterSheetScreen
            username={username}
            avatarUrl={avatarUrl}
            characterId={String(characterId)}
            onLogout={onLogout}
            onGoHome={onGoHome}
            onGoCampaigns={onGoCampaigns}
            onGoCharacters={onClose}
            modalMode
          />
        </div>
      </div>
    </div>
  );
}
