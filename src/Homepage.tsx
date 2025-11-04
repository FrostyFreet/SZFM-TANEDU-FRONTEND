import { Typography, Paper } from "@mui/material";

export default function Homepage() {
  return (
      <Paper
        elevation={0}
        sx={{
          bgcolor: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          borderRadius: 3,
          p: 4,
        }}
      >
        <Typography variant="h4" sx={{ color: "#fff", fontWeight: 500 }}>
          Üdv újra a TanEdu-ban!
        </Typography>
        <Typography sx={{ mt: 2, color: "#aaa" }}>
          Válassz egy menüpontot a bal oldali navigációból.
        </Typography>
      </Paper>
  );
}
