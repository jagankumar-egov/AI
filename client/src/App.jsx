import { useState, useRef } from "react";
import axios from "axios";
import ReactJson from "react-json-view";
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';

export default function App() {
  const [input, setInput] = useState("");
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const generateConfig = async () => {
    try {
      const res = await axios.post("http://localhost:5001/generate-config", { prompt: input });
      setConfig(res.data.config);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    }
  };

  // Download handler
  const handleDownload = () => {
    if (!config) return;
    const moduleName = config.module || 'config';
    const serviceName = config.service || 'service';
    const fileName = `${moduleName}_${serviceName}.json`;
    const jsonStr = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    setChatMessages((msgs) => [...msgs, { from: "user", text: chatInput }]);
    setChatLoading(true);
    try {
      const res = await axios.post("http://localhost:5001/chat-assist", { message: chatInput });
      setChatMessages((msgs) => [...msgs, { from: "ai", text: res.data.reply }]);
    } catch (err) {
      setChatMessages((msgs) => [...msgs, { from: "ai", text: "Sorry, I couldn't process your request." }]);
    }
    setChatInput("");
    setChatLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <>
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Service Config Generator
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Enter a natural language description of your service to generate a config.
          </Typography>
          <TextField
            label="Describe your service..."
            multiline
            minRows={4}
            maxRows={10}
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={generateConfig}
            sx={{ mb: 2 }}
            fullWidth
          >
            Generate Config
          </Button>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}
          {config && (
            <Box mt={4}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Generated Config
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, background: '#f9f9f9' }}>
                <ReactJson src={config} name={false} collapsed={false} displayDataTypes={false} />
              </Paper>
              <Button
                variant="outlined"
                color="secondary"
                sx={{ mt: 2 }}
                onClick={handleDownload}
                fullWidth
              >
                Download Config
              </Button>
            </Box>
          )}
        </Paper>
      </Container>

      {/* Floating Chat Button */}
      <IconButton
        color="primary"
        sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1200, bgcolor: 'white', boxShadow: 3 }}
        onClick={() => setChatOpen(true)}
        size="large"
      >
        <ChatIcon fontSize="large" />
      </IconButton>

      {/* Chatbot Drawer/Modal */}
      {chatOpen && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 350,
            height: 500,
            bgcolor: 'background.paper',
            boxShadow: 6,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1300
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Config Assistant</Typography>
            <IconButton onClick={() => setChatOpen(false)} size="small"><CloseIcon /></IconButton>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f7f7fa' }}>
            {chatMessages.length === 0 && (
              <Typography variant="body2" color="text.secondary">Ask me about config fields, best practices, or get hints!</Typography>
            )}
            {chatMessages.map((msg, idx) => (
              <Box key={idx} sx={{ mb: 1, textAlign: msg.from === 'user' ? 'right' : 'left' }}>
                <Box
                  sx={{
                    display: 'inline-block',
                    px: 2, py: 1,
                    bgcolor: msg.from === 'user' ? 'primary.main' : 'grey.200',
                    color: msg.from === 'user' ? 'white' : 'black',
                    borderRadius: 2,
                    maxWidth: '80%'
                  }}
                >
                  {msg.text}
                </Box>
              </Box>
            ))}
            <div ref={chatEndRef} />
          </Box>
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
            <TextField
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder="Type your question..."
              size="small"
              fullWidth
              multiline
              minRows={1}
              maxRows={3}
              disabled={chatLoading}
            />
            <Button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} variant="contained">Send</Button>
          </Box>
        </Box>
      )}
    </>
  );
}
