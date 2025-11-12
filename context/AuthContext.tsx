import { createContext } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  rememberMe: boolean;
  setRememberMe: (rememberMe: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  rememberMe: false,
  setRememberMe: () => {},
});

export default AuthContext;
