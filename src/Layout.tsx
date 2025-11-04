import { Box } from "@mui/material";
import AppBarNav from "./components/AppBarNav";
import TopBar from "./Topbar";

import type { LayoutProps } from "./types/miscl";



export default function Layout({ children }: LayoutProps) {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "rgba(10, 10, 25, 0.85)",
        backdropFilter: "blur(10px)",
        overflow: "hidden",
      }}
    >
      <AppBarNav />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <TopBar />
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            mt: "64px",
            color: "#e0e0e0",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
