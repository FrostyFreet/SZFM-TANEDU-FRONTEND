import { Navigate, Route, Routes } from "react-router"
import Login from "./Login"
import Homepage from "./Homepage"
import Messages from "./Messages"
import Grades from "./Grades"
import Schedule from "./Schedule"
import Profile from "./Profile"
import ProtectedRoute from "./components/ProtectedRoute"
import { createContext, useEffect, useState } from "react"
import axios from "axios"
import { useQuery } from "@tanstack/react-query"
import { Box } from "@mui/material"

export const RoleContext = createContext<{
  role: string | null;
  setRole: React.Dispatch<React.SetStateAction<string | null>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

function App() {
  const [role, setRole] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem("token"));

  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("token");
      setIsLoggedIn(!!newToken);
      if (!newToken) {
        setRole(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const fetchRole = async (): Promise<string | null> => {
    if (!token && !isLoggedIn) return null;
    try {
      const response = await axios.get("http://localhost:8080/api/users/getCurrentUserRole", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response?.data ?? null;
    } catch (err) {
      console.error("Role fetch failed:", err);
      return null;
    }
  };

  const { data: fetchedRole } = useQuery({
    queryKey: ["role", token],
    queryFn: fetchRole, 
    enabled: !!token,
  });
  
  useEffect(() => {
    if (fetchedRole) setRole(fetchedRole);
  }, [fetchedRole]);

  return (
    <RoleContext.Provider value={{ role, setRole, isLoggedIn, setIsLoggedIn }}>
      <Box sx={{ minHeight: '100vh' }}>
        <Routes>
          {isLoggedIn ? (
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