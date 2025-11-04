
import { useContext, useEffect, useState } from "react";
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
  CircularProgress,
} from '@mui/material';
import { userAPI, authAPI } from "./API/ApiCalls";
import type { Profile } from "./types/Profile";
import { RoleContext } from "./App";


export default function Adatok() {
  const [adatok, setAdatok] = useState<Profile | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const token = localStorage.getItem("token")
  const roleContext = useContext(RoleContext)
  const isTeacher = roleContext?.role === "TEACHER" ? true : false

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
      await authAPI.changePassword(passwordData.newPassword);
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
        const response = await userAPI.getCurrentUser();
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
        <Container maxWidth="lg" sx={{ pt: 4, pb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
            <CircularProgress />
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            Betöltés...
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>

      <Container maxWidth="lg" sx={{ py: 6 }}>
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
              color="primary"
              onClick={() => setShowChangePassword(true)}
              sx={{ textTransform: 'none' }}
            >
              🔐 Jelszó megváltoztatása
            </Button>
          </Box>

          <Paper
            sx={{
              p: 2,
              borderRadius: '16px',
              backdropFilter: 'blur(12px)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            elevation={0}
          >
            <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: 'none' }}>
              <Table>
                <TableHead sx={{ backgroundColor: 'primary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#fff', fontWeight: 700, width: '240px' }}>Mező</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Érték</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow sx={{ '&:hover': { backgroundColor: "rgba(255,255,255,0.08)" } }}>
                    <TableCell sx={{ fontWeight: 600 }}>Teljes név</TableCell>
                    <TableCell>{adatok.fullName}</TableCell>
                  </TableRow>
                  <TableRow sx={{ '&:hover': { backgroundColor: "rgba(255,255,255,0.08)" } }}>
                    <TableCell sx={{ fontWeight: 600 }}>Hallgatói azonosító</TableCell>
                    <TableCell>{adatok.id}</TableCell>
                  </TableRow>
                  <TableRow sx={{ '&:hover': { backgroundColor: "rgba(255,255,255,0.08)" } }}>
                    <TableCell sx={{ fontWeight: 600 }}>Születés ideje</TableCell>
                    <TableCell>{adatok.birthDate && new Date(adatok.birthDate).toLocaleDateString() || "Nem megadott"}</TableCell>
                  </TableRow>
                  <TableRow sx={{ '&:hover': { backgroundColor: "rgba(255,255,255,0.08)" } }}>
                    <TableCell sx={{ fontWeight: 600 }}>E-mail cím</TableCell>
                    <TableCell>{adatok.email}</TableCell>
                  </TableRow>
                  <TableRow sx={{ '&:hover': { backgroundColor: "rgba(255,255,255,0.08)" } }}>
                    <TableCell sx={{ fontWeight: 600 }}>Osztály</TableCell>
                    <TableCell>{adatok.departmentName}</TableCell>
                  </TableRow>
                  {isTeacher && 
                  <TableRow sx={{ '&:hover': { backgroundColor: "rgba(255,255,255,0.08)" } }}>
                    <TableCell sx={{ fontWeight: 600 }}>Specializáció</TableCell>
                    <TableCell>{adatok.subject}</TableCell>
                  </TableRow>
                  }
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

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
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
          🔐 Jelszó megváltoztatása
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
        <DialogActions sx={{ pr: 3, pb: 2 }}>
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