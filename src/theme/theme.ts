
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#6366F1", // indigó-lila
      light: "#818CF8",
      dark: "#4F46E5",
    },
    secondary: {
      main: "#9333EA", // lila
      light: "#A855F7",
      dark: "#7E22CE",
    },
    background: {
      default: "#0D1117", // teljes háttér
      paper: "rgba(255, 255, 255, 0.05)", // glass hatás
    },
    text: {
      primary: "#E2E8F0",
      secondary: "#94A3B8",
    },
    success: { main: "#22C55E" },
    error: { main: "#EF4444" },
    warning: { main: "#FACC15" },
    info: { main: "#3B82F6" },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h1: { fontSize: "2.5rem", fontWeight: 700 },
    h2: { fontSize: "2rem", fontWeight: 600 },
    h3: { fontSize: "1.75rem", fontWeight: 600 },
    h4: { fontSize: "1.5rem", fontWeight: 500 },
    h5: { fontSize: "1.25rem", fontWeight: 500 },
    h6: { fontSize: "1rem", fontWeight: 500 },
    body1: { fontSize: "1rem", lineHeight: 1.6 },
    body2: { fontSize: "0.9rem", lineHeight: 1.5 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#0D1117",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(99,102,241,0.08), transparent 60%), radial-gradient(circle at 75% 75%, rgba(147,51,234,0.08), transparent 60%)",
          color: "#E2E8F0",
          minHeight: "100vh",
          overflowX: "hidden",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: "0 10px 30px rgba(99, 102, 241, 0.25)",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(30, 41, 59, 0.6)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "10px",
          padding: "8px 16px",
          transition: "all 0.25s ease",
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            background: "rgba(255, 255, 255, 0.06)",
            borderRadius: "10px",
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.2)",
            },
            "&:hover fieldset": {
              borderColor: "#818CF8",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#6366F1",
            },
            "& input": { color: "#E2E8F0" },
          },
          "& .MuiInputLabel-root": { color: "#A5B4FC" },
        },
      },
    },
  },
});

export default theme;
