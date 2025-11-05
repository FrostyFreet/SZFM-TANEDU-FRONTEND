// typescript
import { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Chip,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceAPI, departmentAPI, courseAPI } from "./API/ApiCalls";
import { RoleContext } from "./App";

type AttendanceItem = {
  id?: number;
  date?: string;
  courseName?: string;
  status?: string;
  present?: boolean;
  student?: { id?: number; firstName?: string; lastName?: string; fullName?: string };
  course?: { id?: number; name?: string };
  [key: string]: any;
};

type Student = { id: number; fullName: string; present: boolean; attendanceId?: number | null };

export default function Attendance() {
  const roleContext = useContext(RoleContext);
  const role = roleContext?.role ?? null;
  const token = localStorage.getItem("token");
  const queryClient = useQueryClient();

  const [snackbar, setSnackbar] = useState<{ open: boolean; severity?: any; message?: string }>({
    open: false,
    severity: "info",
    message: "",
  });
  const showSnackbar = (message: string, severity: any = "info") =>
    setSnackbar({ open: true, severity, message });

  const { data: myAttendances, isLoading: myAttendancesLoading } = useQuery({
    queryKey: ["myAttendances", token],
    queryFn: async () => {
      const res = await attendanceAPI.getMyAttendances();
      return Array.isArray(res?.data) ? (res.data as AttendanceItem[]) : [];
    },
    enabled: !!role && role === "STUDENT",
    retry: false,
  });

  const [selectedDepartment, setSelectedDepartment] = useState<string | "">("");
  const [selectedCourse, setSelectedCourse] = useState<number | "">("");
  const [selectedDuration, setSelectedDuration] = useState<string | "">("");
  const [students, setStudents] = useState<Student[]>([]);
  const [date] = useState(new Date().toISOString().split("T")[0]);
  const [deleteId, setDeleteId] = useState<string>("");

  const { data: departmentList } = useQuery({
    queryKey: ["departmentList", token],
    queryFn: async () => {
      const response = await departmentAPI.getAll();
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!token,
  });

  const { data: coursesByDepartment } = useQuery({
    queryKey: ["coursesByDepartment", token, selectedDepartment],
    queryFn: async () => {
      if (!selectedDepartment) return [];
      const response = await courseAPI.getCourseByDepartmentName(selectedDepartment);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!token && !!selectedDepartment,
  });

  const uniqueDurations = useMemo(() => {
    if (!coursesByDepartment) return [];
    const set = new Set<string>();
    for (const c of coursesByDepartment) {
      if (c?.duration) set.add(c.duration);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [coursesByDepartment]);

  const { data: studentForCourses } = useQuery({
    queryKey: ["studentsForCourse", token, selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const response = await courseAPI.getStudentsForCourses(selectedCourse as number);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!token && !!selectedCourse,
  });

  const { data: attendancesForCourseDate } = useQuery({
  queryKey: ["attendanceByCourseDate", token, selectedCourse, date, selectedDuration],
  queryFn: async () => {
    if (!selectedCourse) return [];
    const response = await attendanceAPI.getAttendance(
      selectedCourse as number,
      date,
      (selectedDuration as string) || undefined
    );
    return Array.isArray(response.data) ? response.data : [];
  },
  enabled: !!token && !!selectedCourse,
  });

  useEffect(() => {
    if (!studentForCourses) {
      setStudents([]);
      return;
    }
    // map attendances by student id
    const attMap = new Map<number, AttendanceItem>();
    (attendancesForCourseDate || []).forEach((a: any) => {
      const studentId = a?.student?.id ?? (a?.studentId ?? null);
      if (studentId) attMap.set(Number(studentId), a);
    });

    const normal: Student[] = studentForCourses.map((s: any) => {
      const id = s.id;
      const attendance = attMap.get(id);
      const fullName = s.fullName || `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.email || `#${s.id}`;
      return {
        id,
        fullName,
        present: typeof attendance?.present === "boolean" ? attendance.present : true,
        attendanceId: attendance?.id ?? null,
      };
    });
    setStudents(normal);
  }, [studentForCourses, attendancesForCourseDate]);

  useEffect(() => {
    if (!selectedDuration) {
      setSelectedCourse("");
      return;
    }
    const found = (coursesByDepartment || []).find((c: any) => c.duration === selectedDuration);
    if (found) {
      setSelectedCourse(found.id);
    } else {
      setSelectedCourse("");
    }
    setStudents([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDuration, selectedDepartment]);

  const handlePresenceToggle = (studentId: number) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, present: !s.present } : s)));
  };

  // create / update attendance mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => attendanceAPI.saveAttendance(payload),
    onSuccess: () => {
      showSnackbar("Jelenlét sikeresen mentve.", "success");
      queryClient.invalidateQueries({ queryKey: ["myAttendances"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceByCourseDate", token, selectedCourse, date, selectedDuration] });
      queryClient.invalidateQueries({ queryKey: ["studentsForCourse", token, selectedCourse] });
  },
    onError: (err: any) => {
      if (err?.response?.status === 403) {
        showSnackbar("Nincs jogosultságod ehhez a művelethez.", "error");
        return;
      }
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Hiba történt a mentés során.";
      showSnackbar(String(msg), "error");
    },
  });

  // delete attendance mutation (teacher/sysadmin)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => attendanceAPI.deleteAttendance(id),
    onSuccess: () => {
      showSnackbar("Jelenlét sikeresen törölve.", "success");
      queryClient.invalidateQueries({ queryKey: ["myAttendances"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceByCourseDate", token, selectedCourse, date, selectedDuration] });
      queryClient.invalidateQueries({ queryKey: ["studentsForCourse", token, selectedCourse] });
  },
    onError: (err: any) => {
      if (err?.response?.status === 403) {
        showSnackbar("Nincs jogosultságod ehhez a művelethez.", "error");
        return;
      }
      const msg = err?.response?.data?.error || err?.message || "Hiba történt a törlés során.";
      showSnackbar(String(msg), "error");
    },
  });

  const handleRowToggle = (studentId: number, newPresent: boolean) => {
    if (!selectedCourse) {
      showSnackbar("Válassz kurzust/időtartamot.", "warning");
      return;
    }
    const payload = {
      courseId: selectedCourse,
      date,
      timeSlot: selectedDuration || undefined,
      students: [{ studentId, present: newPresent }],
    };
    createMutation.mutate(payload);
};

  const handleSaveAttendance = () => {
    if (!selectedCourse) {
      showSnackbar("Válassz kurzust/időtartamot.", "warning");
      return;
    }
    if (!students || students.length === 0) {
      showSnackbar("Nincsenek diákok a kurzushoz.", "warning");
      return;
    }

    const payload = {
      courseId: selectedCourse,
      date,
      timeSlot: selectedDuration || undefined,
      students: students.map((s) => ({ studentId: s.id, present: s.present })),
    };

  createMutation.mutate(payload);
};

  const handleDeleteById = () => {
    const idNum = Number(deleteId);
    if (!idNum || isNaN(idNum)) {
      showSnackbar("Adjon meg érvényes azonosítót.", "warning");
      return;
    }
    deleteMutation.mutate(idNum);
  };

  // Authorization checks
  if (!token) {
    return <Typography color="error">Hiba: Hiányzó jogosultság.</Typography>;
  }

  console.log(myAttendances);
  
  if (role === "STUDENT") {
    return (
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            Jelenlét
          </Typography>

          <Paper sx={{ p: 3, mb: 3 }}>
            {myAttendancesLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Typography sx={{ mb: 2 }}>Saját jelenléteid:</Typography>
                {(!myAttendances || myAttendances.length === 0) ? (
                  <Typography color="text.secondary">Nincs rögzített jelenlét.</Typography>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Időpont</TableCell>
                          <TableCell>Óra / Tárgy</TableCell>
                          <TableCell>Státusz</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {myAttendances.map((a: AttendanceItem, idx: number) => (
                          <TableRow key={a.id ?? JSON.stringify(a)}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{a.date ? new Date(a.date).toLocaleString() : (a.createdAt ? String(a.createdAt) : "—")}</TableCell>
                            <TableCell>{a.courseName ? a.courseName : "—"}</TableCell>
                            <TableCell>
                              {a.isPresent === "true" || a.isPresent === true || a.present === true
                                ? "Jelen volt"
                                : a.isPresent === "false" || a.isPresent === false || a.present === false
                                ? "Hiányzott"
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </Paper>
        </Container>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity as any} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  if (role !== "TEACHER" && role !== "SYSADMIN") {
    return <Typography color="error">Nincs jogosultságod az oldal megtekintéséhez.</Typography>;
  }

  const chosenCourse = (coursesByDepartment || []).find((c: any) => c.id === selectedCourse);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          Jelenléti ív
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Osztály</InputLabel>
            <Select value={selectedDepartment} label="Osztály" onChange={(e) => { setSelectedDepartment(e.target.value as string); setSelectedCourse(""); setSelectedDuration(""); setStudents([]); }}>
              <MenuItem value=""><em>Válassz</em></MenuItem>
              {departmentList?.map((dep: any) => (
                <MenuItem key={dep.id} value={dep.name}>
                  {dep.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Időtartam (válassz időpontot)</InputLabel>
            <Select
              value={selectedDuration}
              label="Időtartam (válassz időpontot)"
              onChange={(e) => {
                setSelectedDuration(e.target.value as string);
              }}
            >
              <MenuItem value=""><em>Válassz</em></MenuItem>
              {uniqueDurations.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {chosenCourse && (
            <Box sx={{ mb: 2, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <Chip label={`Nap: ${chosenCourse.day}`} color="primary" />
              <Chip label={`Időtartam: ${chosenCourse.duration}`} color="secondary" />
              <Chip label={chosenCourse.name} />
              <Chip label={chosenCourse.teacherName} />
            </Box>
          )}

          {selectedCourse && (
            <>
              <Paper sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "primary.main" }}>
                    <TableRow>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Diák neve</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Jelen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id} hover>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell>
                          <Checkbox checked={student.present} onChange={() => handlePresenceToggle(student.id)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Button
                  variant="contained"
                  onClick={handleSaveAttendance}
                  disabled={createMutation.status === "pending"}
                >
                  Mentés
                </Button>

                <TextField
                  label="Törléshez jelenlét ID"
                  value={deleteId}
                  onChange={(e) => setDeleteId(e.target.value)}
                  size="small"
                />
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteById}
                  disabled={deleteMutation.status === "pending"}
                >
                  Törlés
                </Button>
              </Box>

              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Megjegyzés: a szerver csak TEACHER vagy SYSADMIN szereppel engedélyezi a törlést. A dátum automatikusan a mai nap lesz.
              </Typography>

              {/* Existing attendances for this course/date - editable rows */}
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Rögzített hiányzások / jelenlétek ({date})
              </Typography>
              <Paper sx={{ mb: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Diák</TableCell>
                      <TableCell>Jelen</TableCell>
                      <TableCell>Művelet</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(attendancesForCourseDate || []).map((att: any, idx:number) => {
                      const studentObj = att.student ?? att.studentId ? { id: att.student?.id ?? att.studentId, fullName: att.student?.fullName } : null;
                      const studentId = studentObj?.id ?? (att.studentId ?? null);
                      const studentName = (studentObj?.fullName ?? `${att.student?.firstName || ""} ${att.student?.lastName || ""}`.trim()) || `#${studentId}`;
                      return (
                        <TableRow key={att.id}>
                          <TableCell>{idx+1}</TableCell>
                          <TableCell>{studentName}</TableCell>
                          <TableCell>
                            <Checkbox
                              checked={Boolean(att.present)}
                              onChange={(e) => handleRowToggle(studentId, e.target.checked)}
                              disabled={createMutation.status === "pending"}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              color="error"
                              onClick={() => deleteMutation.mutate(att.id)}
                              disabled={deleteMutation.status === "pending"}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!attendancesForCourseDate || attendancesForCourseDate.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">Nincs rögzített jelenlét a kiválasztott időpontra.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </>
          )}
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity as any} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
