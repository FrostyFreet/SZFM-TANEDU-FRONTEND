import { AppBar, Toolbar, IconButton} from "@mui/material";
import { AccountCircle, Logout } from "@mui/icons-material";
import { useNavigate } from "react-router";

export default function TopBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: "rgba(20,20,35,0.6)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        height: "64px",
        justifyContent: "center",
      }}
    >
      <Toolbar sx={{ justifyContent: "flex-end", gap: 2 }}>
        <IconButton sx={{ color: "#fff" }} onClick={() => navigate("/adatok")}>
          <AccountCircle />
        </IconButton>

        <IconButton sx={{ color: "#f44336" }} onClick={handleLogout}>
          <Logout />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
