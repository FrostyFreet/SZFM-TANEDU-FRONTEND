import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Container,
} from '@mui/material';
import AppBarNav from './components/AppBarNav';

type Profile = {
    id: number
    firstName: string
    lastName: string
    email: string
    birthDate: string | null
    role: string
    departmentName: string
    fullName: string
}

export default function Adatok() {
  const [adatok, setAdatok] = useState<Profile | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const token = localStorage.getItem("token")

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', message: "Az új jelszavak nem egyeznek!" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', message: "A jelszó legalább 6 karakter hosszú kell, hogy legyen!" });
      return;
    }
    try {
      await axios.put("http://localhost:8080/api/auth/change-password", {
        password: passwordData.newPassword,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPasswordMessage({ type: 'success', message: "Jelszó sikeresen megváltoztatva!" });
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordMessage(null);
      }, 1500);
    } catch (err) {
      setPasswordMessage({ type: 'error', message: "Hiba történt! Próbálja meg később." });
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
        try {
        if (!token) {
            setAdatok(null);
            return;
        }
        const response = await axios.get("http://localhost:8080/api/users/getCurrentUser", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response?.data) {
            setAdatok(response.data);
        } else {
            setAdatok(null);
        }
        } catch (error) {
        console.error("Felhasználó lekérése sikertelen:", error);
        setAdatok(null);
        }
    };

    fetchCurrentUser();
}, [token]);

  if (!adatok) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <AppBarNav />
        <Container maxWidth="lg" sx={{ pt: 4, pb: 6 }}>
          <Typography variant="h6" color="text.secondary">
            Betöltés...
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBarNav />

      <Container maxWidth="lg" sx={{ pb: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: 'primary.main',
              }}
            >
              Személyes adatok
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setShowChangePassword(true)}
            >
              🔐 Jelszó megváltoztatása
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: '#fff', fontWeight: 700, width: '250px' }}>Mező</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Érték</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ '&:hover': { backgroundColor: '#e3f2fd' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>Teljes név</TableCell>
                  <TableCell>{adatok.fullName}</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { backgroundColor: '#e3f2fd' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>Hallgatói azonosító</TableCell>
                  <TableCell>{adatok.id}</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { backgroundColor: '#e3f2fd' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>Születés ideje</TableCell>
                  <TableCell>{adatok.birthDate || "Nem megadott"}</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { backgroundColor: '#e3f2fd' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>E-mail cím</TableCell>
                  <TableCell>{adatok.email}</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { backgroundColor: '#e3f2fd' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>Osztály</TableCell>
                  <TableCell>{adatok.departmentName}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 6, color: 'text.secondary' }}>
          <Typography variant="body2">
            © 2025 TanEdu | Hallgatói rendszer
          </Typography>
        </Box>
      </Container>

      <Dialog
        open={showChangePassword}
        onClose={() => {
          setShowChangePassword(false);
          setPasswordMessage(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.3rem' }}>
          🔐 Jelszó megváltoztatása
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Új jelszó"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              fullWidth
            />
            <TextField
              label="Új jelszó megerősítése"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              fullWidth
            />
            {passwordMessage && (
              <Alert severity={passwordMessage.type}>
                {passwordMessage.message}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowChangePassword(false);
              setPasswordMessage(null);
              setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            }}
          >
            Mégse
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            color="primary"
          >
            Jelszó módosítása
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}