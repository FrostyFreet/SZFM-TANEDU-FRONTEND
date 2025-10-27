// ...existing code...
import { useEffect, useState } from "react";
import axios from "axios";
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
} from '@mui/material';
import AppBarNav from './components/AppBarNav';
import type { ScheduleRow, CourseApi, DayKey } from "./types/Schedule";


export default function Schedule() {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseApi | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        if (!token) {
          setRows([]);
          return;
        }
        const resp = await axios.get<CourseApi[]>(
          "http://localhost:8080/api/course/getCourseByDepartmentName",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const courses = Array.isArray(resp.data) ? resp.data : [];

        // build unique durations preserving first appearance order
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
      } catch (error) {
        console.error("Schedule fetch failed:", error);
        setRows([]);
      }
    };

    fetchSchedule();
  }, [token]);

  const handleCellClick = (course: CourseApi | null) => {
    if (!course) return;
    setSelectedCourse(course);
    setShowModal(true);
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

        <Box sx={{ textAlign: 'center', mt: 6, color: 'text.secondary' }}>
          <Typography variant="body2">
            © 2025 TanEdu | Hallgatói rendszer
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
