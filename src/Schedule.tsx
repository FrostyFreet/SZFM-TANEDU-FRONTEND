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
  IconButton,
  Tooltip,
  Menu,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Schedule as ScheduleIcon } from '@mui/icons-material';
import type { ScheduleRow, CourseApi, DayKey } from "./types/Schedule";
import { RoleContext } from "./App";
import { courseAPI, departmentAPI, userAPI } from "./API/ApiCalls";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";

const itemLabel = (v: any) => {
    if (!v && v !== 0) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (v?.name) return String(v.name);
    if (v?.email) return String(v.email);
    if (v?.id) return String(v.id);
    try { return JSON.stringify(v); } catch { return String(v); }
  };

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
  const durationList = ["8:00-8:45", "9:00-9:45", "10:00-10:45","11:00-11:45","12:00-12:45","13:00-13:45","14:00-14:45"]
  const isTeacher = roleContext?.role === "TEACHER" ? true : false
  const navigate = useNavigate()
  const [substituteTeacher, setSubstituteTeacher] = useState<string | null>(null);
  
  const [newCourse, setNewCourse] = useState({
    name: "",
    day: "hétfő",
    duration: durationList[0],
    teacherName: "",
    departmentName: ""
  });

   const { data: fetchedDepartments = [] } = useQuery({
    queryKey: ["departments", token],
    queryFn: async () => {
      const response = await departmentAPI.getAll();
      if (!Array.isArray(response.data)) return [];
      return response.data.map((d: any) => itemLabel(d));
    },
    enabled: !!token && roleContext?.role === "SYSADMIN",
  });
  
  const { data: fetchedSubjects = [] } = useQuery({
    queryKey: ["subject", token],
    queryFn: async () => {
      const response = await courseAPI.getAllAvailableSubjects();
      if (!Array.isArray(response.data)) return [];
      return response.data.map((d: any) => itemLabel(d));
    },
    enabled: !!token && roleContext?.role === "SYSADMIN",
  });

  const { data: fetchedTeachers = [] } = useQuery({
    queryKey: ["teachers", token],
    queryFn: async () => {
      const response = await userAPI.getAllTeachersEmail();
      if (!Array.isArray(response.data)) return [];
      return response.data.map((t: any) => itemLabel(t));
    },
    enabled: !!token,
  });
  const { data: coursesByTeacher = [] } = useQuery({
    queryKey: ["coursesByTeacher", token],
    queryFn: async () => {
      const res = await courseAPI.getCoursesByTeacher();
      return Array.isArray(res?.data) ? res.data : [];
    },
    enabled: !!token && isTeacher,
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

  const coursesSource = isTeacher ? coursesByTeacher : fetchedCourses;

useEffect(() => {
  const courses = coursesSource || [];
  const durations: string[] = [];

  for (const c of courses) {
    const dur = (c.duration ?? "").toString().trim();
    if (dur && !durations.includes(dur)) durations.push(dur);
  }

  const timeToMinutes = (time: string) => {
    const m = time.match(/(\d{1,2}):(\d{2})/);
    if (!m) return Number.POSITIVE_INFINITY;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  };
  const startMinutes = (range: string) => {
    const match = range.match(/(\d{1,2}:\d{2})/);
    return match ? timeToMinutes(match[1]) : Number.POSITIVE_INFINITY;
  };
  const endMinutes = (range: string) => {
    const matches = range.match(/(\d{1,2}:\d{2})/g);
    return matches && matches[1] ? timeToMinutes(matches[1]) : Number.POSITIVE_INFINITY;
  };

  durations.sort((a, b) => {
    const sa = startMinutes(a);
    const sb = startMinutes(b);
    if (sa !== sb) return sa - sb;
    return endMinutes(a) - endMinutes(b);
  });

  const mapDayToKey = (day: string): DayKey => {
    const d = (day || "").toLowerCase().trim();
    if (d.startsWith("hét")) return "hetfo";
    if (d.startsWith("ked")) return "kedd";
    if (d.startsWith("sze")) return "szerda";
    if (d.startsWith("cs")) return "csutortok";
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
      if ((c.duration ?? "").toString().trim() !== duration) continue;
      const key = mapDayToKey(c.day);
      base[key].push(c);
    }

    return base;
  });

  setRows(builtRows);
}, [coursesSource]);


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
        duration: durationList[0],
        teacherName: "",
        departmentName: ""
      });
      navigate(0)
    } catch (error:any) {
     console.error("Failed to create course:", error);
    const raw = error?.response?.data?.message || error?.response?.data?.error || error?.response?.data || error?.message || "";
    let msg = String(raw);

    if (/Teacher not found/i.test(msg)) {
      msg = "Oktató nem található. Ellenőrizd az oktató adatait.";
    } else if (/student.*teacher|cannot be assigned as a teacher/i.test(msg)) {
      msg = "Nem állíthatsz be tanulót oktatóként.";
    } else if (/Invalid subject/i.test(msg)) {
      msg = "Érvénytelen tárgynév.";
    } else if (/does not teach.*subject|doesn't teach this subject/i.test(msg)) {
      msg = "A kiválasztott oktató nem tanítja ezt a tárgyat.";
    } else if (/already has a course/i.test(msg)) {
      // Extract details from the error message if present
      msg = "Az oktatónak vagy az osztálynak már van órája ebben az időpontban.";
    } else if (!msg) {
      msg = "Hiba történt az óra létrehozása közben.";
    }

    alert(msg);
    }
  };

  const todayName = (() => {
    const days = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
    return days[new Date().getDay()];
  })();

  const dayKeyToName: Record<DayKey, string> = {
    hetfo: "hétfő",
    kedd: "kedd",
    szerda: "szerda",
    csutortok: "csütörtök",
    pentek: "péntek",
  };

  const renderDayCell = (courses: CourseApi[], dayKey: DayKey) => {
    const dayName = dayKeyToName[dayKey];
    const isToday = dayName === todayName;

    if (courses.length === 0) {
      return (
        <Typography 
          color="text.secondary" 
          sx={{ 
            fontSize: '0.875rem',
            fontStyle: 'italic',
            py: 1
          }}
        >
          —
        </Typography>
      );
    }

    return (
      <Box sx={{ position: 'relative' }}>
        {isToday && (
          <Box
            sx={{
              position: 'absolute',
              left: -16,
              top: 0,
              bottom: 0,
              width: '3px',
              background: 'linear-gradient(180deg, #10B981 0%, #3B82F6 100%)',
            }}
          />
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {courses.map((course) => (
            <Box
              key={course.id}
              sx={{
                py: 1.5,
                px: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)',
                border: '1px solid rgba(59,130,246,0.15)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.2)',
                  borderColor: 'rgba(59,130,246,0.3)',
                },
              }}
              onClick={() => handleCellClick(course)}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: 'primary.main',
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  📚 {course.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  👨‍🏫 {course.teacherName}
                </Typography>
              </Box>
              {roleContext?.role === "SYSADMIN" && (
                <Tooltip title="Műveletek">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, course);
                    }}
                    sx={{
                      opacity: 0.6,
                      '&:hover': { opacity: 1 },
                      flexShrink: 0,
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(139,92,246,0.05) 100%)',
            border: '1px solid',
            borderColor: 'rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
                width: 56,
                height: 56,
              }}
            >
              <ScheduleIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Heti órarend
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Teljes heti áttekintés
              </Typography>
            </Box>
            <Chip
              label={todayName.charAt(0).toUpperCase() + todayName.slice(1)}
              size="medium"
              sx={{
                background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
                color: '#fff',
                fontWeight: 700,
                px: 2,
                boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
              }}
            />
          </Box>

          {roleContext?.role === "SYSADMIN" && (
            <>
              <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 250 }}>
                  <InputLabel>Osztály / Csoport</InputLabel>
                  <Select
                    value={selectedDepartment}
                    label="Osztály / Csoport"
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    {departments.map((dept, idx) => (
                      <MenuItem key={idx} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowCreateCourseModal(true)}
                  size="large"
                  sx={{
                    background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
                    boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #2563EB 100%)',
                      boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
                    },
                  }}
                >
                  Új órarend
                </Button>
              </Box>
            </>
          )}
        </Paper>

        {/* Schedule Table */}
        <Paper
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <TableContainer
            component={Paper}
            sx={{
              boxShadow: 'none',
              background: 'transparent',
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  }}
                >
                  <TableCell
                    sx={{
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      py: 2,
                      borderBottom: 'none',
                      width: '120px',
                    }}
                  >
                    ⏰ Időpont
                  </TableCell>
                  {(Object.keys(dayKeyToName) as DayKey[]).map((dayKey) => {
                    const dayName = dayKeyToName[dayKey];
                    const isToday = dayName === todayName;
                    return (
                      <TableCell
                        key={dayKey}
                        sx={{
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          py: 2,
                          borderBottom: 'none',
                          background: isToday ? 'rgba(255,255,255,0.2)' : 'transparent',
                        }}
                      >
                        {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
                        {isToday && (
                          <Box
                            component="span"
                            sx={{
                              ml: 1,
                              fontSize: '0.75rem',
                              bgcolor: 'rgba(16,185,129,0.9)',
                              px: 1,
                              py: 0.3,
                              borderRadius: 1,
                              fontWeight: 600,
                            }}
                          >
                            MA
                          </Box>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          📅
                        </Typography>
                        <Typography color="text.secondary">
                          Nincs elérhető órarend
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        '&:hover': {
                          bgcolor: 'rgba(59,130,246,0.05)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          verticalAlign: 'top',
                          color: 'primary.main',
                          fontSize: '0.9rem',
                          borderBottom:
                            idx === rows.length - 1
                              ? 'none'
                              : '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            bgcolor: 'rgba(59,130,246,0.1)',
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            border: '1px solid rgba(59,130,246,0.2)',
                          }}
                        >
                          {r.duration}
                        </Box>
                      </TableCell>
                      {(Object.keys(dayKeyToName) as DayKey[]).map((dayKey) => {
                        const dayName = dayKeyToName[dayKey];
                        const isToday = dayName === todayName;
                        return (
                          <TableCell
                            key={dayKey}
                            sx={{
                              verticalAlign: 'top',
                              bgcolor: isToday ? 'rgba(16,185,129,0.03)' : 'transparent',
                              borderBottom:
                                idx === rows.length - 1
                                  ? 'none'
                                  : '1px solid rgba(255,255,255,0.05)',
                              position: 'relative',
                              px: 2,
                            }}
                          >
                            {renderDayCell(r[dayKey], dayKey)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Course Details Modal */}
        <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, color: 'primary.main' }}>
            📚 {selectedCourse?.name}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(59,130,246,0.05)',
                  border: '1px solid rgba(59,130,246,0.1)',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
                  📅 Nap:
                </Typography>
                <Typography variant="body1">{selectedCourse?.day}</Typography>
              </Box>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(139,92,246,0.05)',
                  border: '1px solid rgba(139,92,246,0.1)',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
                  ⏰ Időtartam:
                </Typography>
                <Typography variant="body1">{selectedCourse?.duration}</Typography>
              </Box>
              <Box
  sx={{
    p: 2,
    borderRadius: 2,
    bgcolor: 'rgba(16,185,129,0.05)',
    border: '1px solid rgba(16,185,129,0.1)',
  }}
>
  <Typography
    variant="body2"
    sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5 }}
  >
    👨‍🏫 Oktató:
  </Typography>

  {roleContext?.role === "SYSADMIN" ? (
    <FormControl fullWidth size="small">
      <Select
        value={substituteTeacher || selectedCourse?.teacherName || ""}
        onChange={(e) => setSubstituteTeacher(e.target.value)}
      >
        {teachersList.map((teacher) => (
          <MenuItem key={teacher} value={teacher}>
            {teacher}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  ) : substituteTeacher && substituteTeacher !== selectedCourse?.teacherName ? (
    <Box>
      <Typography
        variant="body1"
        sx={{ textDecoration: "line-through", color: "error.main" }}
      >
        {selectedCourse?.teacherName}
      </Typography>
      <Typography variant="body1" sx={{ color: "success.main" }}>
        helyettesítő: {substituteTeacher}
      </Typography>
    </Box>
  ) : (
    <Typography variant="body1">{selectedCourse?.teacherName}</Typography>
  )}
</Box>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(245,158,11,0.05)',
                  border: '1px solid rgba(245,158,11,0.1)',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
                  🏫 Osztály / csoport:
                </Typography>
                <Typography variant="body1">{selectedCourse?.departmentName}</Typography>
              </Box>
            </Box>
          </DialogContent>
<DialogActions>
  <Button onClick={() => setShowModal(false)}>Bezárás</Button>

  {roleContext?.role === "SYSADMIN" &&
    substituteTeacher &&
    substituteTeacher !== selectedCourse?.teacherName && (
      <Button
        onClick={async () => {
          try {
            await courseAPI.updateCourseTeacher(selectedCourse.id, substituteTeacher);
            alert("Helyettesítő tanár mentve!");
            setShowModal(false);
            setSubstituteTeacher(null);
            navigate(0); // újratöltés
          } catch (err) {
            console.error(err);
            alert("Nem sikerült a helyettesítőt menteni.");
          }
        }}
        variant="contained"
        color="success"
      >
        Mentés
      </Button>
    )}
</DialogActions>

        </Dialog>

        {/* Delete Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
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
            ✨ Új órarend létrehozása
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
                  {fetchedSubjects?.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
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
              <FormControl fullWidth required>
                <InputLabel>Időtartam</InputLabel>
                <Select
                  value={newCourse.duration}
                  label="Időtartam"
                  onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                >
                  {durationList.map((duration) => (
                    <MenuItem key={duration} value={duration}>
                      {duration}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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
              sx={{
                background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #2563EB 100%)',
                },
              }}
            >
              Létrehozás
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}