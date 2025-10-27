import { useState, useContext } from "react";
import { useNavigate } from "react-router";
import { Box, TextField, Button, Typography, Paper, Alert, Container } from '@mui/material';
import { RoleContext } from "./App";
import { authAPI } from "./API/ApiCalls";

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const navigate = useNavigate()
  const roleContext = useContext(RoleContext);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Minden mezőt ki kell tölteni!");
      return;
    }
    try {
      const response = await authAPI.login(email, password);
      if (response && response.data.token) {
        localStorage.setItem("token", response.data.token)
        roleContext?.setIsLoggedIn(true);
        navigate("/home")
      }
      setEmail("")
      setPassword("")
    }
    catch (e) {
      setErrorMsg("Hibás email/jelszó!");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            textAlign: 'center',
            borderRadius: '16px',
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
            📚 TanEdu Rendszer
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Kérlek, jelentkezz be a folytatáshoz
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              sx={{ mt: 2, fontWeight: 700 }}
            >
              Bejelentkezés
            </Button>
            {errorMsg && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMsg}
              </Alert>
            )}
          </Box>

          <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
            © 2025 TanEdu | Hallgatói rendszer
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}