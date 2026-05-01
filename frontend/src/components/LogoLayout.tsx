import fondoImage from "../assets/Fondo login.jpeg";
import logoImage from "../assets/Logo.png";

interface AuthLayoutProps {
  children: React.ReactNode;
  onLogoClick?: () => void;
  fullWidth?: boolean;
  hideLogo?: boolean;
}

export default function LogoLayout({
  children,
  onLogoClick,
  fullWidth = false,
  hideLogo = false,
}: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${fondoImage})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* Logo pegado al borde superior, centrado, sin mover nada debajo */}
      {!hideLogo ? (
        <button
          type="button"
          onClick={onLogoClick}
          disabled={!onLogoClick}
          aria-label="Ir a la pantalla de inicio"
          className="absolute top-0 left-1/2 z-20 -translate-x-1/2 transition-transform duration-200 enabled:hover:scale-[1.03] disabled:cursor-default"
        >
          <img
            src={logoImage}
            alt="Logo"
            className="h-28 w-auto object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
          />
        </button>
      ) : null}

      {/* Contenedor del Formulario */}
      <div
        className={`relative z-10 flex flex-grow items-center justify-center pb-10 ${
          fullWidth ? "w-full max-w-none" : "w-full max-w-4xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
