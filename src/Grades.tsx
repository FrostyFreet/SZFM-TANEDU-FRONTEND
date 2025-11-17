import { useState, useEffect, useContext, useMemo } from "react";
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
  Autocomplete, 
  Chip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { RoleContext } from "./App";
import { courseAPI, userAPI, gradeAPI } from "./API/ApiCalls";
import type { Grade } from "./types/Grade";
import { useQuery } from "@tanstack/react-query";

export default function Grades() {
  const [jegyek, setJegyek] = useState<Grade[]>([]);
  const token = localStorage.getItem("token");
  const roleContext = useContext(RoleContext);
  const [showCreateGradeModal, setShowCreateGradeModal] = useState(false);
  const [studentsList, setStudentsList] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [modalActiveLetter, setModalActiveLetter] = useState<string | null>("A");
  const [modalSearchInput, setModalSearchInput] = useState<string>("");
  const [modalShowAlphabet, setModalShowAlphabet] = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>("A");
  const [searchInput, setSearchInput] = useState<string>("");
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  
  const alphabet = ["A","Á","B","C","Cs","D","Dz","Dzs","E","É","F","G","Gy","H","I","Í","J","K","L","Ly","M","N",
    "Ny","O","Ó","Ö","Ő","P","Q","R","S","Sz","T","Ty","U","Ú","Ü","Ű","V","W","X","Y","Z","Zs"];

  const [newGrade, setNewGrade] = useState({
    studentEmail: "",
    value: "",
    subject: "",
  });

  
  const filteredStudents = useMemo(() => {
    if (searchInput) {
      return studentsList.filter((s) =>
        s.toLowerCase().includes(searchInput.toLowerCase())
      );
    } else if (activeLetter) {
      return studentsList.filter((s) =>
        s.split("@")[0][0]?.toUpperCase() === activeLetter
      );
    }
    return [];
    }, 
    [studentsList, searchInput, activeLetter]);
  
  const filteredStudentsForModal = useMemo(() => {
  if (modalSearchInput) {
    return studentsList.filter((s) =>
      s.toLowerCase().includes(modalSearchInput.toLowerCase())
    );
  } else if (modalActiveLetter) {
    return studentsList.filter((s) =>
      s.split("@")[0][0]?.toUpperCase() === modalActiveLetter
    );
  }
  return [];
}, [studentsList, modalSearchInput, modalActiveLetter]);


  const { data: fetchedSubjects } = useQuery({
    queryKey: ["subject", token],
    queryFn: async () => {
      const response = await courseAPI.getAllAvailableSubjects();
      return Array.isArray(response.data)
        ? response.data.map((d: any) => d.name || d)
        : [];
    },
    enabled:
      !!token &&
      (roleContext?.role === "SYSADMIN" ||
        roleContext?.role === "TEACHER" ||
        roleContext?.role === "CLASSLEADER"),
  });
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser", token],
    queryFn: async () => {
      const res = await userAPI.getCurrentUser();
      return res?.data;
    },
    enabled: !!token && roleContext?.role === "CLASSLEADER",
    retry: false,
  });

  const { data: fetchedGrades, isLoading, refetch } = useQuery({
    queryKey: ["grades", token, selectedUser],
    queryFn: async () => {
      if (
        (roleContext?.role === "SYSADMIN" || roleContext?.role === "CLASSLEADER") &&
        selectedUser
      ) {
        const response = await gradeAPI.getAllGradesByStudentEmail(selectedUser);
        return Array.isArray(response.data) ? response.data : [];
      } else {
        const response = await gradeAPI.getAllByCurrentUser();
        return Array.isArray(response.data) ? response.data : [];
      }
    },
    enabled:
      !!token &&
      (roleContext?.role === "SYSADMIN" || roleContext?.role === "CLASSLEADER"
        ? !!selectedUser
        : true),
  });

  const { data: fetchedStudents = [] } = useQuery({
    queryKey: ["students", token, roleContext?.role, currentUser?.classLeaderOf],
    queryFn: async () => {
      if (roleContext?.role === "SYSADMIN") {
        const response = await userAPI.getAllStudentsEmail();
        return Array.isArray(response.data) ? response.data : [];
      } else if (roleContext?.role === "CLASSLEADER" && currentUser?.classLeaderOf) {
        const response = await userAPI.getStudentsByDepartmentName(currentUser.classLeaderOf);
        return Array.isArray(response.data) 
          ? response.data.map((student: any) => student.email || student)
          : [];
      }
      return [];
    },
    enabled:
      !!token &&
      (roleContext?.role === "SYSADMIN" || 
       (roleContext?.role === "CLASSLEADER" && !!currentUser?.classLeaderOf)),
  });

  useEffect(() => {
    if (fetchedGrades) {
      setJegyek(
        fetchedGrades.map((item: any) => ({
          id: item.id,
          subject: item.subject || "Ismeretlen",
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

  const handleDeleteGrade = async (gradeId: number) => {
    if (!window.confirm("Biztosan törölni szeretnéd ezt a jegyet?")) return;

    try {
      await gradeAPI.deleteGradeById(gradeId);
      alert("Jegy sikeresen törölve!");
      refetch();
    } catch (error) {
      console.error("Hiba történt:", error);
      alert("Hiba történt a törléskor!");
    }
  };

  const atlag =
    jegyek.length > 0
      ? (
          jegyek.reduce((sum: number, j: Grade) => sum + j.value, 0) /
          jegyek.length
        ).toFixed(2)
      : "Nincs adat";

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        display: "flex",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: "primary.main",
            mb: 3,
            textAlign: "center",
          }}
        >
          Jegyek és értékelések
        </Typography>

{(roleContext?.role === "SYSADMIN" || roleContext?.role === "CLASSLEADER") && (
  <Box sx={{ mb: 3 }}>
    {!showSearchPanel ? (
      <Button
        variant="contained"
        onClick={() => setShowSearchPanel(true)}
        sx={{ mb: 2 }}
      >
        Felhasználó kiválasztása
      </Button>
    ) : (
      <>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Felhasználó kiválasztása
        </Typography>

        {!searchInput && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {alphabet.map((letter) => (
              <Chip
                key={letter}
                label={letter}
                color={activeLetter === letter ? "primary" : "default"}
                onClick={() =>
                  setActiveLetter(activeLetter === letter ? null : letter)
                }
                sx={{
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              />
            ))}
          </Box>
        )}

        <Autocomplete
          options={filteredStudents}
          getOptionLabel={(option) => option}
          value={selectedUser || null}
          onChange={(_, value) => setSelectedUser(value || "")}
          onInputChange={(_, value) => {
            setSearchInput(value);
            if (value) setActiveLetter(null);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Felhasználó kiválasztása"
              placeholder="Kezdj el gépelni vagy válassz betűt..."
            />
          )}
          fullWidth
          clearOnBlur={false}
          noOptionsText="Nincs találat"
        />

        <Button
          onClick={() => setShowSearchPanel(false)}
          color="secondary"
          sx={{ mt: 2 }}
        >
          Bezárás
        </Button>
      </>
    )}
  </Box>
)}


{(roleContext?.role === "TEACHER" || roleContext?.role === "SYSADMIN") && (
  <>
    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setShowCreateGradeModal(true)}
      >
        Új jegy hozzáadása
      </Button>
    </Box>
    <Dialog
      open={showCreateGradeModal}
      onClose={() => setShowCreateGradeModal(false)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Új jegy hozzáadása</DialogTitle>

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
      >
        {modalShowAlphabet && !modalSearchInput && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {alphabet.map((letter) => (
              <Chip
                key={letter}
                label={letter}
                color={modalActiveLetter === letter ? "primary" : "default"}
                onClick={() => {
                  setModalActiveLetter(letter);
                  setModalSearchInput("");
                  setModalShowAlphabet(true);
                }}
                sx={{ cursor: "pointer", fontWeight: "bold" }}
              />
            ))}
          </Box>
        )}

        <Autocomplete
          options={filteredStudentsForModal}
          getOptionLabel={(option) => option}
          value={newGrade.studentEmail || null}
          onFocus={() => setModalShowAlphabet(true)}
          onChange={(_, value) =>
            setNewGrade({ ...newGrade, studentEmail: value || "" })
          }
          onInputChange={(_, value) => {
            setModalSearchInput(value);
            if (value) setModalActiveLetter(null);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Diák kiválasztása"
              placeholder="Kezdj el gépelni vagy válassz betűt..."
            />
          )}
          fullWidth
          clearOnBlur={false}
          noOptionsText="Nincs találat"
        />

        <TextField
          label="Jegy (1–5)"
          type="number"
          value={newGrade.value}
          onChange={(e) =>
            setNewGrade({ ...newGrade, value: e.target.value })
          }
          inputProps={{ min: 1, max: 5 }}
          fullWidth
        />

        <FormControl fullWidth>
          <InputLabel>Tantárgy</InputLabel>
          <Select
            value={newGrade.subject}
            label="Tantárgy"
            onChange={(e) =>
              setNewGrade({ ...newGrade, subject: e.target.value })
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
            if (!newGrade.studentEmail || !newGrade.value || !newGrade.subject) {
              alert("Tölts ki minden mezőt!");
              return;
            }
            try {
              await gradeAPI.createGrade({
                studentEmail: newGrade.studentEmail,
                value: parseInt(newGrade.value),
                subject: newGrade.subject,
              });
              alert("Jegy sikeresen hozzáadva!");
              setShowCreateGradeModal(false);
              refetch();
            } catch (error) {
              console.error(error);
              alert("Hiba történt!");
            }
          }}
        >
          Mentés
        </Button>
      </DialogActions>
    </Dialog>
  </>
)}


        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: "16px",
              overflow: "hidden",
              backdropFilter: "blur(12px)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: "primary.main" }}>
                <TableRow>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                    Tantárgy
                  </TableCell>
                  <TableCell
                    sx={{ color: "#fff", fontWeight: 700 }}
                    align="center"
                  >
                    Jegy
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                    Dátum
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                    Tanár
                  </TableCell>
                  {(roleContext?.role === "TEACHER" ||
                    roleContext?.role === "SYSADMIN") && (
                    <TableCell
                      sx={{ color: "#fff", fontWeight: 700 }}
                      align="center"
                    >
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
                        {roleContext?.role === "CLASSLEADER" && !selectedUser
                          ? "Válassz egy diákot a jegyeinek megtekintéséhez"
                          : "Nincsenek elérhető jegyek"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  jegyek.map((j, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,0.08)",
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>
                        {j.subject}
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color:
                              j.value >= 4
                                ? "success.main"
                                : j.value >= 3
                                ? "warning.main"
                                : "error.main",
                          }}
                        >
                          {j.value}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {j?.createdAt
                          ? j.createdAt.toLocaleDateString("hu-HU")
                          : "-"}
                      </TableCell>
                      <TableCell>{j.teacherName}</TableCell>
                      {(roleContext?.role === "TEACHER" ||
                        roleContext?.role === "SYSADMIN") && (
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
        )}

        {jegyek.length > 0 && (
          <Card
            sx={{
              mt: 3,
              borderRadius: "16px",
              backdropFilter: "blur(10px)",
              background: "rgba(255,255,255,0.07)",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                Átlag: {atlag}
              </Typography>
            </CardContent>
          </Card>
        )}

        <Box sx={{ textAlign: "center", mt: 6, color: "text.secondary" }}>
          <Typography variant="body2">
            © 2025 TanEdu | Hallgatói rendszer
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}