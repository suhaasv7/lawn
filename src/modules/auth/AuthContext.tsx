import { createContext, useContext, useState, ReactNode } from "react";
import { CredentialResponse } from "@react-oauth/google";

interface User {
  name: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  showSignIn: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;
  logout: () => void;
  handleGoogleSuccess: (response: CredentialResponse) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    const { data, expiry } = JSON.parse(saved);
    if (Date.now() > expiry) {
      localStorage.removeItem("user");
      return null;
    }
    return data;
  });
  const [showSignIn, setShowSignIn] = useState(false);

  const handleGoogleSuccess = (response: CredentialResponse) => {
    if (response.credential) {
      const payload = JSON.parse(atob(response.credential.split(".")[1]));
      console.log("Google Sign-In payload:", payload);
      const userData = { name: payload.name, picture: payload.picture };
      const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
      localStorage.setItem("user", JSON.stringify({ data: userData, expiry }));
      setUser(userData);
      setShowSignIn(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        showSignIn,
        openSignIn: () => setShowSignIn(true),
        closeSignIn: () => setShowSignIn(false),
        logout: () => {
          localStorage.removeItem("user");
          setUser(null);
        },
        handleGoogleSuccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
