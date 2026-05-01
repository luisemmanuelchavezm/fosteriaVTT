import { useState } from "react";
import "./App.css";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import CharactersScreen from "./screens/CharactersScreen";
import CampaignsScreen from "./screens/CampaignsScreen.tsx";
import CreateDndCharacterScreen from "./screens/personaje/CreateDndCharacterScreen";
import DndCharacterSheetScreen from "./screens/personaje/DndCharacterSheetScreen";

type AuthMode =
  | "login"
  | "register"
  | "home"
  | "campaigns"
  | "characters"
  | "character-create-dnd"
  | "character-sheet-dnd";

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

  const handleGoCreateDndCharacter = () => {
    if (token) {
      setMode("character-create-dnd");
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

  const handleLoginSuccess = (
    newToken: string,
    user: string,
    newAvatarUrl: string,
  ) => {
    setToken(newToken);
    setUsername(user);
    setAvatarUrl(newAvatarUrl);
    localStorage.setItem("username", user);
    localStorage.setItem("avatar", newAvatarUrl);
    setMode("home");
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
          onOpenDndCharacterSheet={handleOpenDndCharacterSheet}
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
    </>
  );
}

export default App;
