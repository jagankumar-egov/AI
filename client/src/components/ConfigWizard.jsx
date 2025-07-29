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
  Typography,
  Box,
  Chip
} from '@mui/material';

/**
 * A Material-UI dialog that drives a section-by-section service config wizard
 * via server endpoints /wizard/start, /wizard/next, /wizard/explain, /wizard/suggest.
 */
export default function ConfigWizard({ open, onClose, onComplete }) {
  const [sections, setSections] = useState([]);
  const [index, setIndex] = useState(0);
  const [sectionId, setSectionId] = useState('');
  const [fieldId, setFieldId] = useState(null);
  const [question, setQuestion] = useState('');
  const [example, setExample] = useState(null);
  const [promptType, setPromptType] = useState('string');
  const [answersMap, setAnswersMap] = useState({});
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Load section order on open
  useEffect(() => {
    if (!open) return;
    axios.get('http://localhost:5002/wizard/sections')
      .then(res => {
        const list = res.data.sections || [];
        setSections(list);
        setIndex(0);
        setAnswersMap({});
      })
      .catch(() => setSections([]));
  }, [open]);

  const handleNext = () => {
    const updated = { ...(answersMap[sectionId] || {}), [fieldId]: input };
    axios.post('http://localhost:5002/wizard/next', { sectionId, answers: updated })
      .then(res => {
        if (res.data.done) {
          onComplete(sectionId, res.data.sectionConfig);
          setAnswersMap(prev => ({ ...prev, [sectionId]: updated }));
          if (index + 1 < sections.length) {
            setIndex(idx => idx + 1);
          } else {
            onClose();
          }
        } else {
          setAnswersMap(prev => ({ ...prev, [sectionId]: updated }));
          setFieldId(res.data.id);
          setQuestion(res.data.question);
          setExample(res.data.example);
          setPromptType(res.data.type || 'string');
          setInput('');
        }
      })
      .catch(() => {});
  };

  const handleExplain = () => {
    axios.post('http://localhost:5002/wizard/explain', { sectionId })
      .then(res => alert(res.data.explanation || ''))
      .catch(() => {});
  };

  // Fetch suggestions automatically when question/field changes
  useEffect(() => {
    if (!sectionId || !fieldId) return;
    axios.post('http://localhost:5002/wizard/suggest', { sectionId, fieldId })
      .then(res => setSuggestions(res.data.suggestions || []))
      .catch(() => setSuggestions([]));
  }, [sectionId, fieldId]);

  // Load prompt when section or index changes
  useEffect(() => {
    if (!open || !sections.length) return;
    const sid = sections[index];
    setSectionId(sid);
    setInput('');
    setSuggestions([]);
    axios.post('http://localhost:5002/wizard/next', { sectionId: sid, answers: {} })
      .then(res => {
        if (!res.data.done) {
          setFieldId(res.data.id);
          setQuestion(res.data.question);
          setExample(res.data.example);
          setPromptType(res.data.type || 'string');
        }
      })
      .catch(() => {});
  }, [open, sections, index]);


            const isString = typeof input === "string";
  const isNumber = typeof input === "number";
  const disabled=(isString && !input.trim()) || (!isString && !isNumber);
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
          variant="outlined"
          type={promptType === 'number' ? 'number' : 'text'}
          multiline={promptType === 'array'}
          minRows={promptType === 'array' ? 2 : 1}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        {/* Suggestions as clickable chips */}
        {suggestions.length > 0 && (
          <Box sx={{ mt: 1, mb: 1 }}>
            {suggestions.map(s => (
              <Chip
                key={s}
                label={s}
                onClick={() => setInput(s)}
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleExplain}>Help</Button>
        <Button onClick={onClose}>Cancel</Button>

        <Button onClick={handleNext} variant="contained" disabled={disabled}>
          Next
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ConfigWizard.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
};
