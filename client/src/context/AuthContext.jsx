import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
} from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("moneymate_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem("moneymate_token");

        // No token = user is not logged in
        if (!storedToken) {
          setUser(null);
          setToken(null);
          return;
        }

        const response = await getCurrentUser();

        if (response?.user) {
          setUser(response.user);
          setToken(storedToken);

          localStorage.setItem(
            "moneymate_user",
            JSON.stringify(response.user)
          );
        } else {
          throw new Error("User not found");
        }
      } catch (error) {
        console.error(
          "Session restore failed:",
          error
        );

        localStorage.removeItem(
          "moneymate_token"
        );

        localStorage.removeItem(
          "moneymate_user"
        );

        setUser(null);
        setToken(null);
      } finally {
        // CRITICAL:
        // Loading must ALWAYS stop.
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const register = async (formData) => {
    const response = await registerUser(formData);

    if (response?.token) {
      localStorage.setItem(
        "moneymate_token",
        response.token
      );
      setToken(response.token);
    }

    if (response?.user) {
      localStorage.setItem(
        "moneymate_user",
        JSON.stringify(response.user)
      );
      setUser(response.user);
    }

    return response;
  };

  const login = async (credentials) => {
    const response = await loginUser(credentials);

    if (response?.token) {
      localStorage.setItem(
        "moneymate_token",
        response.token
      );
      setToken(response.token);
    }

    if (response?.user) {
      localStorage.setItem(
        "moneymate_user",
        JSON.stringify(response.user)
      );
      setUser(response.user);
    }

    return response;
  };

  const logout = () => {
    logoutUser();
    localStorage.removeItem("moneymate_token");
    localStorage.removeItem("moneymate_user");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};