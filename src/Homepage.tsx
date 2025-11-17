import { useContext, useMemo, useState } from "react";
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
import {Schedule as ScheduleIcon} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { courseAPI, gradeAPI } from "./API/ApiCalls";
import type { CourseApi } from "./types/Schedule";
import { RoleContext } from "./App";

export default function Homepage() {
  const token = localStorage.getItem("token");
  const [selectedSubject, setSelectedSubject] = useState<CourseApi | null>(null);
  const roleContext = useContext(RoleContext);
  const isTeacher = roleContext?.role === "TEACHER" ? true : false

  const { data: coursesRes = [] } = useQuery({
    queryKey: ["courses", token],
    queryFn: async () => {
      const res = await courseAPI.getCourseByCurrentUser();
      return Array.isArray(res?.data) ? res.data : [];
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

  const { data: gradesBySubject = [] } = useQuery({
    queryKey: ["gradesBySubject", token, selectedSubject?.name ?? selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return [];
      const res = await gradeAPI.getAllGradesForCurrentUserBySubject(
        typeof selectedSubject === "string" ? selectedSubject : selectedSubject.name
      );
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

  const achievements = useMemo(() => {
    if (!gradesRes) return 0;
    const good = gradesRes.filter((g: any) => Number(g.value) >= 5).length;
    return good || 0;
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

  const coursesSource = isTeacher ? coursesByTeacher : coursesRes;

  const scheduleRows = useMemo(() => {
    const courses = coursesSource || [];
    const durations: string[] = [];
    for (const c of courses) {
      const dur = (c.duration ?? "").toString();
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

    // sort by start time (then by end time as tiebreaker)
    durations.sort((a, b) => {
      const sa = startMinutes(a);
      const sb = startMinutes(b);
      if (sa !== sb) return sa - sb;
      return endMinutes(a) - endMinutes(b);
    });
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

  const renderCell = (courses: any[]) => {
    if (!courses || courses.length === 0) {
      return (
        <Typography color="text.secondary" sx={{ fontSize: "0.875rem", fontStyle: "italic", py: 1 }}>
          —
        </Typography>
      );
    }
    return (
      <Box>
        {courses.map((c: any, idx: number) => (
          <Box
            key={c.id ?? idx}
            onClick={() => setSelectedSubject(c)}
            sx={{
              py: 1.5,
              px: 1.5,
              mb: idx < courses.length - 1 ? 1 : 0,
              borderRadius: 2,
              background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)",
              border: "1px solid rgba(59,130,246,0.15)",
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(59,130,246,0.2)",
                borderColor: "rgba(59,130,246,0.3)",
              },
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "primary.main", mb: 0.5 }}>
              📚 {c.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5 }}>
              👨‍🏫 {c.teacherName ?? c.teacher ?? "-"}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  console.log(selectedSubject);
  
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Áttekintés cím középen */}
        <Typography variant="h4" align="center" fontWeight={600} sx={{ mb: 3 }}>
          Áttekintés
        </Typography>

        {/* Két kártya (Tantárgyi átlag, Jelvények) */}
        <Grid container spacing={3} justifyContent="center" sx={{ mb: 3 }}>
          <Grid sx={{xs:12, sm:6, md:4}}>
            <Card sx={{ textAlign: "center", py: 3 }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary">
                  Tantárgyi átlag
                </Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {avgBySubject ?? "0.0"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid sx={{xs:12, sm:6, md:4}}>
            <Card sx={{ textAlign: "center", py: 3 }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary">
                  Jelvények / elismerések
                </Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {achievements}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Full week schedule */}
        <Grid container justifyContent="center">
          <Grid sx={{xs:12}}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 4,
                background: "linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(139,92,246,0.05) 100%)",
                border: "1px solid",
                borderColor: "rgba(255,255,255,0.1)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
                    boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
                  }}
                >
                  <ScheduleIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
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
                    background: "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    px: 2,
                    boxShadow: "0 4px 15px rgba(16,185,129,0.3)",
                  }}
                />
              </Box>

              <Divider sx={{ mb: 3, borderColor: "rgba(255,255,255,0.1)" }} />

              <TableContainer
                component={Paper}
                sx={{
                  boxShadow: "none",
                  background: "transparent",
                  border: "1px solid",
                  borderColor: "rgba(255,255,255,0.08)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)" }}>
                      <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", py: 2, borderBottom: "none" }}>
                        ⏰ Időpont
                      </TableCell>
                      {daysOrder.map((d) => (
                        <TableCell
                          key={d}
                          sx={{
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            py: 2,
                            borderBottom: "none",
                            background: d === todayName ? "rgba(255,255,255,0.2)" : "transparent",
                          }}
                        >
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                          {d === todayName && (
                            <Box component="span" sx={{ ml: 1, fontSize: "0.75rem", bgcolor: "rgba(16,185,129,0.9)", px: 1, py: 0.3, borderRadius: 1, fontWeight: 600 }}>
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
                          <Box sx={{ textAlign: "center" }}>
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                              📅
                            </Typography>
                            <Typography color="text.secondary">Nincs elérhető órarend</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      scheduleRows.map((r: any, idx: number) => (
                        <TableRow key={idx} sx={{ "&:hover": { bgcolor: "rgba(59,130,246,0.05)" }, transition: "all 0.2s ease" }}>
                          <TableCell sx={{ fontWeight: 700, verticalAlign: "top", color: "primary.main", fontSize: "0.9rem", borderBottom: idx === scheduleRows.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
                            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, bgcolor: "rgba(59,130,246,0.1)", px: 2, py: 1, borderRadius: 2, border: "1px solid rgba(59,130,246,0.2)" }}>
                              {r.duration}
                            </Box>
                          </TableCell>
                          {daysOrder.map((d) => (
                            <TableCell key={d} sx={{ verticalAlign: "top", bgcolor: d === todayName ? "rgba(16,185,129,0.03)" : "transparent", borderBottom: idx === scheduleRows.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
                              {d === todayName && <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: "linear-gradient(180deg, #10B981 0%, #3B82F6 100%)" }} />}
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