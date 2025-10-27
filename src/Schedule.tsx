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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AppBarNav from './components/AppBarNav';
import type { ScheduleRow, CourseApi, DayKey } from "./types/Schedule";
import { RoleContext } from "./App";
import { courseAPI, departmentAPI, userAPI } from "./API/ApiCalls";
import { useQuery } from "@tanstack/react-query";

export default function Schedule() {
  const roleContext = useContext(RoleContext);
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseApi | null>(null);
  const token = localStorage.getItem("token");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [teachersList, setTeachersList] = useState<string[]>([]);

  const [newCourse, setNewCourse] = useState({
    name: "",
    day: "hétfő",
    duration: "08:00-8:45",
    teacherName: "",
    departmentName: ""
  });

  // Fetch departments
  const { data: fetchedDepartments = [] } = useQuery({
    queryKey: ["departments", token],
    queryFn: async () => {
      const response = await departmentAPI.getAll();
      return Array.isArray(response.data) ? response.data.map((d: any) => d.name || d) : [];
    },
    enabled: !!token && roleContext?.role === "SYSADMIN",
  });

  // Fetch teachers
  const { data: fetchedTeachers = [] } = useQuery({
    queryKey: ["teachers", token],
    queryFn: async () => {
      const response = await userAPI.getAllTeachersEmail();
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (fetchedDepartments.length > 0) {
      setDepartments(fetchedDepartments);
      if (!selectedDepartment) {
        setSelectedDepartment(fetchedDepartments[0]);
      }
    }
  }, [fetchedDepartments, selectedDepartment]);

  useEffect(() => {
    if (fetchedTeachers.length > 0) {
      setTeachersList(fetchedTeachers);
    }
  }, [fetchedTeachers]);

  // Fetch schedule
  const { data: fetchedCourses = [] } = useQuery({
    queryKey: ["courses", token, selectedDepartment],
    queryFn: async () => {
      const response = await courseAPI.getCourseByDepartmentName(
        roleContext?.role === "SYSADMIN" ? selectedDepartment : undefined
      );
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!token,
  });

  useEffect(() => {
    const courses = fetchedCourses;
    const durations: string[] = [];
    for (const c of courses) {
      if (!durations.includes(c.duration)) durations.push(c.duration);
    }

    const mapDayToKey = (day: string): DayKey => {
      const d = day.trim().toLowerCase();
      if (d.startsWith("hét") || d === "hetfo" || d === "hétfő") return "hetfo";
      if (d.startsWith("ked")) return "kedd";
      if (d.startsWith("sze")) return "szerda";
      if (d.startsWith("csü") || d.startsWith("csu") || d.startsWith("csüt")) return "csutortok";
      if (d.startsWith("pén") || d.startsWith("pen")) return "pentek";
      return "kedd";
    };

    const builtRows: ScheduleRow[] = durations.map((duration) => {
      const base: ScheduleRow = {
        duration,
        hetfo: null,
        kedd: null,
        szerda: null,
        csutortok: null,
        pentek: null,
      };
      for (const c of courses) {
        if (c.duration !== duration) continue;
        const key = mapDayToKey(c.day);
        base[key] = c;
      }
      return base;
    });

    setRows(builtRows);
  }, [fetchedCourses]);

  const handleCellClick = (course: CourseApi | null) => {
    if (!course) return;
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm("Biztosan törölni szeretnéd ezt az órarendet?")) return;
    try {
      await courseAPI.deleteCourse(courseId);
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  const handleCreateCourse = async () => {
    try {
      await courseAPI.createCourse(newCourse);
      setShowCreateCourseModal(false);
      setNewCourse({
        name: "",
        day: "hétfő",
        duration: "09:00-10:30",
        teacherName: "",
        departmentName: ""
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to create course:", error);
    }
  };

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
            Órarend
          </Typography>

          {roleContext?.role === "SYSADMIN" && (
            <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>Osztály / Csoport</InputLabel>
                <Select
                  value={selectedDepartment}
                  label="Osztály / Csoport"
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateCourseModal(true)}
                size="large"
              >
                Új órarend
              </Button>
            </Box>
          )}

          <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: '#fff', fontWeight: 700, width: '120px' }}>
                    Időpont
                  </TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Hétfő</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Kedd</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Szerda</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Csütörtök</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Péntek</TableCell>
                  {roleContext?.role === "SYSADMIN" && (
                    <TableCell sx={{ color: '#fff', fontWeight: 700, width: '80px' }}>
                      Műveletek
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={roleContext?.role === "SYSADMIN" ? 7 : 6} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        Nincs elérhető órarend
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, i) => (
                    <TableRow
                      key={i}
                      sx={{
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700 }}>{r.duration}</TableCell>
                      <TableCell
                        onClick={() => handleCellClick(r.hetfo)}
                        sx={{
                          cursor: r.hetfo ? 'pointer' : 'default',
                          color: r.hetfo ? 'primary.main' : 'text.secondary',
                          fontWeight: r.hetfo ? 500 : 'normal',
                          '&:hover': {
                            textDecoration: r.hetfo ? 'underline' : 'none',
                          },
                        }}
                      >
                        {r.hetfo?.name || ''}
                      </TableCell>
                      <TableCell
                        onClick={() => handleCellClick(r.kedd)}
                        sx={{
                          cursor: r.kedd ? 'pointer' : 'default',
                          color: r.kedd ? 'primary.main' : 'text.secondary',
                          fontWeight: r.kedd ? 500 : 'normal',
                          '&:hover': {
                            textDecoration: r.kedd ? 'underline' : 'none',
                          },
                        }}
                      >
                        {r.kedd?.name || ''}
                      </TableCell>
                      <TableCell
                        onClick={() => handleCellClick(r.szerda)}
                        sx={{
                          cursor: r.szerda ? 'pointer' : 'default',
                          color: r.szerda ? 'primary.main' : 'text.secondary',
                          fontWeight: r.szerda ? 500 : 'normal',
                          '&:hover': {
                            textDecoration: r.szerda ? 'underline' : 'none',
                          },
                        }}
                      >
                        {r.szerda?.name || ''}
                      </TableCell>
                      <TableCell
                        onClick={() => handleCellClick(r.csutortok)}
                        sx={{
                          cursor: r.csutortok ? 'pointer' : 'default',
                          color: r.csutortok ? 'primary.main' : 'text.secondary',
                          fontWeight: r.csutortok ? 500 : 'normal',
                          '&:hover': {
                            textDecoration: r.csutortok ? 'underline' : 'none',
                          },
                        }}
                      >
                        {r.csutortok?.name || ''}
                      </TableCell>
                      <TableCell
                        onClick={() => handleCellClick(r.pentek)}
                        sx={{
                          cursor: r.pentek ? 'pointer' : 'default',
                          color: r.pentek ? 'primary.main' : 'text.secondary',
                          fontWeight: r.pentek ? 500 : 'normal',
                          '&:hover': {
                            textDecoration: r.pentek ? 'underline' : 'none',
                          },
                        }}
                      >
                        {r.pentek?.name || ''}
                      </TableCell>
                      {roleContext?.role === "SYSADMIN" && (
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            {[r.hetfo, r.kedd, r.szerda, r.csutortok, r.pentek].map((course, idx) => (
                              course && (
                                <Tooltip key={idx} title="Törlés">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteCourse(course.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )
                            ))}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Dialog
          open={showModal}
          onClose={() => setShowModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, color: 'primary.main' }}>
            {selectedCourse?.name}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: 'text.secondary' }}
                >
                  Nap:
                </Typography>
                <Typography variant="body1">{selectedCourse?.day}</Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: 'text.secondary' }}
                >
                  Időtartam:
                </Typography>
                <Typography variant="body1">{selectedCourse?.duration}</Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: 'text.secondary' }}
                >
                  Oktató:
                </Typography>
                <Typography variant="body1">{selectedCourse?.teacherName}</Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: 'text.secondary' }}
                >
                  Osztály / csoport:
                </Typography>
                <Typography variant="body1">
                  {selectedCourse?.departmentName}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowModal(false)} color="primary">
              Bezárás
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={showCreateCourseModal}
          onClose={() => setShowCreateCourseModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, color: 'primary.main' }}>
            📝 Új órarend létrehozása
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Tárgy neve"
                value={newCourse.name}
                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                fullWidth
                required
              />
              <FormControl fullWidth required>
                <InputLabel>Nap</InputLabel>
                <Select
                  value={newCourse.day}
                  label="Nap"
                  onChange={(e) => setNewCourse({ ...newCourse, day: e.target.value })}
                >
                  <MenuItem value="hétfő">Hétfő</MenuItem>
                  <MenuItem value="kedd">Kedd</MenuItem>
                  <MenuItem value="szerda">Szerda</MenuItem>
                  <MenuItem value="csütörtök">Csütörtök</MenuItem>
                  <MenuItem value="péntek">Péntek</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Időtartam"
                value={newCourse.duration}
                onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                placeholder="pl. 09:00-10:30"
                fullWidth
                required
              />
              <FormControl fullWidth required>
                <InputLabel>Oktató</InputLabel>
                <Select
                  value={newCourse.teacherName}
                  label="Oktató"
                  onChange={(e) => setNewCourse({ ...newCourse, teacherName: e.target.value })}
                >
                  {teachersList.map((teacher) => (
                    <MenuItem key={teacher} value={teacher}>
                      {teacher}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Osztály</InputLabel>
                <Select
                  value={newCourse.departmentName}
                  label="Osztály"
                  onChange={(e) => setNewCourse({ ...newCourse, departmentName: e.target.value })}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateCourseModal(false)}>Mégse</Button>
            <Button
              onClick={handleCreateCourse}
              variant="contained"
              color="primary"
              disabled={!newCourse.name || !newCourse.teacherName || !newCourse.departmentName}
            >
              Létrehozás
            </Button>
          </DialogActions>
        </Dialog>

        <Box sx={{ textAlign: 'center', mt: 6, color: 'text.secondary' }}>
          <Typography variant="body2">
            © 2025 TanEdu | Hallgatói rendszer
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}