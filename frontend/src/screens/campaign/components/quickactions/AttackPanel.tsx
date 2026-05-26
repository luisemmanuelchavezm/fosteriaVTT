import type { AttackRollAction, WeaponOption } from "./attackTypes";

interface AttackPanelProps {
  isLoadingDetail: boolean;
  weaponOptions: WeaponOption[];
  selectedWeapon: WeaponOption | null;
  attackRollActions: AttackRollAction[];
  onSelectWeapon: (id: number) => void;
}

export default function AttackPanel({
  isLoadingDetail,
  weaponOptions,
  selectedWeapon,
  attackRollActions,
  onSelectWeapon,
}: AttackPanelProps) {
  return (
    <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-max max-w-[90vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-3 shadow-2xl">
      {!selectedWeapon && (
        <>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
            Armas
          </p>

          {isLoadingDetail ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
              Cargando armas...
            </div>
          ) : weaponOptions.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
              Este personaje no tiene armas en su mochila.
            </div>
          ) : (
            <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
              {weaponOptions.map((weapon) => (
                <button
                  key={weapon.id}
                  type="button"
                  onClick={() => onSelectWeapon(weapon.id)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/80 transition-colors hover:bg-white/10"
                >
                  {weapon.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selectedWeapon ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100/85">
            {selectedWeapon.name}
          </p>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {attackRollActions.map((rollAction) => (
              <button
                key={rollAction.id}
                type="button"
                onClick={rollAction.onClick}
                className="group flex shrink-0 flex-col items-center gap-1 rounded-lg px-1 py-1 transition-colors"
                title={rollAction.label}
              >
                <img
                  src={rollAction.image}
                  alt={rollAction.label}
                  className="h-16 w-16 object-cover rounded-2xl"
                />
                <span className="block text-[10px] leading-tight text-white/80 group-hover:text-amber-100">
                  {rollAction.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
