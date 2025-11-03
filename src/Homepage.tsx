import { Box, Typography, Grid, Card, CardContent, CardActionArea, Container } from '@mui/material';
import { useNavigate } from 'react-router';
import AppBarNav from './components/AppBarNav';

export default function Homepage() {
  const navigate = useNavigate();

  const menuItems = [
    { icon: '📅', label: 'Órarend', path: '/orarend' },
    { icon: '📊', label: 'Jegyek, értékelések', path: '/jegyek' },
    { icon: '📩', label: 'Üzenetek', path: '/uzenetek' },
    { icon: '👤', label: 'Adatok', path: '/adatok' },
    { icon: "✅", label: "Jelenlét", path: "/jelenlét" }
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBarNav />
      
      <Container maxWidth="lg" sx={{ pb: 6 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              mb: 2,
            }}
          >
            Üdvözlünk!
          </Typography>
          <Typography variant="h6" color="text.secondary">
            © 2025 TanEdu | Hallgatói rendszer
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {menuItems.map((item) => (
            <Grid key={item.path} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(item.path)}
                  sx={{ flexGrow: 1, p: 0 }}
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      py: 4,
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        mb: 2,
                        fontSize: '3.5rem',
                      }}
                    >
                      {item.icon}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: 'primary.main',
                        textAlign: 'center',
                      }}
                    >
                      {item.label}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 6, color: 'text.secondary' }}>
          <Typography variant="body2">
            © 2025 TanEdu | Hallgatói rendszer
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
