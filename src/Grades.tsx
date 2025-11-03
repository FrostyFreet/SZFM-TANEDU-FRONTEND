import { useState, useEffect, useContext } from "react";
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
  Container,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { RoleContext } from "./App";
import { courseAPI, userAPI } from "./API/ApiCalls";
import AppBarNav from './components/AppBarNav';
import type { Grade } from "./types/Grade";
import { useQuery } from "@tanstack/react-query";
import { gradeAPI } from "./API/ApiCalls";

export default function Grades() {
  const [jegyek, setJegyek] = useState<Grade[]>([]);
  const token = localStorage.getItem("token");
  const roleContext = useContext(RoleContext);
  const [showCreateGradeModal, setShowCreateGradeModal] = useState(false);
  const [studentsList, setStudentsList] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [newGrade, setNewGrade] = useState({
    studentEmail: "",
    value: "",
    comment: ""
  });

  // Fetch subjects
  const { data: fetchedSubjects } = useQuery({
    queryKey: ["subject", token],
    queryFn: async () => {
      const response = await courseAPI.getAllAvailableSubjects();
      return Array.isArray(response.data) ? response.data.map((d: any) => d.name || d) : [];
    },
    enabled: !!token && (roleContext?.role === "SYSADMIN" || roleContext?.role === "TEACHER"),
  });

  // Fetch grades
  const { data: fetchedGrades, isLoading, refetch } = useQuery({
    queryKey: ["grades", token, selectedUser],
    queryFn: async () => {
      if (roleContext?.role === "SYSADMIN" && selectedUser) {
        const response = await gradeAPI.getAllGradesByStudentEmail(selectedUser);
        return Array.isArray(response.data) ? response.data : [];
      } else {
        const response = await gradeAPI.getAllByCurrentUser();
        return Array.isArray(response.data) ? response.data : [];
      }
    },
    enabled: !!token && (roleContext?.role === "SYSADMIN" ? !!selectedUser : true),
  });

  // Fetch students for SYSADMIN
  const { data: fetchedStudents = [] } = useQuery({
    queryKey: ["students", token],
    queryFn: async () => {
      const response = await userAPI.getAllStudentsEmail();
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!token && roleContext?.role === "SYSADMIN",
  });

  useEffect(() => {
  if (fetchedGrades) {
    setJegyek(
      fetchedGrades.map((item: any) => ({
        id: item.id,
        comment: item.comment || "Ismeretlen",
        createdAt: item.createdAt ? new Date(item.createdAt) : null,
        studentName: item.studentName || "Nincs adat",
        teacherName: item.teacherName || "Nincs adat",
        value: item.value || 0,
      }))
    );
  }
}, [fetchedGrades]);

  useEffect(() => {
    if (fetchedStudents.length > 0) {
      setStudentsList(fetchedStudents);
    }
  }, [fetchedStudents]);

  // Handle grade deletion
  const handleDeleteGrade = async (gradeId: number) => {
    if (!window.confirm("Biztosan törölni szeretnéd ezt a jegyet?")) return;

    try {
      await gradeAPI.deleteGradeById(gradeId);
      alert("Jegy sikeresen törölve!");
      refetch(); // Refetch grades after deletion
    } catch (error) {
      console.error("Hiba történt a jegy törlésekor:", error);
      alert("Hiba történt a jegy törlésekor!");
    }
  };

  const atlag =
    jegyek.length > 0
      ? (
          jegyek.reduce((sum: number, j: Grade) => sum + j.value, 0) / jegyek.length
        ).toFixed(2)
      : "Nincs adat";

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBarNav />

      <Container maxWidth="lg" sx={{ pb: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              mb: 3,
            }}
          >
            Jegyek, értékelések
          </Typography>

          {/* SYSADMIN: Select User */}
          {roleContext?.role === "SYSADMIN" && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Felhasználó kiválasztása</InputLabel>
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                label="Felhasználó kiválasztása"
              >
                {studentsList.map((student) => (
                  <MenuItem key={student} value={student}>
                    {student}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Teacher or SYSADMIN: Add Grade */}
          {(roleContext?.role === "TEACHER" || roleContext?.role === "SYSADMIN") && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateGradeModal(true)}
              >
                Új jegy hozzáadása
              </Button>
            </Box>
          )}

          {/* Create Grade Modal */}
          <Dialog
            open={showCreateGradeModal}
            onClose={() => setShowCreateGradeModal(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>Új jegy létrehozása</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Diák (email)</InputLabel>
                <Select
                  value={newGrade.studentEmail}
                  label="Diák (email)"
                  onChange={(e) =>
                    setNewGrade({ ...newGrade, studentEmail: e.target.value })
                  }
                >
                  {studentsList.map((student) => (
                    <MenuItem key={student} value={student}>
                      {student}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Jegy (1-5)"
                type="number"
                value={newGrade.value}
                onChange={(e) => setNewGrade({ ...newGrade, value: e.target.value })}
                inputProps={{ min: 1, max: 5 }}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Tárgy</InputLabel>
                <Select
                  value={newGrade.comment}
                  label="Tárgy"
                  onChange={(e) =>
                    setNewGrade({ ...newGrade, comment: e.target.value })
                  }
                >
                  {fetchedSubjects?.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setShowCreateGradeModal(false)}>Mégse</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  if (!newGrade.studentEmail || !newGrade.value) {
                    alert("Kérlek töltsd ki az összes mezőt!");
                    return;
                  }
                  try {
                    await gradeAPI.createGrade({
                      studentEmail: newGrade.studentEmail,
                      value: parseInt(newGrade.value),
                      comment: newGrade.comment,
                    });
                    alert("Jegy sikeresen hozzáadva!");
                    setShowCreateGradeModal(false);
                    refetch(); // Refetch grades after creation
                  } catch (error) {
                    console.error(error);
                    alert("Hiba történt a jegy mentésekor!");
                  }
                }}
              >
                Mentés
              </Button>
            </DialogActions>
          </Dialog>

          {/* Grades Table */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Tantárgy</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }} align="center">Jegy</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Dátum</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Tanár</TableCell>
                      {(roleContext?.role === "TEACHER" || roleContext?.role === "SYSADMIN") && (
                        <TableCell sx={{ color: '#fff', fontWeight: 700 }} align="center">
                          Műveletek
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jegyek.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            Nincsenek elérhető jegyek
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      jegyek.map((j, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            '&:hover': {
                              backgroundColor: '#e3f2fd',
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>{j.value}</TableCell>
                          <TableCell align="center">
                            <Typography
                              sx={{
                                fontWeight: 700,
                                color:
                                  j.value >= 4
                                    ? 'success.main'
                                    : j.value >= 3
                                    ? 'warning.main'
                                    : 'error.main',
                              }}
                            >
                              {j.value}
                            </Typography>
                          </TableCell>
                          <TableCell>{j?.createdAt ? j.createdAt.toLocaleDateString('hu-HU') : '-'}</TableCell>                          <TableCell>{j.comment}</TableCell>
                          {(roleContext?.role === "TEACHER" || roleContext?.role === "SYSADMIN") && (
                            <TableCell align="center">
                              <Tooltip title="Törlés">
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteGrade(j.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {jegyek.length > 0 && (
                <Card sx={{ mt: 3, backgroundColor: 'primary.light' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
                      Átlag: {atlag}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </Box>

        <Box sx={{ textAlign: 'center', mt: 6, color: 'text.secondary' }}>
          <Typography variant="body2">
            © 2025 TanEdu | Hallgatói rendszer
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}