import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Box,
  Typography,
  Paper
} from '@mui/material';

/**
 * ConfigStepper: a page-based stepper wizard replacing popup ConfigWizard.
 * Each step corresponds to a section and displays all its questions at once.
 */
export default function ConfigStepper() {
  const [sections, setSections] = useState([]);
  const [promptsBySection, setPromptsBySection] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);

  // Load sections and all prompts per section on mount
  useEffect(() => {
    async function init() {
      try {
        const res = await axios.get('http://localhost:5002/wizard/sections');
        const secs = res.data.sections || [];
        const allPrompts = {};
        for (const sec of secs) {
          let prompts = [];
          let current = {};
          // fetch all questions for this section
          while (true) {
            const resp = await axios.post('http://localhost:5002/wizard/next', { sectionId: sec, answers: current });
            if (resp.data.done) break;
            const { id, question, example, type } = resp.data;
            prompts.push({ id, question, example, type });
            current[id] = '';
          }
          allPrompts[sec] = prompts;
        }
        setSections(secs);
        setPromptsBySection(allPrompts);
        setAnswers(secs.reduce((acc, s) => ({ ...acc, [s]: {} }), {}));
      } catch {
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleChange = (sec, field) => e => {
    setAnswers(prev => ({
      ...prev,
      [sec]: { ...prev[sec], [field]: e.target.value }
    }));
  };

  const handleNext = async () => {
    const sec = sections[activeStep];
    const resp = await axios.post('http://localhost:5002/wizard/next', {
      sectionId: sec,
      answers: answers[sec]
    });
    if (resp.data.done) {
      setConfigs(prev => ({ ...prev, [sec]: resp.data.sectionConfig }));
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  if (loading) return <Typography>Loading wizard...</Typography>;

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {sections.map(label => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>
      {activeStep < sections.length ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">{sections[activeStep]} Configuration</Typography>
          {promptsBySection[sections[activeStep]]?.map(({ id, question, example, type }) => (
            <Box key={id} sx={{ my: 1 }}>
              <Typography>{question}</Typography>
              {example !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  Example: {JSON.stringify(example)}
                </Typography>
              )}
              <TextField
                fullWidth
                type={type === 'number' ? 'number' : 'text'}
                multiline={type === 'array'}
                minRows={type === 'array' ? 2 : 1}
                value={answers[sections[activeStep]][id] || ''}
                onChange={handleChange(sections[activeStep], id)}
              />
            </Box>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
            <Button variant="contained" onClick={handleNext}>Next</Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Completed</Typography>
          <pre>{JSON.stringify(configs, null, 2)}</pre>
        </Box>
      )}
    </Paper>
  );
}
