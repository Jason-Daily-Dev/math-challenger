import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

const Header = () => {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Math Challenger
        </Typography>
        {isAuthenticated ? (
          <Box display="flex" alignItems="center">
            <Typography variant="body1" sx={{ marginRight: 2 }}>
              {user?.name}
            </Typography>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => logout({ returnTo: 'http://localhost:5173' })}
            >
              Log Out
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => loginWithRedirect()}
          >
            Log In
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;