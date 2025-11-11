// typescript
import { useState, useEffect, type FormEvent, useContext } from "react";
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
  Link,
  Tab,
  Tabs,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userAPI, messageAPI, departmentAPI } from "./API/ApiCalls";
import type { Conversation, Message } from "./types/Messages";
import { RoleContext } from "./App";


const renderMessageWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, idx) => {
    if (urlRegex.test(part)) {
      return (
        <Link
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "inherit",
            textDecoration: "underline",
            fontWeight: 600,
            wordBreak: "break-all",
            "&:hover": { opacity: 0.8 },
          }}
        >
          {part}
        </Link>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

export default function Messages() {
  const [showNewMsgModal, setShowNewMsgModal] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const token = localStorage.getItem("token");
  const [selectedTab,setSelectedTab] = useState(0)
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserDeptId, setCurrentUserDeptId] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [deptMessageText, setDeptMessageText] = useState("");
  const roleContext = useContext(RoleContext)

  const userRole = roleContext?.role;
  
  const [formData, setFormData] = useState({
    cimzett: null as string | null,
    uzenet: "",
  });

  const { data: fetchedUserId } = useQuery({
    queryKey: ["currentUser", token],
    queryFn: async () => {
      const response = await userAPI.getCurrentUser();
      return response?.data ?? null;
    },
    enabled: !!token,
  });
  
  const userDeptId = fetchedUserId?.departmentId;
  
  const { data: teachersEmailList = [] } = useQuery({
    queryKey: ["teachersEmail", token],
    queryFn: async () => {
      const response = await userAPI.getAllTeachersEmail();
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!token,
  })

  const { data: departments = [], isLoading: deptsLoading } = useQuery({
    queryKey: ["departments", userRole, userDeptId],
    enabled: !!userRole,
    queryFn: async () => {
      if (userRole === "SYSADMIN") {
        const res = await departmentAPI.getAll();
        return res.data;
      } else if (userDeptId) {
        const res = await departmentAPI.getById(userDeptId);
        return [res.data]; 
      }
      return [];
    },
  }); 
  useEffect(() => {
    if (!selectedDeptId && departments.length > 0) {
      setSelectedDeptId(departments[0].id);
    }
  }, [departments, selectedDeptId]);

  const deptIdToUse = userRole === "SYSADMIN" ? selectedDeptId : (selectedDeptId || currentUserDeptId);
  const { data: deptMessages = [], isLoading: deptMsgsLoading, refetch: refetchDeptMsgs } = useQuery({
    queryKey: ["departmentMessages", selectedDeptId],
    enabled: deptIdToUse !== null ,
    queryFn: () => messageAPI.getDepartmentMessages(deptIdToUse as number ).then((res) => res.data),
  });

  useEffect(() => {
    if (fetchedUserId && fetchedUserId.id) {
      setCurrentUserId(fetchedUserId.id)
      if (fetchedUserId.deptId){
        setCurrentUserDeptId(fetchedUserId.deptId)
      }
    };
  }, [fetchedUserId]);

  
  const { data: fetchedMessages, isLoading, refetch } = useQuery({
    queryKey: ["messages", token],
    queryFn: async () => {
      const response = await messageAPI.getMessagesByCurrentUser();
       return Array.isArray(response.data) 
        ? response.data.filter((msg: any) => !msg.deptId) 
        : [];
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (fetchedMessages && currentUserId) {
      const conversationMap = new Map<number, Message[]>();
      fetchedMessages.forEach((msg) => {
        const otherUserId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
        if (!conversationMap.has(otherUserId)) conversationMap.set(otherUserId, []);
        conversationMap.get(otherUserId)!.push(msg);
      });

      const convos: Conversation[] = Array.from(conversationMap.entries()).map(([userId, msgs]) => {
        const firstMsg = msgs[0];
        const isCurrentUserSender = firstMsg.senderId === currentUserId;
        return {
          otherUserId: userId,
          otherUserName: isCurrentUserSender ? firstMsg.receiverFullName : firstMsg.senderFullName,
          otherUserEmail: isCurrentUserSender ? firstMsg.receiverEmail : firstMsg.senderEmail,
          messages: msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
          unreadCount: 0,
        };
      });

      setConversations(
        convos.sort(
          (a, b) =>
            new Date(b.messages[b.messages.length - 1].createdAt).getTime() -
            new Date(a.messages[a.messages.length - 1].createdAt).getTime()
        )
      );
    }
  }, [fetchedMessages, currentUserId]);

  console.log(fetchedMessages);
  
  const handleSend = async (e: FormEvent) => {
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
  const handleDeptSend = async () => {
    if (!deptIdToUse || !deptMessageText) return;
    try {
      await messageAPI.postToDepartment(deptIdToUse, {
        senderId: currentUserId ?? undefined,
        value: deptMessageText,
      });
      setDeptMessageText("");
      await refetchDeptMsgs();
      queryClient.invalidateQueries({ queryKey: ["departmentMessages", deptIdToUse] });
    } catch (err) {
      console.error("Department message send failed", err);
    }
  };

  const handleReply = async () => {
    if (!replyText || !selectedConversation) return;
    try {
      await messageAPI.sendMessage(selectedConversation.otherUserEmail, replyText);
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

      {/* FÜLEK */}
      <Paper
        sx={{
          borderRadius: "16px",
          overflow: "hidden",
          backdropFilter: "blur(20px)",
          backgroundColor: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
          centered
        >
          <Tab label="💬 Személyes üzenetek" />
          <Tab label="🏫 Intézményi üzenetek" />
        </Tabs>

        {/* --- SZEMÉLYES ÜZENETEK TARTALOM --- */}
        {selectedTab === 0 && (
          <Box sx={{ p: 2 }}>
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
                {/* Beszélgetéslista */}
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
                            selectedConversation?.otherUserId ===
                            conv.otherUserId
                              ? "rgba(100,149,237,0.2)"
                              : "transparent",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
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
                            {conv.otherUserName
                              ?.charAt(0)
                              .toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.95rem",
                              }}
                            >
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
                              {conv.messages[
                                conv.messages.length - 1
                              ]?.message?.substring(0, 30)}
                              ...
                            </Typography>
                          </Box>
                          {conv.unreadCount > 0 && (
                            <Chip
                              label={conv.unreadCount}
                              color="error"
                              size="small"
                            />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>

                {/* Üzenetnézet */}
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
                        <Typography
                          sx={{ fontWeight: 700, color: "#fff" }}
                        >
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
                                  color: isCurrentUserSender
                                    ? "#fff"
                                    : "text.primary",
                                  borderRadius: "12px",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: "0.9rem",
                                    wordWrap: "break-word",
                                  }}
                                >
                                  {renderMessageWithLinks(msg.message)}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: "0.75rem",
                                    opacity: 0.7,
                                    mt: 0.5,
                                  }}
                                >
                                  {new Date(msg.createdAt).toLocaleString(
                                    "hu-HU"
                                  )}
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
          </Box>
        )}

        {/* --- INTÉZMÉNYI ÜZENETEK TARTALOM --- */}
        {selectedTab === 1 && (
          <Box sx={{ p: 2 }}>
            {deptsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  height: "600px",
                }}
              >
                <Paper
                  sx={{
                    borderRadius: "16px",
                    flex: 1,
                    overflow: "hidden",
                    backdropFilter: "blur(20px)",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box sx={{ p: 2, bgcolor: "primary.main" }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                      🏫 Intézményi Üzenetek
                    </Typography>
                  </Box>

                  <Box sx={{ maxHeight: "180px", overflowY: "auto" }}>
                    {departments.map((d:any) => (
                      <Box
                        key={d.id}
                        onClick={() => setSelectedDeptId(d.id)}
                        sx={{
                          p: 2,
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                          cursor: "pointer",
                          bgcolor:
                            selectedDeptId === d.id
                              ? "rgba(100,149,237,0.2)"
                              : "transparent",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                          transition: "background-color 0.2s",
                        }}
                      >
                        <Typography sx={{ fontWeight: 600 }}>
                          {d.name}
                        </Typography>
                        {d.description && (
                          <Typography
                            sx={{
                              fontSize: "0.8rem",
                              color: "text.secondary",
                            }}
                          >
                            {d.description}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>

                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.2,
                    }}
                  >
                    {deptMsgsLoading ? (
                      <Box
                        sx={{ display: "flex", justifyContent: "center", py: 4 }}
                      >
                        <CircularProgress />
                      </Box>
                    ) : deptMessages.length === 0 ? (
                      <Typography color="text.secondary">
                        Nincs üzenet ebben az intézményben
                      </Typography>
                    ) : (
                      deptMessages.map((m:any, idx:number) => {
                        const isCurrent =
                          m.sender?.id === currentUserId ||
                          m.senderId === currentUserId;
                        return (
                          <Box
                            key={idx}
                            sx={{
                              display: "flex",
                              justifyContent: isCurrent
                                ? "flex-end"
                                : "flex-start",
                            }}
                          >
                            <Paper
                              sx={{
                                p: 1.5,
                                maxWidth: "70%",
                                bgcolor: isCurrent
                                  ? "primary.main"
                                  : "rgba(255,255,255,0.15)",
                                color: isCurrent ? "#fff" : "text.primary",
                                borderRadius: "12px",
                              }}
                            >
                              <Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.5 }}>
                              
                                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.8 }}>
                                  {m.senderFullName}
                                </Typography>
                              </Box>
                              <Typography sx={{ fontSize: "0.9rem", wordWrap: "break-word", ml:1 }}>
                                {m.value ?? m.message}
                              </Typography>
                            </Box>
                              <Typography
                                sx={{ fontSize: "0.75rem", opacity: 0.7, mt: 0.5 }}
                              >
                                {new Date(
                                  m.createdAt ?? m.created_at
                                ).toLocaleString("hu-HU")}
                              </Typography>
                            </Paper>
                          </Box>
                        );
                      })
                    )}
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
                      placeholder="Írj egy üzenetet a csoportnak..."
                      fullWidth
                      size="small"
                      multiline
                      maxRows={2}
                      value={deptMessageText}
                      onChange={(e) => setDeptMessageText(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleDeptSend}
                      disabled={!deptMessageText || !deptIdToUse}
                    >
                      Küldés
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* ÚJ ÜZENET MODAL */}
      <Dialog open={showNewMsgModal} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Új üzenet küldése</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Autocomplete
              options={teachersEmailList}
              getOptionLabel={(option) => `${option.subject} - ${option.email}`}
              value={formData.cimzett}
              onChange={(_, newValue) =>
                setFormData({ ...formData, cimzett: newValue?.email || null })
              }
              renderInput={(params) => (
                <TextField {...params} label="Címzett" required />
              )}
            />
            <TextField
              label="Üzenet"
              name="uzenet"
              value={formData.uzenet}
              onChange={(e) => setFormData({ ...formData, uzenet: e.target.value })}
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

