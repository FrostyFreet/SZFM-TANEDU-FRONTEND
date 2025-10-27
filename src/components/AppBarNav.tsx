import { useContext } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { RoleContext } from "../App";

export default function AppBarNav() {
  const navigate = useNavigate();
  const roleContext = useContext(RoleContext);
  const token = localStorage.getItem("token");

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:8080/api/auth/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.warn("Logout failed:", err);
    }
    
    // Clear token and update state
    localStorage.removeItem("token");
    roleContext?.setIsLoggedIn(false);
    roleContext?.setRole(null);
    
    // Redirect to login
    navigate("/");
  };

  const navItems = [
    { icon: "📅", label: "Órarend", path: "/orarend" },
    { icon: "📊", label: "Jegyek", path: "/jegyek" },
    { icon: "📩", label: "Üzenetek", path: "/uzenetek" },
    { icon: "👤", label: "Adatok", path: "/adatok" },
  ];

  return (
    <AppBar position="sticky" sx={{ mb: 3 }}>
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "1.5rem",
          }}
          onClick={() => navigate("/home")}
        >
          📚 TanEdu
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => navigate(item.path)}
              sx={{
                textTransform: "none",
                fontSize: "0.95rem",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              {item.icon} {item.label}
            </Button>
          ))}

          <Button
            color="inherit"
            onClick={handleLogout}
            sx={{
              textTransform: "none",
              fontSize: "0.95rem",
              ml: 1,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            🚪 Kijelentkezés
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}