// ...existing code...
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
  Menu,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMenuCourse, setSelectedMenuCourse] = useState<CourseApi | null>(null);

  const [newCourse, setNewCourse] = useState({
    name: "",
    day: "hétfő",
    duration: "08:00-8:45",
    teacherName: "",
    departmentName: ""
  });

  const { data: fetchedDepartments = [] } = useQuery({
    queryKey: ["departments", token],
    queryFn: async () => {
      const response = await departmentAPI.getAll();
      return Array.isArray(response.data) ? response.data.map((d: any) => d.name || d) : [];
    },
    enabled: !!token && roleContext?.role === "SYSADMIN",
  });
  const {data:fetchedSubjects} = useQuery({
    queryKey: ["subject", token],
    queryFn: async () => {
      const response = await courseAPI.getAllAvailableSubjects();
      return Array.isArray(response.data) ? response.data.map((d: any) => d.name || d) : [];
    },
    enabled: !!token && roleContext?.role === "SYSADMIN",
  })

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

  const { data: fetchedCourses = [] } = useQuery({
    queryKey: ["courses", token, selectedDepartment, roleContext?.role],
    queryFn: async () => {
      try {
        let response;
        
        if (roleContext?.role === "SYSADMIN" && selectedDepartment) {
          response = await courseAPI.getCourseByDepartmentName(selectedDepartment);
        } else {
          response = await courseAPI.getCourseByCurrentUser();
        }
        
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        return [];
      }
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
        hetfo: [],
        kedd: [],
        szerda: [],
        csutortok: [],
        pentek: [],
      };
      
      for (const c of courses) {
        if (c.duration !== duration) continue;
        const key = mapDayToKey(c.day);
        base[key].push(c);
      }
      
      return base;
    });

    setRows(builtRows);
  }, [fetchedCourses]);

  const handleCellClick = (course: CourseApi) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, course: CourseApi) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedMenuCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMenuCourse(null);
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm("Biztosan törölni szeretnéd ezt az órarendet?")) return;
    try {
      await courseAPI.deleteCourse(courseId);
      handleMenuClose();
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.name || !newCourse.teacherName || !newCourse.departmentName) {
      alert("Kérlek töltsd ki az összes mezőt!");
      return;
    }

    try {
      await courseAPI.createCourse(newCourse);
      setShowCreateCourseModal(false);
      setNewCourse({
        name: "",
        day: "hétfő",
        duration: "08:00-8:45",
        teacherName: "",
        departmentName: ""
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to create course:", error);
      alert("Ebben az időpontban már van óra!");
    }
  };

  const renderDayCell = (courses: CourseApi[]) => {
    if (courses.length === 0) {
      return <Typography color="text.secondary">-</Typography>;
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {courses.map((course) => (
          <Box
            key={course.id}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              py: 0.5,
            }}
          >
            <Typography
              onClick={() => handleCellClick(course)}
              sx={{
                cursor: 'pointer',
                color: 'primary.main',
                fontWeight: 600,
                flex: 1,
                fontSize: '0.95rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {course.name}
            </Typography>
            {roleContext?.role === "SYSADMIN" && (
              <Tooltip title="Más műveletek">
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, course)}
                  sx={{ opacity: 0.65, '&:hover': { opacity: 1 } }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>

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

            <Paper
              sx={{
                borderRadius: '16px',
                overflow: 'hidden',
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
                      <TableCell sx={{ color: '#fff', fontWeight: 700, width: '120px' }}>
                        Időpont
                      </TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Hétfő</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Kedd</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Szerda</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Csütörtök</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Péntek</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
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
                            transition: 'background-color 0.15s ease, color 0.15s ease',
                            '&:hover': {
                              backgroundColor: (theme) =>
                                theme.palette.mode === 'dark'
                                  ? 'rgba(255,255,255,0.03)'
                                  : 'rgba(227,242,253,0.45)',
                            },
                            '&:hover td, &:hover p, &:hover span': {
                              color: (theme) => theme.palette.text.primary,
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 700, verticalAlign: 'top' }}>
                            {r.duration}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            {renderDayCell(r.hetfo)}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            {renderDayCell(r.kedd)}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            {renderDayCell(r.szerda)}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            {renderDayCell(r.csutortok)}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            {renderDayCell(r.pentek)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>

        {/* Course Details Modal */}
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
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  Nap:
                </Typography>
                <Typography variant="body1">{selectedCourse?.day}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  Időtartam:
                </Typography>
                <Typography variant="body1">{selectedCourse?.duration}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  Oktató:
                </Typography>
                <Typography variant="body1">{selectedCourse?.teacherName}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  Osztály / csoport:
                </Typography>
                <Typography variant="body1">{selectedCourse?.departmentName}</Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowModal(false)} color="primary">
              Bezárás
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleDeleteCourse(selectedMenuCourse?.id || 0)}>
            <DeleteIcon sx={{ mr: 1, fontSize: '1.2rem', color: 'error.main' }} />
            <Typography color="error">Törlés</Typography>
          </MenuItem>
        </Menu>

        {/* Create Course Modal */}
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
              <FormControl fullWidth required>
                <InputLabel>Tárgy neve</InputLabel>
                <Select
                  value={newCourse.name}
                  label="Tárgy neve"
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                >
                  {fetchedSubjects?.map((subject)=>(<MenuItem key={subject} value={subject}>{subject}</MenuItem>))}
                </Select>
              </FormControl>
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
                  {teachersList.map((teacher) => (<MenuItem key={teacher} value={teacher}>{teacher}</MenuItem>))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Osztály</InputLabel>
                <Select
                  value={newCourse.departmentName}
                  label="Osztály"
                  onChange={(e) => setNewCourse({ ...newCourse, departmentName: e.target.value })}
                >
                  {departments.map((dept) => (<MenuItem key={dept} value={dept}>{dept}</MenuItem>))}
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