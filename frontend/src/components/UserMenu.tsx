import { useEffect, useRef, useState } from "react";
import EditProfileModal from "./EditProfileModal";

interface UserMenuProps {
  username: string;
  onLogout: () => void;
  avatarUrl: string;
  hideEditProfile?: boolean;
}

function buildAvatarUrl(avatarUrl: string) {
  if (!avatarUrl.includes("/image/upload/")) {
    return avatarUrl;
  }

  return avatarUrl.replace(
    "/image/upload/",
    "/image/upload/f_auto,q_auto,w_160,h_160,c_fill,g_auto/",
  );
}

export default function UserMenu({
  username,
  onLogout,
  avatarUrl,
  hideEditProfile = false,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [liveUsername, setLiveUsername] = useState(username);
  const [liveAvatar, setLiveAvatar] = useState(avatarUrl);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLiveUsername(username);
  }, [username]);
  useEffect(() => {
    setLiveAvatar(avatarUrl);
  }, [avatarUrl]);

  const optimizedAvatarUrl = buildAvatarUrl(liveAvatar);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const handleProfileUpdated = (newUsername: string, newAvatar: string) => {
    setLiveUsername(newUsername);
    setLiveAvatar(newAvatar);
  };

  return (
    <>
      <div
        ref={menuRef}
        className="fixed right-3 top-2 z-50 md:right-6 md:top-3"
      >
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label="Abrir menú de usuario"
          className="flex flex-col items-center transition duration-200 hover:scale-[1.03]"
        >
          <img
            src={optimizedAvatarUrl}
            alt={liveUsername}
            className="h-16 w-16 rounded-full border-4 border-amber-200/80 object-cover shadow-[0_10px_24px_rgba(0,0,0,0.45)] md:h-20 md:w-20"
            referrerPolicy="no-referrer"
          />
          <span className="mt-2 max-w-[96px] truncate text-center text-xs font-semibold text-amber-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)] sm:text-sm">
            {liveUsername}
          </span>
        </button>

        {isOpen ? (
          <div
            role="menu"
            className="absolute right-0 mt-3 min-w-[180px] overflow-hidden rounded-[18px] border border-amber-200/20 bg-stone-950/95 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            {!hideEditProfile && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    setShowEditModal(true);
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-stone-100 transition hover:bg-white/10"
                >
                  Editar perfil
                </button>
                <div className="h-px bg-stone-800/60 mx-3" />
              </>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="w-full px-4 py-3 text-left text-sm font-semibold text-stone-400 transition hover:bg-white/10 hover:text-stone-100"
            >
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentUsername={liveUsername}
        currentAvatarUrl={liveAvatar}
        onSuccess={handleProfileUpdated}
        onAccountDeleted={onLogout}
      />
    </>
  );
}
