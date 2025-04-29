'use client';

import { useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { useSearchParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export function Auth0SignInView() {
  const { loginWithPopup, loginWithRedirect } = useAuth0();

  const searchParams = useSearchParams();

  const returnTo = searchParams.get('returnTo');

  const handleSignInWithPopup = useCallback(async () => {
    try {
      await loginWithPopup();
    } catch (error) {
      console.error(error);
    }
  }, [loginWithPopup]);

  const handleSignUpWithPopup = useCallback(async () => {
    try {
      await loginWithPopup({ authorizationParams: { screen_hint: 'signup' } });
    } catch (error) {
      console.error(error);
    }
  }, [loginWithPopup]);

  const handleSignInWithRedirect = useCallback(async () => {
    try {
      await loginWithRedirect({ appState: { returnTo: returnTo || CONFIG.auth.redirectPath } });
    } catch (error) {
      console.error(error);
    }
  }, [loginWithRedirect, returnTo]);

  const handleSignUpWithRedirect = useCallback(async () => {
    try {
      await loginWithRedirect({
        appState: { returnTo: returnTo || CONFIG.auth.redirectPath },
        authorizationParams: { screen_hint: 'signup' },
      });
    } catch (error) {
      console.error(error);
    }
  }, [loginWithRedirect, returnTo]);

  return (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" sx={{ textAlign: 'center' }}>
        登录您的账户
      </Typography>

      <Button
        fullWidth
        color="primary"
        size="large"
        variant="contained"
        onClick={handleSignInWithRedirect}
      >
        使用重定向登录
      </Button>

      <Button
        fullWidth
        color="primary"
        size="large"
        variant="soft"
        onClick={handleSignUpWithRedirect}
      >
        使用重定向注册
      </Button>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Button
        fullWidth
        color="inherit"
        size="large"
        variant="contained"
        onClick={handleSignInWithPopup}
      >
        使用弹窗登录
      </Button>
      <Button fullWidth color="inherit" size="large" variant="soft" onClick={handleSignUpWithPopup}>
        使用弹窗注册
      </Button>
    </Box>
  );
}
