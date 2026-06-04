import { useState, useEffect } from "react";
import "./App.css";
import LoginScreen from "./screens/LoginScreen";
import AdminPanelScreen from "./screens/AdminPanelScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import CharactersScreen from "./screens/CharactersScreen";
import CampaignsScreen from "./screens/CampaignsScreen.tsx";
import type { CampaignCreationSystem } from "./components/campaignSystem";
import CreateCampaignScreen from "./screens/CreateCampaignScreen";
import CampaignHomeScreen from "./screens/campaign/CampaignHomeScreen";
import CampaignPestañaScreen from "./screens/campaign/CampaignPestañaScreen";
import CreateDndCharacterScreen from "./screens/personaje/creatednd/CreateDndCharacterScreen";
import CreateMorkBorgCharacterScreen from "./screens/personaje/createmorkborg/CreateMorkBorgCharacterScreen";
import DndCharacterSheetScreen from "./screens/personaje/dndcharactersheet/DndCharacterSheetScreen";
import MorkBorgCharacterSheetScreen from "./screens/personaje/morkborgcharactersheet/MorkBorgCharacterSheetScreen";
import { buildApiUrl } from "./lib/api";
type AuthMode =
  | "login"
  | "register"
  | "home"
  | "admin-panel"
  | "campaigns"
  | "campaign-create"
  | "campaign-home"
  | "campaign-pestaña"
  | "characters"
  | "character-create-dnd"
  | "character-create-morkborg"
  | "character-sheet-dnd"
  | "character-sheet-morkborg";

function App() {
  const storedToken = localStorage.getItem("jwtToken");
  const storedUsername = localStorage.getItem("username") || "Usuario";
  const storedAvatar = localStorage.getItem("avatar") || "";
  const [token, setToken] = useState<string | null>(storedToken);
  const [username, setUsername] = useState<string>(storedUsername);
  const [avatarUrl, setAvatarUrl] = useState<string>(storedAvatar);
  const [mode, setMode] = useState<AuthMode>(storedToken ? "home" : "login");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );
  const [selectedCampaignSystem, setSelectedCampaignSystem] =
    useState<CampaignCreationSystem>("Dungeons and Dragons");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );

  // Detección de link de invitación: ?join={campaignId}
  const [pendingJoinId, setPendingJoinId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get("join");
  });

  // Cuando hay token + pendingJoinId: unirse automáticamente y abrir la campaña
  useEffect(() => {
    if (!token || !pendingJoinId) return;
    const doJoin = async () => {
      try {
        await fetch(buildApiUrl(`/api/campanas/${pendingJoinId}/unirse`), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignorar errores de red; el usuario podrá entrar desde campañas
      }
      setPendingJoinId(null);
      window.history.replaceState({}, "", window.location.pathname);
      // Ir directamente al CampaignHomeScreen de esa campaña
      setSelectedCampaignId(pendingJoinId);
      setMode("campaign-home");
    };
    void doJoin();
  }, [token, pendingJoinId]);

  const handleGoHome = () => {
    if (token) {
      setMode("home");
      return;
    }

    setMode("login");
  };

  const handleGoCharacters = () => {
    if (token) {
      setMode("characters");
      return;
    }

    setMode("login");
  };

  const handleGoCampaigns = () => {
    if (token) {
      setMode("campaigns");
      return;
    }

    setMode("login");
  };

  const handleGoCreateCampaign = (system: CampaignCreationSystem) => {
    if (token) {
      setSelectedCampaignSystem(system);
      setMode("campaign-create");
      return;
    }

    setMode("login");
  };

  const handleOpenCampaignHome = (campaignId: string) => {
    if (token) {
      setSelectedCampaignId(campaignId);
      setMode("campaign-home");
      return;
    }

    setMode("login");
  };

  const handleOpenCampaignPestaña = () => {
    if (token && selectedCampaignId) {
      setMode("campaign-pestaña");
      return;
    }

    setMode("login");
  };

  const handleBackToCampaignHome = () => {
    if (token && selectedCampaignId) {
      setMode("campaign-home");
      return;
    }

    setMode("campaigns");
  };

  const handleGoCreateDndCharacter = () => {
    if (token) {
      setMode("character-create-dnd");
      return;
    }

    setMode("login");
  };

  const handleGoCreateMorkBorgCharacter = () => {
    if (token) {
      setMode("character-create-morkborg");
      return;
    }

    setMode("login");
  };

  const handleOpenDndCharacterSheet = (characterId: string) => {
    if (token) {
      setSelectedCharacterId(characterId);
      setMode("character-sheet-dnd");
      return;
    }

    setMode("login");
  };

  const handleOpenMorkBorgCharacterSheet = (characterId: string) => {
    if (token) {
      setSelectedCharacterId(characterId);
      setMode("character-sheet-morkborg");
      return;
    }

    setMode("login");
  };

  const handleLoginSuccess = (
    newToken: string,
    user: string,
    newAvatarUrl: string,
    role: string,
  ) => {
    setToken(newToken);
    setUsername(user);
    setAvatarUrl(newAvatarUrl);
    localStorage.setItem("username", user);
    localStorage.setItem("avatar", newAvatarUrl);
    setMode(role === "ADMIN" ? "admin-panel" : "home");
  };

  const handleRegisterSuccess = () => {
    setMode("login");
  };

  const handleLogout = () => {
    setToken(null);
    setUsername("Usuario");
    setAvatarUrl("");
    setSelectedCharacterId(null);
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("username");
    localStorage.removeItem("avatar");
    setMode("login");
  };

  return (
    <>
      {mode === "login" && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setMode("register")}
          onGoHome={handleGoHome}
          joinMessage={
            pendingJoinId
              ? "Inicia sesión para unirte a la campaña invitada"
              : undefined
          }
        />
      )}
      {mode === "register" && (
        <RegisterScreen
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setMode("login")}
          onGoHome={handleGoHome}
        />
      )}
      {mode === "home" && token && (
        <HomeScreen
          username={username}
          avatarUrl={avatarUrl}
          onLogout={handleLogout}
          onGoHome={handleGoHome}
          onGoCampaigns={handleGoCampaigns}
          onGoCharacters={handleGoCharacters}
          onCreateCampaign={handleGoCreateCampaign}
          onOpenCampaignHome={handleOpenCampaignHome}
        />
      )}
      {mode === "admin-panel" && token && (
        <AdminPanelScreen
          token={token}
          username={username}
          avatarUrl={avatarUrl}
          onLogout={handleLogout}
        />
      )}
      {mode === "campaigns" && token && (
        <CampaignsScreen
          username={username}
          avatarUrl={avatarUrl}
          onLogout={handleLogout}
          onGoHome={handleGoHome}
          onGoCampaigns={handleGoCampaigns}
          onGoCharacters={handleGoCharacters}
          onCreateCampaign={handleGoCreateCampaign}
          onOpenCampaignHome={handleOpenCampaignHome}
        />
      )}
      {mode === "campaign-create" && token && (
        <CreateCampaignScreen
          username={username}
          avatarUrl={avatarUrl}
          onLogout={handleLogout}
          onGoHome={handleGoHome}
          onGoCampaigns={handleGoCampaigns}
          onGoCharacters={handleGoCharacters}
          initialSystem={selectedCampaignSystem}
          onCampaignCreated={handleOpenCampaignHome}
        />
      )}
      {mode === "campaign-home" && token && selectedCampaignId && (
        <CampaignHomeScreen
          campaignId={selectedCampaignId}
          onExit={handleGoCampaigns}
          onOpenCampaignPestaña={handleOpenCampaignPestaña}
        />
      )}
      {mode === "campaign-pestaña" && token && selectedCampaignId && (
        <CampaignPestañaScreen
          campaignId={selectedCampaignId}
          username={username}
          avatarUrl={avatarUrl}
          onLogout={handleLogout}
          onGoHome={handleGoHome}
          onGoCampaigns={handleGoCampaigns}
          onBack={handleBackToCampaignHome}
        />
      )}
      {mode === "characters" && token && (
        <CharactersScreen
          username={username}
          avatarUrl={avatarUrl}
          onLogout={handleLogout}
          onGoHome={handleGoHome}
          onGoCampaigns={handleGoCampaigns}
          onGoCharacters={handleGoCharacters}
          onCreateDndCharacter={handleGoCreateDndCharacter}
          onCreateMorkBorgCharacter={handleGoCreateMorkBorgCharacter}
          onOpenDndCharacterSheet={handleOpenDndCharacterSheet}
          onOpenMorkBorgCharacterSheet={handleOpenMorkBorgCharacterSheet}
        />
      )}
      {mode === "character-create-dnd" && token && (
        <CreateDndCharacterScreen
          username={username}
          avatarUrl={avatarUrl}
          onLogout={handleLogout}
          onGoHome={handleGoHome}
          onGoCampaigns={handleGoCampaigns}
          onGoCharacters={handleGoCharacters}
          onCharacterCreated={handleOpenDndCharacterSheet}
        />
      )}
      {mode === "character-create-morkborg" && token && (
        <CreateMorkBorgCharacterScreen
          username={username}
          avatarUrl={avatarUrl}
          onLogout={handleLogout}
          onGoHome={handleGoHome}
          onGoCampaigns={handleGoCampaigns}
          onGoCharacters={handleGoCharacters}
        />
      )}
      {mode === "character-sheet-dnd" && token && selectedCharacterId && (
        <DndCharacterSheetScreen
          username={username}
          avatarUrl={avatarUrl}
          characterId={selectedCharacterId}
          onLogout={handleLogout}
          onGoHome={handleGoHome}
          onGoCampaigns={handleGoCampaigns}
          onGoCharacters={handleGoCharacters}
        />
      )}
      {mode === "character-sheet-morkborg" && token && selectedCharacterId && (
        <MorkBorgCharacterSheetScreen
          username={username}
          avatarUrl={avatarUrl}
          characterId={selectedCharacterId}
          onLogout={handleLogout}
          onGoHome={handleGoHome}
          onGoCampaigns={handleGoCampaigns}
          onGoCharacters={handleGoCharacters}
        />
      )}
    </>
  );
}

export default App;
