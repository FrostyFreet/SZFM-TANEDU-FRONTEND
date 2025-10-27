import { useState, useEffect } from "react";
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
} from '@mui/material';
import AppBarNav from './components/AppBarNav';
import type { Grade } from "./types/Grade";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function Grades() {
  const [jegyek, setJegyek] = useState<Grade[]>([]);
  const token = localStorage.getItem("token");

  const fetchGrades = async (): Promise<Grade[]> => {
    if (!token) return [];
    try {
      const response = await axios.get("http://localhost:8080/api/grade/getAllByCurrentUser", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    
      if (Array.isArray(response.data)) {
        return response.data.map((item: any) => ({
          targy: item.comment || "Ismeretlen",
          jegy: item.value || 0,
          datum: new Date().toLocaleDateString('hu-HU'), 
          megjegyzes: item.teacherName || "Nincs megjegyzés",
        }));
      }
      return [];
    } catch (err) {
      console.error("Grades fetch failed:", err);
      return [];
    }
  };

  const { data: fetchedGrades, isLoading } = useQuery({
    queryKey: ["grades", token],
    queryFn: fetchGrades, 
    enabled: !!token,
  });

  useEffect(() => {
    if (fetchedGrades) {
      setJegyek(fetchedGrades);
    }
  }, [fetchedGrades]);

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