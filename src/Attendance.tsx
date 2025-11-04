import { Typography, Box, FormControl, InputLabel, Select, MenuItem, Button, Table, TableHead, TableRow, TableCell, TableBody, Checkbox, Paper } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { RoleContext } from "./App";
import { useQuery } from "@tanstack/react-query";
import { courseAPI, departmentAPI } from "./API/ApiCalls";

type Student = { id: number; fullName: string; present: boolean };

export default function Attendance() {
  const roleContext = useContext(RoleContext);
  const [selectedCourse, setSelectedCourse] = useState<number | "">("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | "">("");
  const [students, setStudents] = useState<Student[]>([]);
  const token = localStorage.getItem("token");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

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
      const response = await courseAPI.getCourseByDepartmentName(selectedDepartment);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!token && !!selectedDepartment,
  });

  const { data: studentForCourses } = useQuery({
    queryKey: ["students", selectedCourse, token],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const response = await courseAPI.getStudentsForCourses(selectedCourse);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!token && !!selectedCourse,
  });

  useEffect(() => {
    if (studentForCourses) {
      setStudents(studentForCourses.map((s: any) => ({ ...s, present: true })));
    }
  }, [studentForCourses]);

  const handleCourseChange = (courseId: number) => {
    setSelectedCourse(courseId);
    setStudents([]);
  };

  const handlePresenceToggle = (studentId: number) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, present: !s.present } : s))
    );
  };

  const handleSubmit = async () => {
    if (!selectedCourse) return;

    try {
      await fetch("http://localhost:8080/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          date: date,
          students: students.map((s) => ({ studentId: s.id, present: s.present })),
        }),
      });
      alert("Jelenlét mentve!");
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  };

  if (!token) {
    return <Typography color="error">Hiba: Hiányzó jogosultság.</Typography>;
  }

  if (roleContext?.role !== "TEACHER" && roleContext?.role !== "SYSADMIN") {
    return <Typography color="error">Nincs jogosultságod az oldal megtekintéséhez.</Typography>;
  }

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Box
        sx={{
          p: 4,
          maxWidth: "800px",
          margin: "auto",
          mt: 4,
          backdropFilter: "blur(12px)",
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? "rgba(255, 255, 255, 0.7)"
              : "rgba(30, 30, 30, 0.5)",
          borderRadius: 4,
          boxShadow: 3,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Jelenléti ív
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Osztály</InputLabel>
          <Select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            {departmentList?.map((dep) => (
              <MenuItem key={dep.id} value={dep.name}>
                {dep.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Kurzus</InputLabel>
          <Select value={selectedCourse} onChange={(e) => handleCourseChange(e.target.value as number)}>
            {coursesByDepartment?.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedCourse && (
          <>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                marginBottom: 16,
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />

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

            <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
              Mentés
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
