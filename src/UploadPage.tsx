import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Stack,
  Divider,
} from '@mui/material';
import { uploadImage, messageAPI, userAPI, courseAPI } from './API/ApiCalls';
import { useQuery } from '@tanstack/react-query';


export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // fetch current user once (used for sender name / fallback)
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await userAPI.getCurrentUser();
      return res?.data ?? null;
    },
    enabled: !!localStorage.getItem('token'),
    staleTime: 5 * 60 * 1000,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    setSelectedFile(f ?? null);
  };

  // try to resolve class leader email from multiple possible sources
  const resolveClassLeaderEmail = async (): Promise<string | null> => {
    try {
      // 1) try course for current user (common backend shape)
      const courseRes = await courseAPI.getCourseByCurrentUser().catch(() => null);
      const course = courseRes?.data;
      if (course) {
        // common possible fields
        if (course.classLeader?.email) return course.classLeader.email;
        if (course.teacher?.email) return course.teacher.email;
        if (course.leaderEmail) return course.leaderEmail;
      }

      // 2) try current user's record for explicit class leader reference
      const user = currentUser ?? (await userAPI.getCurrentUser().then(r => r.data).catch(() => null));
      if (user) {
        if (user.classLeader?.email) return user.classLeader.email;
        if (user.classLeaderEmail) return user.classLeaderEmail;
        if (user.class_leader_email) return user.class_leader_email;
      }

      // 3) fallback: try first teacher email from backend (less ideal)
      const teachersRes = await userAPI.getAllTeachersEmail().catch(() => null);
      const teachers = teachersRes?.data;
      if (Array.isArray(teachers) && teachers.length > 0) {
        // teachers may be array of strings or objects
        const first = teachers[0];
        if (typeof first === 'string') return first;
        if (first.email) return first.email;
      }
    } catch (err) {
      console.error('resolveClassLeaderEmail error', err);
    }
    return null;
  };

  const notifyClassLeader = async (fileUrl: string) => {
    try {
      const receiver = await resolveClassLeaderEmail();
      if (!receiver) {
        console.warn('No class leader email found; skipping notification.');
        return { ok: false, reason: 'no_receiver' };
      }

      const senderName = (currentUser && (currentUser.fullName || currentUser.name || currentUser.email)) || 'Hallgató';
      const messageText = `${senderName} feltöltött egy hiányzás igazolást: ${fileUrl}`;

      await messageAPI.sendMessage(receiver, messageText);
      return { ok: true };
    } catch (err) {
      console.error('notifyClassLeader error', err);
      return { ok: false, reason: 'send_failed' };
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMessage(null);

    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Válassz egy képet a feltöltéshez.' });
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadImage(selectedFile);
      const uploadedUrl = response?.url ?? response?.data?.url ?? response;
      // notify class leader, but don't block or break success state if notify fails
      const notifyResult = await notifyClassLeader(typeof uploadedUrl === 'string' ? uploadedUrl : '');

      if (notifyResult.ok) {
        setMessage({
          type: 'success',
          text: 'Feltöltés sikeres! Az igazolást elküldtük az osztályfőnöknek.',
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Feltöltés sikeres! Az igazolás feltöltődött, de az értesítés nem sikerült.',
        });
      }
      setSelectedFile(null);
    } catch (err) {
      console.error('Upload failed', err);
      setMessage({ type: 'error', text: 'Feltöltés sikertelen. Próbáld újra.' });
    } finally {
      setIsUploading(false);
    }
  };

  // --- Visual design only below: dark card, header, subtle decorations ---
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="sm" sx={{ pb: 6 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 6,
            mb: 4,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              width: '100%',
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(12,18,31,0.75)'
                  : 'linear-gradient(180deg,#0f1724, #111827)',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 10px 30px rgba(2,6,23,0.6)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 3,
                py: 3,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'transparent',
                backgroundImage:
                  'linear-gradient(90deg, rgba(99,102,241,0.12), rgba(236,72,153,0.06))',
              }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
                TE
              </Avatar>
              <Stack spacing={0}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  TanEdu
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Hiányzás igazolás feltöltése
                </Typography>
              </Stack>
            </Box>

            <Divider sx={{ borderColor: 'divider' }} />

            <Box sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Töltsd fel a hiányzás igazolást (jpg/png). Az osztályfőnök értesítést kap a feltöltésről.
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.6)' : 'transparent'),
                  borderColor: 'rgba(255,255,255,0.04)',
                }}
              >
                <form onSubmit={handleSubmit}>
                  <Button
                    variant="contained"
                    component="label"
                    fullWidth
                    sx={{
                      mb: 2,
                      py: 1.5,
                      textTransform: 'none',
                      background: 'linear-gradient(90deg,#6366f1,#ec4899)',
                      boxShadow: '0 6px 18px rgba(99,102,241,0.18)',
                    }}
                  >
                    {selectedFile ? `Kiválasztva: ${selectedFile.name}` : 'Válassz képet (jpg/png)'}
                    <input hidden accept="image/*" type="file" onChange={handleFileChange} />
                  </Button>

                  {message && (
                    <Alert severity={message.type} sx={{ mb: 2 }}>
                      {message.text}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isUploading || !selectedFile}
                      sx={{
                        flex: 1,
                        py: 1.25,
                        textTransform: 'none',
                        background: (theme) =>
                          `linear-gradient(90deg, ${theme.palette.primary.main}, rgba(236,72,153,0.9))`,
                      }}
                    >
                      {isUploading ? <CircularProgress size={20} color="inherit" /> : 'Feltöltés'}
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSelectedFile(null);
                        setMessage(null);
                      }}
                      sx={{
                        textTransform: 'none',
                        px: 3,
                        borderColor: 'rgba(255,255,255,0.06)',
                      }}
                    >
                      Törlés
                    </Button>
                  </Box>
                </form>
              </Paper>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
