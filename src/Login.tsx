import { useState, useContext, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Container,
} from "@mui/material";
import { motion } from "framer-motion";
import { RoleContext } from "./App";
import { authAPI } from "./API/ApiCalls";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const roleContext = useContext(RoleContext);

  const handleSubmit = async (e:FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Minden mezőt ki kell tölteni!");
      return;
    }
    try {
      const response = await authAPI.login(email, password);
      if (response && response.data.token) {
        localStorage.setItem("token", response.data.token);
        roleContext?.setIsLoggedIn(true);
        navigate("/home");
      }
      setEmail("");
      setPassword("");
    } catch {
      setErrorMsg("Hibás email/jelszó!");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backdropFilter: "blur(10px)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ width: "100%" }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              width: "100%",
              textAlign: "center",
              borderRadius: "20px",
              backdropFilter: "blur(20px)",
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <Typography
              variant="h4"
              gutterBottom
              sx={{ fontWeight: 700, color: "primary.main", mb: 1 }}
            >
              📚 TanEdu Rendszer
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 3, color: "text.secondary" }}
            >
              Kérlek, jelentkezz be a folytatáshoz
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                placeholder="hello@example.com"
              />
              <TextField
                label="Jelszó"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{
                  mt: 2,
                  fontWeight: 700,
                  backdropFilter: "blur(10px)",
                }}
              >
                Bejelentkezés
              </Button>
              {errorMsg && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errorMsg}
                </Alert>
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{ mt: 4, color: "text.secondary" }}
            >
              © 2025 TanEdu | Hallgatói rendszer
            </Typography>
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
}
