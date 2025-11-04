import { useState, useEffect, type FormEvent } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Container,
  Avatar,
  Chip,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userAPI, messageAPI } from "./API/ApiCalls";
import type { Conversation, Message } from "./types/Messages";

export default function Messages() {
  const [showNewMsgModal, setShowNewMsgModal] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const token = localStorage.getItem("token");
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    cimzett: null as string | null,
    uzenet: "",
  });

  const { data: fetchedUserId } = useQuery({
    queryKey: ["currentUser", token],
    queryFn: async () => {
      const response = await userAPI.getCurrentUser();
      return response?.data?.id ?? null;
    },
    enabled: !!token,
  });

  const { data: teachersEmailList = [] } = useQuery({
    queryKey: ["teachersEmail", token],
    queryFn: async () => {
      const response = await userAPI.getAllTeachersEmail();
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (fetchedUserId) setCurrentUserId(fetchedUserId);
  }, [fetchedUserId]);

  const { data: fetchedMessages, isLoading, refetch } = useQuery({
    queryKey: ["messages", token],
    queryFn: async () => {
      const response = await messageAPI.getMessagesByCurrentUser();
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (fetchedMessages && currentUserId) {
      const conversationMap = new Map<number, Message[]>();
      fetchedMessages.forEach((msg) => {
        const otherUserId =
          msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
        if (!conversationMap.has(otherUserId))
          conversationMap.set(otherUserId, []);
        conversationMap.get(otherUserId)!.push(msg);
      });

      const convos: Conversation[] = Array.from(conversationMap.entries()).map(
        ([userId, msgs]) => {
          const firstMsg = msgs[0];
          const isCurrentUserSender = firstMsg.senderId === currentUserId;
          return {
            otherUserId: userId,
            otherUserName: isCurrentUserSender
              ? firstMsg.receiverFullName
              : firstMsg.senderFullName,
            otherUserEmail: isCurrentUserSender
              ? firstMsg.receiverEmail
              : firstMsg.senderEmail,
            messages: msgs.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            ),
            unreadCount: 0,
          };
        }
      );

      setConversations(
        convos.sort(
          (a, b) =>
            new Date(b.messages[b.messages.length - 1].createdAt).getTime() -
            new Date(a.messages[a.messages.length - 1].createdAt).getTime()
        )
      );
    }
  }, [fetchedMessages, currentUserId]);

  const handleSend = async (e:FormEvent) => {
    e.preventDefault();
    if (!formData.cimzett || !formData.uzenet) return;
    try {
      await messageAPI.sendMessage(formData.cimzett, formData.uzenet);
      setShowNewMsgModal(false);
      setFormData({ cimzett: null, uzenet: "" });
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  const handleReply = async () => {
    if (!replyText || !selectedConversation) return;
    try {
      await messageAPI.sendMessage(
        selectedConversation.otherUserEmail,
        replyText
      );
      setReplyText("");
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    } catch (err) {
      console.error("Reply failed:", err);
    }
  };

  const handleCloseDialog = () => {
    setShowNewMsgModal(false);
    setFormData({ cimzett: null, uzenet: "" });
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ pb: 6 }}>
        
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 700, color: "primary.main", mb: 3, mt: 2 }}
          >
            📧 Üzenetek
          </Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowNewMsgModal(true)}
            size="large"
            sx={{ mb: 3 }}
          >
            ✉️ Új üzenet küldése
          </Button>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : conversations.length === 0 ? (
            <Paper
              sx={{
                p: 4,
                borderRadius: "16px",
                textAlign: "center",
                backdropFilter: "blur(20px)",
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <Typography color="text.secondary">
                Nincsenek üzenetek
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "300px 1fr" },
                gap: 2,
              }}
            >
              <Paper
                sx={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  backdropFilter: "blur(20px)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <Box sx={{ p: 2, bgcolor: "primary.main" }}>
                  <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                    Beszélgetések
                  </Typography>
                </Box>
                <Box sx={{ maxHeight: "400px", overflowY: "auto" }}>
                  {conversations.map((conv) => (
                    <Box
                      key={conv.otherUserId}
                      onClick={() => setSelectedConversation(conv)}
                      sx={{
                        p: 2,
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        cursor: "pointer",
                        bgcolor:
                          selectedConversation?.otherUserId === conv.otherUserId
                            ? "rgba(100,149,237,0.2)"
                            : "transparent",
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.1)",
                        },
                        transition: "background-color 0.2s",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: "primary.main",
                          }}
                        >
                          {conv.otherUserName?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
                            {conv.otherUserName}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "0.8rem",
                              color: "text.secondary",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {conv.messages[conv.messages.length - 1]?.message?.substring(0, 30)}
                            ...
                          </Typography>
                        </Box>
                        {conv.unreadCount > 0 && (
                          <Chip label={conv.unreadCount} color="error" size="small" />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>

              <Paper
                sx={{
                  borderRadius: "16px",
                  display: "flex",
                  flexDirection: "column",
                  height: "600px",
                  backdropFilter: "blur(20px)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {selectedConversation ? (
                  <>
                    <Box
                      sx={{
                        p: 2,
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        bgcolor: "primary.main",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, color: "#fff" }}>
                        💬 {selectedConversation.otherUserName}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        flex: 1,
                        overflowY: "auto",
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      {selectedConversation.messages.map((msg, idx) => {
                        const isCurrentUserSender =
                          msg.senderId === currentUserId;
                        return (
                          <Box
                            key={idx}
                            sx={{
                              display: "flex",
                              justifyContent: isCurrentUserSender
                                ? "flex-end"
                                : "flex-start",
                            }}
                          >
                            <Paper
                              sx={{
                                p: 1.5,
                                maxWidth: "70%",
                                bgcolor: isCurrentUserSender
                                  ? "primary.main"
                                  : "rgba(255,255,255,0.15)",
                                color: isCurrentUserSender ? "#fff" : "text.primary",
                                borderRadius: "12px",
                              }}
                            >
                              <Typography sx={{ fontSize: "0.9rem" }}>
                                {msg.message}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.75rem",
                                  opacity: 0.7,
                                  mt: 0.5,
                                }}
                              >
                                {new Date(msg.createdAt).toLocaleString("hu-HU")}
                              </Typography>
                            </Paper>
                          </Box>
                        );
                      })}
                    </Box>

                    <Box
                      sx={{
                        p: 2,
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        gap: 1,
                      }}
                    >
                      <TextField
                        placeholder="Írj egy üzenetet..."
                        fullWidth
                        size="small"
                        multiline
                        maxRows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleReply}
                        disabled={!replyText}
                      >
                        Küldés
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <Typography color="text.secondary">
                      Válassz egy beszélgetést
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          )}

        <Dialog
          open={showNewMsgModal}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Új üzenet küldése
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Autocomplete
                options={teachersEmailList}
                value={formData.cimzett}
                onChange={(_, newValue) =>
                  setFormData({ ...formData, cimzett: newValue })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Címzett" required />
                )}
              />
              <TextField
                label="Üzenet"
                name="uzenet"
                value={formData.uzenet}
                onChange={(e) =>
                  setFormData({ ...formData, uzenet: e.target.value })
                }
                fullWidth
                multiline
                rows={4}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Mégse</Button>
            <Button
              onClick={handleSend}
              variant="contained"
              color="primary"
              disabled={!formData.cimzett || !formData.uzenet}
            >
              Küldés
            </Button>
          </DialogActions>
        </Dialog>

        <Box sx={{ textAlign: "center", mt: 6, color: "text.secondary" }}>
          <Typography variant="body2">
            © 2025 TanEdu | Hallgatói rendszer
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
