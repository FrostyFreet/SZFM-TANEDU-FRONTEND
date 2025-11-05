import React, { useState, useContext } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Stack,
} from "@mui/material";
import { authAPI, courseAPI, departmentAPI } from "./API/ApiCalls";
import { useQuery } from "@tanstack/react-query";
import { RoleContext } from "./App";

export default function CreateUser() {
  const roleContext = useContext(RoleContext);
  const token = localStorage.getItem("token");

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
      (roleContext?.role === "SYSADMIN" || roleContext?.role === "TEACHER"),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", token],
    queryFn: async () => {
      const res = await departmentAPI.getAll();
      return Array.isArray(res?.data) ? res.data : [];
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "STUDENT",
    birth_date: "",
    subject: "",
    departmentId: "" as number | "",
    classLeaderOfId: "" as number | "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const roles = ["STUDENT", "TEACHER", "SYSADMIN", "CLASSLEADER"];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    if (!form.email || !form.firstName || !form.lastName || !form.password || !form.role) {
      setMessage({ type: "error", text: "Tölts ki minden kötelező mezőt!" });
      return false;
    }

    if (!emailRegex.test(form.email)) {
      setMessage({ type: "error", text: "Érvénytelen e-mail cím." });
      return false;
    }

    if (!form.birth_date) {
      setMessage({ type: "error", text: "Add meg a születési dátumot." });
      return false;
    }

    const birth = new Date(form.birth_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    birth.setHours(0, 0, 0, 0);
    if (birth > today) {
      setMessage({ type: "error", text: "A születési dátum nem lehet a jövőben." });
      return false;
    }

    if (form.role === "TEACHER" && !form.subject) {
      setMessage({ type: "error", text: "Tanár szerephez add meg a tantárgyat!" });
      return false;
    }

    if ((form.role === "STUDENT" || form.role === "TEACHER") && !form.departmentId) {
      setMessage({ type: "error", text: "Diák/Tanár szerephez válassz egy osztályt/csoportot!" });
      return false;
    }

    if (form.role === "CLASSLEADER" && !form.classLeaderOfId) {
      setMessage({ type: "error", text: "Osztályfőnök szerephez válassz egy osztályt!" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMessage(null);
    if (!validate()) return;

    const payload: any = {
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      birthDate: form.birth_date,
      password: form.password,
      role: form.role,
    };
    if (form.role === "TEACHER") payload.subject = form.subject;
    if (form.departmentId) payload.department = { id: Number(form.departmentId) };
    if (form.role === "CLASSLEADER" && form.classLeaderOfId) {
      payload.classLeaderOf = { id: Number(form.classLeaderOfId) };
    }

    setLoading(true);
    try {
      const res = await authAPI.createUser(payload);
      if (res?.status === 201 || res?.data?.message) {
        setMessage({ type: "success", text: "Felhasználó sikeresen létrehozva." });
        setForm({
          email: "",
          firstName: "",
          lastName: "",
          password: "",
          role: "STUDENT",
          birth_date: "",
          subject: "",
          departmentId: "",
          classLeaderOfId: "",
        });
      } else {
        setMessage({ type: "error", text: res?.data?.error ?? "Hiba történt." });
      }
    } catch (err: any) {
      const text = err?.response?.data?.error || err?.response?.data?.message || "Hiba történt a szerverrel.";
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  if (roleContext?.role !== "SYSADMIN") return null;

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Új felhasználó létrehozása
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {message && <Alert severity={message.type}>{message.text}</Alert>}

              <TextField
                label="E-mail"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Vezetéknév"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Keresztnév"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Jelszó"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Születési idő"
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                fullWidth
                required
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <FormControl fullWidth required>
                <InputLabel>Szerep</InputLabel>
                <Select
                  value={form.role}
                  label="Szerep"
                  onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                >
                  {roles.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {form.role === "TEACHER" && (
                <FormControl fullWidth required>
                  <InputLabel>Tantárgy</InputLabel>
                  <Select
                    value={form.subject}
                    label="Tantárgy"
                    onChange={(e) => setForm({ ...form, subject: e.target.value as any })}
                  >
                    {fetchedSubjects &&
                      fetchedSubjects.map((subject: any) => (
                        <MenuItem key={subject} value={subject}>
                          {subject}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}

              {(form.role === "STUDENT" || form.role === "TEACHER") && (
                <FormControl fullWidth required>
                  <InputLabel>Osztály / Csoport</InputLabel>
                  <Select
                    value={form.departmentId}
                    label="Osztály / Csoport"
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value as any })}
                  >
                    <MenuItem value="">
                      <em>Válassz</em>
                    </MenuItem>
                    {departments.map((d: any) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {form.role === "CLASSLEADER" && (
                <FormControl fullWidth required>
                  <InputLabel>Osztály amelynek osztályfőnöke lesz</InputLabel>
                  <Select
                    value={form.classLeaderOfId}
                    label="Osztály amelynek osztályfőnöke lesz"
                    onChange={(e) => setForm({ ...form, classLeaderOfId: e.target.value as any })}
                  >
                    <MenuItem value="">
                      <em>Válassz</em>
                    </MenuItem>
                    {departments.map((d: any) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button type="submit" variant="contained" disabled={loading} fullWidth>
                  Létrehozás
                </Button>
                <Button
                  variant="outlined"
                  onClick={() =>
                    setForm({
                      email: "",
                      firstName: "",
                      lastName: "",
                      password: "",
                      role: "STUDENT",
                      subject: "",
                      birth_date: "",
                      departmentId: "",
                      classLeaderOfId: "",
                    })
                  }
                  fullWidth
                >
                  Törlés
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}