
import { useState } from "react";
import axios from "axios";
import ReactJson from "react-json-view";
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

export default function App() {
  const [input, setInput] = useState("");
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

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

  return (
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
  );
}
