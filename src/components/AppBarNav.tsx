import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import {
  Home,
  Message,
  Grade,
  Schedule,
  AccountCircle,
  CheckCircle,
  CloudUpload,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

const navItems = [
  { text: "Kezdőlap", icon: <Home />, path: "/home" },
  { text: "Üzenetek", icon: <Message />, path: "/uzenetek" },
  { text: "Jegyek", icon: <Grade />, path: "/jegyek" },
  { text: "Órarend", icon: <Schedule />, path: "/orarend" },
  { text: "Jelenlét", icon: <CheckCircle />, path: "/jelenlét" },
  { text: "HIányzás-feltöltés", icon: <CloudUpload />, path: "/feltoltes" },
  { text: "Adatok", icon: <AccountCircle />, path: "/adatok" },
];

export default function AppBarNav() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <motion.div
      animate={{ width: open ? 240 : 80 }}
      transition={{ duration: 0.3 }}
    >
      <Drawer
        variant="permanent"
        PaperProps={{
          sx: {
            width: open ? 240 : 80,
            transition: "width 0.3s",
            bgcolor: "rgba(20, 20, 35, 0.5)",
            backdropFilter: "blur(12px)",
            borderRight: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: open ? "space-between" : "center",
            px: 2,
            py: 2,
          }}
        >
          {open && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                background: "linear-gradient(90deg,#7e57c2,#2196f3)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              TanEdu
            </Typography>
          )}
          <IconButton onClick={() => setOpen(!open)} sx={{ color: "#bbb" }}>
            <MenuIcon />
          </IconButton>
        </Box>

        <List sx={{ mt: 2 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={{
                mx: 1,
                borderRadius: 2,
                "&:hover": {
                  background: "linear-gradient(90deg,#7e57c2,#2196f3)",
                },
              }}
            >
              <ListItemIcon sx={{ color: "#fff", minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              {open && <ListItemText primary={item.text} />}
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />
        
      </Drawer>
    </motion.div>
  );
}
