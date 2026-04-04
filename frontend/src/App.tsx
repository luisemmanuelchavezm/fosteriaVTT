import { useState } from "react";
import "./App.css";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";

type AuthMode = "login" | "register" | "home";

function App() {
  const storedToken = localStorage.getItem("jwtToken");
  const storedUsername = localStorage.getItem("username") || "Usuario";
  const [token, setToken] = useState<string | null>(storedToken);
  const [username, setUsername] = useState<string>(storedUsername);
  const [mode, setMode] = useState<AuthMode>(storedToken ? "home" : "login");

  const handleLoginSuccess = (newToken: string, user: string) => {
    setToken(newToken);
    setUsername(user);
    localStorage.setItem("username", user);
    setMode("home");
  };

  const handleRegisterSuccess = () => {
    setMode("login");
  };

  const handleLogout = () => {
    setToken(null);
    setUsername("");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("username");
    setMode("login");
  };

  return (
    <>
      {mode === "login" && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setMode("register")}
        />
      )}
      {mode === "register" && (
        <RegisterScreen
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setMode("login")}
        />
      )}
      {mode === "home" && token && (
        <HomeScreen username={username} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;
