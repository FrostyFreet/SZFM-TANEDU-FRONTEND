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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { RoleContext } from "./App";
import { userAPI } from "./API/ApiCalls";
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
  const [newGrade, setNewGrade] = useState({
    studentEmail: "",
    value: "",
    comment: ""
  });

  const { data: fetchedGrades, isLoading } = useQuery({
    queryKey: ["grades", token],
    queryFn: async () => {
      const response = await gradeAPI.getAllByCurrentUser();
      if (Array.isArray(response.data)) {
        return response.data.map((item: any) => ({
          targy: item.comment || "Ismeretlen",
          jegy: item.value || 0,
          datum: new Date().toLocaleDateString('hu-HU'),
          megjegyzes: item.teacherName || "Nincs megjegyzés",
        }));
      }
      return [];
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (fetchedGrades) {
      setJegyek(fetchedGrades);
    }
  }, [fetchedGrades]);
const { data: fetchedStudents = [] } = useQuery({
  queryKey: ["students", token],
  queryFn: async () => {
    const response = await userAPI.getAllStudentsEmail();
    return Array.isArray(response.data) ? response.data : [];
  },
  enabled: !!token && roleContext?.role === "TEACHER",
});

useEffect(() => {
  if (fetchedStudents.length > 0) {
    setStudentsList(fetchedStudents);
  }
}, [fetchedStudents]);

  const atlag =
    jegyek.length > 0
      ? (
          jegyek.reduce((sum: number, j: Grade) => sum + j.jegy, 0) / jegyek.length
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
            {(roleContext?.role === "TEACHER" || roleContext?.role === "SYSADMIN" )&& (
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

{/* Jegy létrehozása modál */}
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

    <TextField
      label="Megjegyzés"
      multiline
      rows={3}
      value={newGrade.comment}
      onChange={(e) => setNewGrade({ ...newGrade, comment: e.target.value })}
      fullWidth
    />
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
          window.location.reload();
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jegyek.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
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
                          <TableCell sx={{ fontWeight: 500 }}>{j.targy}</TableCell>
                          <TableCell align="center">
                            <Typography
                              sx={{
                                fontWeight: 700,
                                color:
                                  j.jegy >= 4
                                    ? 'success.main'
                                    : j.jegy >= 3
                                    ? 'warning.main'
                                    : 'error.main',
                              }}
                            >
                              {j.jegy}
                            </Typography>
                          </TableCell>
                          <TableCell>{j.datum}</TableCell>
                          <TableCell>{j.megjegyzes}</TableCell>
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