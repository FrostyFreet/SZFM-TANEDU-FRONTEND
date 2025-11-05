import { useEffect, useState } from "react";
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from "@mui/material/Autocomplete";
import AddIcon from '@mui/icons-material/Add';
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
import { userAPI, authAPI } from "./API/ApiCalls";
import type { Profile } from "./types/Profile";

export default function Adatok() {
  const [adatok, setAdatok] = useState<Profile | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const token = localStorage.getItem("token");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: '' });
  const [createUserMessage, setCreateUserMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);


  const handleCreateUser = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.password || !newUser.role) {
      setCreateUserMessage({ type: 'error', message: 'Minden mező kitöltése kötelező!' });
      return;
    }
    try {
      await userAPI.createUser(newUser);
      setCreateUserMessage({ type: 'success', message: 'Felhasználó sikeresen létrehozva!' });
      setTimeout(() => {
        setShowCreateUser(false);
        setNewUser({ fullName: '', email: '', password: '', role: '' });
        setCreateUserMessage(null);
      }, 1500);
    } catch (err) {
      setCreateUserMessage({ type: 'error', message: 'Hiba történt a felhasználó létrehozása közben!' });
    }
  };

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
    const fetchUserData = async () => {
      try {
        if (!token) {
          setAdatok(null);
          return;
        }
        const response = await userAPI.getCurrentUser();
        const roleResponse = await userAPI.getCurrentUserRole();
        if (response?.data) setAdatok(response.data);
        if (roleResponse?.data) setUserRole(roleResponse.data);
        if (roleResponse?.data === "SYSADMIN") {
          const res = await userAPI.getAllUsers();
          setAllUsers(res.data);
        }
      } catch (error) {
        console.error("Felhasználói adatok lekérése sikertelen:", error);
        setAdatok(null);
      }
    };
    fetchUserData();
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
            <Box>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShowChangePassword(true)}
              >
                🔐 Jelszó megváltoztatása
              </Button>

              {userRole === "SYSADMIN" && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon/>}
                  onClick={() => setShowCreateUser(true)}
                  sx={{ ml: 2 }}
                >
                  Új felhasználó
                </Button>
              )}
            </Box>
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
        {userRole === "SYSADMIN" && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
              👥 Felhasználó keresése e-mail alapján
            </Typography>
        <Autocomplete
          options={allUsers.map((u) => u.email)}
          value={selectedEmail}
          onChange={(event, newValue) => {setSelectedEmail(newValue || "");
            const user = allUsers.find((u) => u.email === newValue);
            setSelectedUser(user || null);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Felhasználó keresése e-mail alapján"
              fullWidth
            />
          )}
          filterOptions={(options, state) =>
            options.filter((email) =>
              email.toLowerCase().includes(state.inputValue.toLowerCase())
            )
          }
          sx={{ mb: 3 }}
        />
            {selectedUser && (
              <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden', mt: 2 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: 'secondary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#fff', fontWeight: 700, width: '250px' }}>Mező</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Érték</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Teljes név</TableCell>
                      <TableCell>{selectedUser.fullName}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>E-mail</TableCell>
                      <TableCell>{selectedUser.email}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Születés dátuma</TableCell>
                      <TableCell>{selectedUser.birthDate || "Nem megadott"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Osztály</TableCell>
                      <TableCell>{selectedUser.departmentName || "Nincs megadva"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Szerepkör</TableCell>
                      <TableCell>{selectedUser.role}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {selectedUser && (
  <Box sx={{ textAlign: "center", mt: 2 }}>
    <Button
      variant="contained"
      color="secondary"
      onClick={() => {
        setEditUser(selectedUser);
        setShowEditUser(true);
      }}
    >
      ✏️ Felhasználó adatainak módosítása
    </Button>
  </Box>
)}

          </Box>
        )}

        <Box sx={{ textAlign: 'center', mt: 6, color: 'text.secondary' }}>
          <Typography variant="body2">
            © 2025 TanEdu | Hallgatói rendszer
          </Typography>
        </Box>
      </Container>

      <Dialog open={showCreateUser} onClose={() => setShowCreateUser(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>👤 Új felhasználó létrehozása</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Teljes név" value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} />
            <TextField label="E-mail" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            <TextField label="Jelszó" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
            <TextField select label="Szerepkör" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} helperText="Válassza ki a felhasználó szerepkörét">
              <MenuItem value="student">🎓 Diák</MenuItem>
              <MenuItem value="teacher">👩‍🏫 Tanár</MenuItem>
            </TextField>
            {createUserMessage && <Alert severity={createUserMessage.type}>{createUserMessage.message}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateUser(false)}>Mégse</Button>
          <Button variant="contained" color="primary" onClick={handleCreateUser}>Felhasználó létrehozása</Button>
        </DialogActions>
      </Dialog>

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
      <Dialog open={showEditUser} onClose={() => setShowEditUser(false)} maxWidth="sm" fullWidth>
  <DialogTitle sx={{ fontWeight: 700 }}>✏️ Felhasználó adatainak módosítása</DialogTitle>
  <DialogContent sx={{ pt: 2 }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Teljes név"
        value={editUser?.fullName || ''}
        onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
      />
      <TextField
        label="E-mail"
        value={editUser?.email || ''}
        onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
      />
      <TextField
        label="Születési dátum"
        value={editUser?.birthDate || ''}
        onChange={(e) => setEditUser({ ...editUser, birthDate: e.target.value })}
      />
      <TextField
        select
        label="Osztály"
        value={editUser?.departmentName || ''}
        onChange={(e) => setEditUser({ ...editUser, departmentName: e.target.value })}
      > <MenuItem value="9th">9.</MenuItem>
        <MenuItem value="10th">10.</MenuItem>
        <MenuItem value="11th">11.</MenuItem>
        <MenuItem value="12th">12.</MenuItem>
        
      /</TextField>
      <TextField
        select
        label="Szerepkör"
        value={editUser?.role || ''}
        onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
      >
        <MenuItem value="student">🎓 Diák</MenuItem>
        <MenuItem value="teacher">👩‍🏫 Tanár</MenuItem>
      </TextField>

      {editMessage && <Alert severity={editMessage.type}>{editMessage.message}</Alert>}
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setShowEditUser(false)}>Mégse</Button>
    <Button
      variant="contained"
      color="primary"
      onClick={async () => {
        if (!editUser) return;
        try {
          await userAPI.updateUser(editUser.id, editUser);
          setEditMessage({ type: 'success', message: 'Felhasználó sikeresen frissítve!' });

          // Frissítjük a listát
          const res = await userAPI.getAllUsers();
          setAllUsers(res.data);

          setTimeout(() => {
            setShowEditUser(false);
            setEditMessage(null);
          }, 1500);
        } catch (err) {
          setEditMessage({ type: 'error', message: 'Hiba történt a módosítás során!' });
        }
      }}
    >
      Mentés
    </Button>
  </DialogActions>
</Dialog>

    </Box>
    
  );
}