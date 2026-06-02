import MorkBorgEnemySheetContent from "./components/MorkBorgEnemySheetContent";
import { ChevronLeft } from "lucide-react";
import HomeNavbar from "../../../components/HomeNavbar";
import LogoLayout from "../../../components/LogoLayout";
import UserMenu from "../../../components/UserMenu";
import DiceRollOverlay from "../../../components/dice/DiceRollOverlay";
import { getMBRasgosClase } from "../utils/mbApi";
import MorkBorgImprovementModal from "./components/MorkBorgImprovementModal";
import MorkBorgClassTraitsCatalogModal from "./components/MorkBorgClassTraitsCatalogModal";
import MorkBorgScrollCatalogModal from "./components/MorkBorgScrollCatalogModal";
import { createPortal } from "react-dom";
import MorkBorgIdentitySection from "./components/MorkBorgIdentitySection";
import MorkBorgInventoryCatalogModal from "./components/MorkBorgInventoryCatalogModal";
import MorkBorgStatisticsSection from "./components/MorkBorgStatisticsSection";
import MorkBorgSuppliesSection from "./components/MorkBorgSuppliesSection";
import MorkBorgTraitsAndScrollsSection from "./components/MorkBorgTraitsAndScrollsSection";
import { useMorkBorgCharacterSheet } from "./useMorkBorgCharacterSheet";

interface MorkBorgCharacterSheetScreenProps {
  username: string;
  avatarUrl: string;
  characterId: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onGoCharacters: () => void;
  modalMode?: boolean;
}

export default function MorkBorgCharacterSheetScreen({
  username,
  avatarUrl,
  characterId,
  onLogout,
  onGoHome,
  onGoCampaigns,
  onGoCharacters,
  modalMode = false,
}: MorkBorgCharacterSheetScreenProps) {
  const {
    character,
    setCharacter,
    isLoading,
    loadError,
    token,
    classId,
    isOwner,
    isEditMode,
    setIsEditMode,
    editableName,
    setEditableName,
    pendingStatMods,
    editableMaxHp,
    setEditableMaxHp,
    currentHp,
    totalHp,
    hpDelta,
    setHpDelta,
    sanitize,
    plata,
    comida,
    presagios,
    carga,
    decocciones,
    isImprovementModalOpen,
    setIsImprovementModalOpen,
    isClassTraitsCatalogOpen,
    setIsClassTraitsCatalogOpen,
    isScrollCatalogOpen,
    setIsScrollCatalogOpen,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    deleteConfirmText,
    setDeleteConfirmText,
    isInventoryCatalogOpen,
    setIsInventoryCatalogOpen,
    diceBoxHostId,
    diceBoxError,
    isRolling,
    isRollingPresagios,
    overlayDisplaySummary,
    handleHeal,
    handleDamage,
    handleRollStat,
    handleRollPresagios,
    handleAdjustSupply,
    handleSetPlata,
    handleSetComida,
    handleAdjustDecoccion,
    handleSetDecoccion,
    handleSaveEdit,
    handleCancelEdit,
    handleAddInventoryItem,
    handleDeleteInventoryItem,
    handleSaveMejora,
    handleSaveEscoriaEspecialidades,
    handleShortRest,
    handleLongRest,
    handleAdjustStat,
    handleDeleteClassTrait,
    handleDeleteClassItem,
    handleAddClassTrait,
    handleAddClassItem,
    handleCreateCustomTrait,
    handlePortraitChange,
    handleDeleteCharacter,
    handleNavChange,
  } = useMorkBorgCharacterSheet({
    characterId,
    username,
    onGoHome,
    onGoCampaigns,
    onGoCharacters,
  });

  const content = (
    <>
      <DiceRollOverlay
        diceBoxHostId={diceBoxHostId}
        diceBoxError={diceBoxError}
        isRolling={isRolling}
        summary={overlayDisplaySummary}
      />

      {!modalMode && (
        <UserMenu
          username={username}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />
      )}

      {token ? (
        <MorkBorgInventoryCatalogModal
          token={token}
          isOpen={isInventoryCatalogOpen}
          onClose={() => setIsInventoryCatalogOpen(false)}
          onAddItem={handleAddInventoryItem}
        />
      ) : null}

      <div
        className={
          modalMode
            ? "relative z-10 w-full px-4 py-4"
            : "relative z-10 w-full px-4 pb-32 pt-28 md:px-8 md:pb-36 xl:w-[125%] xl:[zoom:0.8]"
        }
      >
        <div className="relative overflow-hidden rounded-[32px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.96)_0%,rgba(28,25,23,0.92)_48%,rgba(10,10,10,0.98)_100%)] p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8">
          <div className="pointer-events-none absolute -top-20 right-[-50px] h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-90px] left-[-30px] h-64 w-64 rounded-full bg-stone-300/10 blur-3xl" />

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-rose-200/80">
                Mork Borg
              </p>
              <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
                Hoja de personaje
              </h1>
            </div>
            {!modalMode && (
              <button
                type="button"
                onClick={onGoCharacters}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300/15 bg-stone-950/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-rose-300/25 hover:bg-stone-900"
              >
                <ChevronLeft className="h-4 w-4" />
                Volver a personajes
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="mt-8 rounded-[26px] border border-white/10 bg-black/20 px-6 py-10 text-center text-sm text-stone-300">
              Cargando hoja del personaje...
            </div>
          ) : null}

          {!isLoading && loadError ? (
            <div className="mt-8 rounded-[26px] border border-rose-400/35 bg-rose-950/25 px-6 py-5 text-sm font-medium text-rose-100">
              {loadError}
            </div>
          ) : null}

          {!isLoading &&
          !loadError &&
          character &&
          (character.tipo === "enemigo" || character.tipo === "PNJ") ? (
            <MorkBorgEnemySheetContent
              character={character}
              characterId={characterId}
              onCharacterUpdate={setCharacter}
            />
          ) : null}

          {!isLoading &&
          !loadError &&
          character &&
          character.tipo !== "enemigo" &&
          character.tipo !== "PNJ" ? (
            <div className="mt-8 space-y-8">
              {isImprovementModalOpen && character && (
                <MorkBorgImprovementModal
                  currentMods={{
                    fuerza: character.estadisticas["MB_ModFuerza"] ?? 0,
                    agilidad: character.estadisticas["MB_ModAgilidad"] ?? 0,
                    presencia: character.estadisticas["MB_ModPresencia"] ?? 0,
                    resistencia:
                      character.estadisticas["MB_ModResistencia"] ?? 0,
                  }}
                  currentMaxHp={totalHp}
                  classId={classId}
                  characterAbilities={character.habilidades}
                  onClose={() => setIsImprovementModalOpen(false)}
                  onSave={handleSaveMejora}
                  onSaveEscoriaEspecialidades={handleSaveEscoriaEspecialidades}
                />
              )}
              <MorkBorgIdentitySection
                character={character}
                editableName={editableName}
                isEditMode={isEditMode}
                isOwner={isOwner}
                onShortRest={handleShortRest}
                onLongRest={handleLongRest}
                onToggleEditMode={() => setIsEditMode((v) => !v)}
                onDeleteCharacter={() => {
                  setIsDeleteConfirmOpen(true);
                  setDeleteConfirmText("");
                }}
                onMejorar={() => {
                  setIsImprovementModalOpen(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onEditableNameChange={setEditableName}
                onSaveEdit={() => void handleSaveEdit()}
                onCancelEdit={handleCancelEdit}
                onPortraitChange={handlePortraitChange}
              />
              <MorkBorgStatisticsSection
                character={character}
                isEditMode={isEditMode}
                editableMaxHp={editableMaxHp}
                currentHp={currentHp}
                totalHp={totalHp}
                hpDelta={hpDelta}
                carga={carga}
                pendingStatMods={pendingStatMods}
                onHpDeltaChange={(v) => setHpDelta(sanitize(v))}
                onHeal={handleHeal}
                onDamage={handleDamage}
                onIncrementHpDelta={() =>
                  setHpDelta((v) => String((Number.parseInt(v, 10) || 0) + 1))
                }
                onDecrementHpDelta={() =>
                  setHpDelta((v) =>
                    String(Math.max(0, (Number.parseInt(v, 10) || 0) - 1)),
                  )
                }
                onMaxHpChange={(v) => setEditableMaxHp(v)}
                onRollStat={handleRollStat}
                onAdjustStat={handleAdjustStat}
                onDeleteItem={(itemId) =>
                  void handleDeleteInventoryItem(itemId)
                }
                onOpenCatalog={() => setIsInventoryCatalogOpen(true)}
                suppliesSlot={
                  <MorkBorgSuppliesSection
                    plata={plata}
                    comida={comida}
                    presagios={presagios}
                    decocciones={decocciones}
                    isRollingPresagios={isRollingPresagios}
                    onAdjust={handleAdjustSupply}
                    onSetPlata={handleSetPlata}
                    onSetComida={handleSetComida}
                    onAdjustDecoccion={handleAdjustDecoccion}
                    onSetDecoccion={handleSetDecoccion}
                    onRollPresagios={handleRollPresagios}
                  />
                }
              />
              {isScrollCatalogOpen && character && (
                <MorkBorgScrollCatalogModal
                  token={token ?? ""}
                  characterAbilityIds={character.habilidades.map((h) => h.id)}
                  fetchCatalog={getMBRasgosClase}
                  onAdd={handleAddClassTrait}
                  onClose={() => setIsScrollCatalogOpen(false)}
                />
              )}
              {isClassTraitsCatalogOpen && character && (
                <MorkBorgClassTraitsCatalogModal
                  token={token ?? ""}
                  characterAbilityIds={character.habilidades.map((h) => h.id)}
                  characterItemIds={character.mochila
                    .filter((item) =>
                      [
                        "DesertorItemIdx",
                        "RealezaItemIdx",
                        "SacerdoteItemIdx",
                        "ErmitanoEspecialidadIdx",
                        "ArmaEspecial",
                        "ItemEspecial",
                      ].some((kw) => item.tags?.includes(kw)),
                    )
                    .map((item) => item.objetoId ?? item.id)}
                  fetchCatalog={getMBRasgosClase}
                  onAddAbility={handleAddClassTrait}
                  onAddItem={handleAddClassItem}
                  onCreateCustom={handleCreateCustomTrait}
                  onClose={() => setIsClassTraitsCatalogOpen(false)}
                />
              )}
              <MorkBorgTraitsAndScrollsSection
                character={character}
                isOwner={isOwner}
                onOpenClassTraitsCatalog={() =>
                  setIsClassTraitsCatalogOpen(true)
                }
                onOpenScrollCatalog={() => setIsScrollCatalogOpen(true)}
                onDeleteClassTrait={(id) => void handleDeleteClassTrait(id)}
                onDeleteClassItem={(id) => void handleDeleteClassItem(id)}
                onDeleteScroll={(id) => void handleDeleteClassTrait(id)}
              />
            </div>
          ) : null}
        </div>
      </div>

      {!modalMode && (
        <HomeNavbar activeTab="characters" onTabChange={handleNavChange} />
      )}

      {/* Modal de confirmación de borrado */}
      {isDeleteConfirmOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            onClick={() => setIsDeleteConfirmOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-[24px] border border-rose-500/30 bg-[#1a0a0a] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-rose-200">
                Eliminar personaje
              </h3>
              <p className="mt-2 text-sm text-stone-400">
                Esta acción es irreversible. Escribe{" "}
                <span className="font-bold text-white">borrar</span> para
                confirmar.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="borrar"
                className="mt-4 h-10 w-full rounded-xl border border-white/20 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-rose-400/60"
              />
              <div className="mt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-stone-300 hover:bg-white/5 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmText !== "borrar"}
                  onClick={() => void handleDeleteCharacter()}
                  className="rounded-full border border-rose-500/40 bg-rose-950/50 px-4 py-2 text-sm font-bold text-rose-200 transition hover:bg-rose-900/60 disabled:opacity-40"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );

  if (modalMode) return <div className="w-full">{content}</div>;
  return (
    <LogoLayout onLogoClick={onGoHome} fullWidth>
      {content}
    </LogoLayout>
  );
}
