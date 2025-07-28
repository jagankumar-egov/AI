import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography
} from '@mui/material';

/**
 * A Material-UI dialog that drives a section-by-section service config wizard
 * via server endpoints /wizard/start, /wizard/next, /wizard/explain.
 */
export default function ConfigWizard({ open, onClose, onComplete }) {
  const [sectionId, setSectionId] = useState(null);
  const [fieldId, setFieldId] = useState(null);
  const [question, setQuestion] = useState('');
  const [example, setExample] = useState(null);
  const [answers, setAnswers] = useState({});
  const [input, setInput] = useState('');

  // Initialize wizard: get first question for this section
  useEffect(() => {
    if (!open) return;
    axios.post('http://localhost:5001/wizard/start')
      .then(res => {
        setSectionId(res.data.sectionId);
        setFieldId(res.data.id);
        setQuestion(res.data.question);
        setExample(res.data.example);
        setAnswers({});
        setInput('');
      })
      .catch(() => {});
  }, [open]);

  const handleNext = () => {
    const updated = { ...answers, [fieldId]: input };
    axios.post('http://localhost:5001/wizard/next', { sectionId, answers: updated })
      .then(res => {
        if (res.data.done) {
          onComplete(sectionId, res.data.sectionConfig);
          onClose();
        } else {
          setAnswers(updated);
          setFieldId(res.data.id);
          setQuestion(res.data.question);
          setExample(res.data.example);
          setInput('');
        }
      })
      .catch(() => {});
  };

  const handleExplain = () => {
    axios.post('http://localhost:5001/wizard/explain', { sectionId })
      .then(res => alert(res.data.explanation || ''))
      .catch(() => {});
  };

  // Render dialog

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Configure Section: {sectionId}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>{question}</Typography>
        {example && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Example: {typeof example === 'object' ? JSON.stringify(example) : example}
          </Typography>
        )}
        <TextField
          fullWidth
          multiline
          minRows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleExplain}>Help</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleNext} variant="contained" disabled={!input.trim()}>Next</Button>
      </DialogActions>
    </Dialog>
  );
}

ConfigWizard.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
};
