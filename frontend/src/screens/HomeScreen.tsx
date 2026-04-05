import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import fondoImage from "../assets/Fondo login.jpeg";

interface HomeScreenProps {
  username: string;
  onLogout: () => void;
}

export default function HomeScreen({ username, onLogout }: HomeScreenProps) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${fondoImage})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Contenido Principal */}
      <div className="relative z-10 w-full max-w-2xl">
        <Card className="border-none shadow-2xl backdrop-blur-sm bg-white/95">
          <div className="p-12">
            <div className="text-center space-y-6">
              <h1 className="text-4xl font-bold text-gray-900">
                ¡Bienvenido a FosteriaVTT!
              </h1>

              <div className="space-y-3 text-gray-700">
                <p className="text-lg">
                  Hola{" "}
                  <span className="font-bold text-primary">{username}</span>,
                  estás logueado correctamente.
                </p>
                <p className="text-base text-gray-600">
                  La plataforma está en construcción. Pronto tendrás acceso a
                  todas las funcionalidades para gestionar tus campañas y
                  personajes.
                </p>
              </div>

              {/* Información de estado */}
              <div className="grid grid-cols-3 gap-4 py-8 border-y border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-sm text-gray-600">Campañas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-sm text-gray-600">Personajes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-sm text-gray-600">Sesiones</p>
                </div>
              </div>

              {/* Botón Cerrar Sesión */}
              <Button
                onClick={onLogout}
                variant="destructive"
                className="w-full h-11 font-semibold text-base"
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
