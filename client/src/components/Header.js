import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Explore as ExploreIcon,
  Chat as ChatIcon,
  GitHub as GitHubIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: '/create', label: 'Create New', icon: <AddIcon /> },
    { path: '/', label: 'Config Generator', icon: <SettingsIcon /> },
    { path: '/explorer', label: 'Schema Explorer', icon: <ExploreIcon /> },
    { path: '/chat', label: 'AI Assistant', icon: <ChatIcon /> },
  ];

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          🧠 Service Config AI
          <Chip
            label="v1.0.0"
            size="small"
            color="secondary"
            sx={{ ml: 1 }}
          />
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={RouterLink}
              to={item.path}
              startIcon={item.icon}
              color="inherit"
              sx={{
                textTransform: 'none',
                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <IconButton
          component="a"
          href="https://github.com/jagankumar-egov/AI"
          target="_blank"
          rel="noopener noreferrer"
          color="inherit"
          sx={{ ml: 1 }}
        >
          <GitHubIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 