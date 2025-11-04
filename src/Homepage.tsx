// ...existing code...
import { useMemo, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Grade as GradeIcon, CheckCircle, Message as MessageIcon, EmojiEvents, Schedule as ScheduleIcon } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { courseAPI, gradeAPI, messageAPI } from "./API/ApiCalls";
import type { CourseApi } from "./types/Schedule";

export default function Homepage() {
  const token = localStorage.getItem("token");
  const [selectedSubject, setSelectedSubject] = useState<CourseApi | null>(null);

  const { data: coursesRes = [] } = useQuery({
    queryKey: ["courses", token],
    queryFn: async () => {
      const res = await courseAPI.getCourseByCurrentUser();
      return Array.isArray(res?.data) ? res.data : [];
    },
    enabled: !!token,
  });

  const { data: gradesBySubject = [] } = useQuery({
    queryKey: ["gradesBySubject", token, selectedSubject?.name ?? selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return [];
      const res = await gradeAPI.getAllGradesForCurrentUserBySubject(selectedSubject.name);
      return Array.isArray(res?.data) ? res.data : [];
    },
    enabled: !!token && !!selectedSubject,
    staleTime: 2 * 60 * 1000,
  });
  
  

  const { data: gradesRes = [] } = useQuery({
    queryKey: ["grades", token],
    queryFn: async () => {
      const res = await gradeAPI.getAllByCurrentUser();
      return Array.isArray(res?.data) ? res.data : [];
    },
    enabled: !!token,
  });

  console.log(gradesBySubject);
  

  const { data: messagesRes = [] } = useQuery({
    queryKey: ["messages", token],
    queryFn: async () => {
      const res = await messageAPI.getMessagesByCurrentUser();
      return Array.isArray(res?.data) ? res.data : [];
    },
    enabled: !!token,
  });

  const avgBySubject = useMemo(() => {
  if (!gradesBySubject || gradesBySubject.length === 0) return null;

  const vals = gradesBySubject.map((g: any) => {
    if (typeof g === "number") return g;
    const candidate = g?.value ?? g;
    const num = Number(candidate);
    return Number.isFinite(num) ? num : 0;
  });

  const avg = vals.reduce((sum, v) => sum + v, 0) / vals.length;
  return Math.floor(avg);
}, [gradesBySubject]);

  console.log(avgBySubject);
  

  const unreadMessages = useMemo(() => {
    if (!messagesRes) return 0;
    return messagesRes.filter((m: any) => !m.read).length || 0;
  }, [messagesRes]);

  const attendancePercent = useMemo(() => 95, []);

  const achievements = useMemo(() => {
    if (!gradesRes) return 0;
    const good = gradesRes.filter((g: any) => Number(g.value) >= 5).length;
    return good || 12;
  }, [gradesRes]);

  const daysOrder = ["hétfő", "kedd", "szerda", "csütörtök", "péntek"];

  const mapDayKey = (day: string) => {
    const d = (day || "").toString().toLowerCase();
    if (d.startsWith("hét") || d === "hetfo" || d === "hétfő") return "hétfő";
    if (d.startsWith("ked")) return "kedd";
    if (d.startsWith("sze")) return "szerda";
    if (d.startsWith("csü") || d.startsWith("csu") || d.startsWith("csüt")) return "csütörtök";
    if (d.startsWith("pén") || d.startsWith("pen")) return "péntek";
    return d;
  };

  // build table rows grouped by duration (time slot)
  const scheduleRows = useMemo(() => {
    const courses = coursesRes || [];
    const durations: string[] = [];
    for (const c of courses) {
      const dur = (c.duration ?? "").toString();
      if (dur && !durations.includes(dur)) durations.push(dur);
    }
    durations.sort(); // simple sort by string (you can customize)

    type ScheduleRow = { duration: string } & Record<string, any[]>;
    return durations.map((duration) => {
      const row: ScheduleRow = { duration } as ScheduleRow;
      for (const day of daysOrder) row[day] = [];
      for (const c of courses) {
        if ((c.duration ?? "") !== duration) continue;
        const dayKey = mapDayKey(c.day);
        if (daysOrder.includes(dayKey)) row[dayKey].push(c);
      }
      return row;
    });
  }, [coursesRes]);

  const todayName = useMemo(() => {
    const days = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
    return days[new Date().getDay()];
  }, []);

  // helper to render cell content - FRISSÍTETT VERZIÓ
  const renderCell = (courses: any[]) => {
    if (!courses || courses.length === 0) {
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
      <Box>
        {courses.map((c, idx) => (
          <Box 
            key={c.id} 
            onClick={() => setSelectedSubject(c)}
            sx={{ 
              py: 1.5,
              px: 1.5,
              mb: idx < courses.length - 1 ? 1 : 0,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)',
              border: '1px solid rgba(59,130,246,0.15)',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(59,130,246,0.2)',
                borderColor: 'rgba(59,130,246,0.3)',
              }
            }}
          >
            <Typography 
              sx={{ 
                fontWeight: 600,
                fontSize: '0.9rem',
                color: 'primary.main',
                mb: 0.5
              }}
              
            >
              📚 {c.name}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              👨‍🏫 {c.teacherName ?? c.teacher ?? "-"}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3} alignItems="stretch">
          <Grid sx={{xs:12}} >
            <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
              Áttekintés
            </Typography>
          </Grid>

          <Grid sx={{xs:12, md:8}} >
            <Grid container spacing={2}>
              <Grid sx={{xs:12, sm:6}}>
                <Card sx={{ height: "100%", borderRadius: 2 }}>
                  <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      <GradeIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">Tantárgyi átlag</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{avgBySubject ?? "—"}</Typography>
                    </Box>
                    <Chip label={avgBySubject ? "friss" : "nincs adat"} size="small" />
                  </CardContent>
                </Card>
              </Grid>

              <Grid sx={{xs:12, sm:6}}>
                <Card sx={{ height: "100%", borderRadius: 2 }}>
                  <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: "success.main" }}>
                      <CheckCircle />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">Jelenléti arány</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{attendancePercent}%</Typography>
                    </Box>
                    <Chip label="+/-" size="small" />
                  </CardContent>
                </Card>
              </Grid>

              <Grid sx={{xs:12, sm:6}}>
                <Card sx={{ height: "100%", borderRadius: 2 }}>
                  <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: "info.main" }}>
                      <MessageIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">Olvasatlan üzenetek</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{unreadMessages}</Typography>
                    </Box>
                    <Chip label="U" size="small" />
                  </CardContent>
                </Card>
              </Grid>

              <Grid sx={{xs:12, sm:6}}>
                <Card sx={{ height: "100%", borderRadius: 2 }}>
                  <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: "secondary.main" }}>
                      <EmojiEvents />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">Jelvények / elismerések</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{achievements}</Typography>
                    </Box>
                    <Chip label="Top" size="small" />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Full week schedule - FRISSÍTETT VERZIÓ */}
          <Grid sx={{xs:12}}>
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(139,92,246,0.05) 100%)',
                border: '1px solid',
                borderColor: 'rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 20px rgba(59,130,246,0.4)'
                }}>
                  <ScheduleIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
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
                    boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
                  }}
                />
              </Box>

              <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

              <TableContainer 
                component={Paper} 
                sx={{ 
                  boxShadow: 'none',
                  background: 'transparent',
                  border: '1px solid',
                  borderColor: 'rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  overflow: 'hidden'
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
                          borderBottom: 'none'
                        }}
                      >
                        ⏰ Időpont
                      </TableCell>
                      {daysOrder.map((d) => (
                        <TableCell 
                          key={d} 
                          sx={{ 
                            color: '#fff', 
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            py: 2,
                            borderBottom: 'none',
                            background: d === todayName ? 'rgba(255,255,255,0.2)' : 'transparent',
                          }}
                        >
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                          {d === todayName && (
                            <Box 
                              component="span" 
                              sx={{ 
                                ml: 1, 
                                fontSize: '0.75rem',
                                bgcolor: 'rgba(16,185,129,0.9)',
                                px: 1,
                                py: 0.3,
                                borderRadius: 1,
                                fontWeight: 600
                              }}
                            >
                              MA
                            </Box>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scheduleRows.length === 0 ? (
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
                      scheduleRows.map((r: any, idx: number) => (
                        <TableRow 
                          key={idx}
                          sx={{
                            '&:hover': {
                              bgcolor: 'rgba(59,130,246,0.05)',
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <TableCell 
                            sx={{ 
                              fontWeight: 700, 
                              verticalAlign: "top",
                              color: 'primary.main',
                              fontSize: '0.9rem',
                              borderBottom: idx === scheduleRows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'
                            }}
                          >
                            <Box sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1,
                              bgcolor: 'rgba(59,130,246,0.1)',
                              px: 2,
                              py: 1,
                              borderRadius: 2,
                              border: '1px solid rgba(59,130,246,0.2)'
                            }}>
                              {r.duration}
                            </Box>
                          </TableCell>
                          {daysOrder.map((d) => (
                            <TableCell 
                              key={d} 
                              sx={{ 
                                verticalAlign: "top",
                                bgcolor: d === todayName ? 'rgba(16,185,129,0.03)' : 'transparent',
                                borderBottom: idx === scheduleRows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                position: 'relative'
                              }}
                            >
                              {d === todayName && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: '3px',
                                    background: 'linear-gradient(180deg, #10B981 0%, #3B82F6 100%)',
                                  }}
                                />
                              )}
                              {renderCell(r[d])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
// ...existing code...