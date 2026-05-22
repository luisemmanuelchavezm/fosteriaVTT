import { useState } from "react";
import navBarImage from "../assets/NavBar.png";
import campaignsOffImage from "../assets/botones/Apagado campañas.png";
import homeOffImage from "../assets/botones/Apagado home.png";
import charactersOffImage from "../assets/botones/Apagado personajes.png";
import campaignsOnImage from "../assets/botones/Prendido campaña.png";
import homeOnImage from "../assets/botones/Prendido home.png";
import charactersOnImage from "../assets/botones/Prendido personajes.png";

export type NavTab = "campaigns" | "home" | "characters";

interface HomeNavbarProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
}

const navItems: Array<{
  id: NavTab;
  label: string;
  onImage: string;
  offImage: string;
}> = [
  {
    id: "home",
    label: "Home",
    onImage: homeOnImage,
    offImage: homeOffImage,
  },
  {
    id: "campaigns",
    label: "Campañas",
    onImage: campaignsOnImage,
    offImage: campaignsOffImage,
  },
  {
    id: "characters",
    label: "Personajes",
    onImage: charactersOnImage,
    offImage: charactersOffImage,
  },
];

export default function HomeNavbar({
  activeTab: activeTabProp = "home",
  onTabChange,
}: HomeNavbarProps) {
  const [internalTab, setInternalTab] = useState<NavTab>(activeTabProp);
  const activeTab = onTabChange ? activeTabProp : internalTab;

  const handleTabChange = (tab: NavTab) => {
    if (onTabChange) {
      onTabChange(tab);
      return;
    }

    setInternalTab(tab);
  };

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 w-[min(360px,calc(100vw-2rem))] -translate-x-1/2 sm:bottom-6 sm:w-[390px]">
      <div className="relative mx-auto aspect-[390/107] w-full drop-shadow-[0_18px_32px_rgba(0,0,0,0.45)]">
        <img
          src={navBarImage}
          alt="Barra de navegacion"
          className="pointer-events-none h-full w-full object-contain select-none"
          draggable={false}
        />

        <div className="pointer-events-auto absolute inset-x-[8%] inset-y-[18%] flex items-center justify-between gap-3 px-2 sm:inset-x-[10%] sm:px-4">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                aria-pressed={isActive}
                aria-label={`Ir a ${item.label}`}
                className="flex h-full flex-1 items-center justify-center rounded-full bg-transparent transition duration-200 hover:-translate-y-1"
              >
                <img
                  src={isActive ? item.onImage : item.offImage}
                  alt={item.label}
                  className="max-h-[68%] w-auto object-contain select-none"
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
