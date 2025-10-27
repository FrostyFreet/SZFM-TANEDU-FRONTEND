import { Navigate, Route, Routes } from "react-router"
import Login from "./Login"
import Homepage from "./Homepage"
import Messages from "./Messages"
import Grades from "./Grades"
import Schedule from "./Schedule"
import Profile from "./Profile"
import ProtectedRoute from "./components/ProtectedRoute"
import { createContext, useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Box } from "@mui/material"
import { userAPI, authAPI } from "./API/ApiCalls"

export const RoleContext = createContext<{
  role: string | null;
  setRole: React.Dispatch<React.SetStateAction<string | null>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

function App() {
  const [role, setRole] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem("token"));
  const [isValid, setIsValid] = useState<boolean>(true); 

  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("token");
      setIsLoggedIn(!!newToken);
      if (!newToken) {
        setRole(null);
        setIsValid(true); 
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const fetchRole = async (): Promise<string | null> => {
    if (!token && !isLoggedIn) return null;
    try {
      const response = await userAPI.getCurrentUserRole();
      return response?.data ?? null;
    } catch (err) {
      console.error("Role fetch failed:", err);
      setIsValid(false); 
      return null;
    }
  };

  const { data: fetchedRole } = useQuery({
    queryKey: ["role", token],
    queryFn: fetchRole,
    enabled: !!token,
  });

  const isTokenValid = async () => {
    if (!token && !isLoggedIn) return null;
    try {
      const response = await authAPI.checkToken();
      return response?.data ?? null;
    } catch (err) {
      console.error("Token validation failed:", err);
      setIsValid(false);
      return null;
    }
  };

  const { data: isValidToken } = useQuery({
    queryKey: ["validToken", token],
    queryFn: isTokenValid,
    enabled: !!token,
    staleTime: 5 * 60 * 1000, 
  });

  useEffect(() => {
    if (isValidToken !== undefined) {
      setIsValid(isValidToken?.valid === true);
    }
  }, [isValidToken]);

  useEffect(() => {
    if (fetchedRole) {
      setRole(fetchedRole);
    }
  }, [fetchedRole]);

  useEffect(() => {
    if (!isValid && token) {
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      setRole(null);
    }
  }, [isValid, token]);

  
  return (
    <RoleContext.Provider value={{ role, setRole, isLoggedIn, setIsLoggedIn }}>
      <Box sx={{ minHeight: '100vh' }}>
        <Routes>
          {isLoggedIn && isValid ? (
            <>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route 
                path="/home" 
                element={
                  <ProtectedRoute>
                    <Homepage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/uzenetek" 
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/jegyek" 
                element={
                  <ProtectedRoute>
                    <Grades />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orarend" 
                element={
                  <ProtectedRoute>
                    <Schedule />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/adatok" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
            </>
          ) : (
            <>
              <Route path="/" element={<Login />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Box>
    </RoleContext.Provider>
  )
}

export default App