import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CheckoutBillingInfo({ checkoutState, onChangeStep, loading, sx, ...other }) {
  const { billing } = checkoutState;

  const renderLoading = () => (
    <Box sx={{ height: 104, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LinearProgress color="inherit" sx={{ width: 1, maxWidth: 120 }} />
    </Box>
  );

  return (
    <Card sx={[{ mb: 3 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      <CardHeader
        title="地址"
        action={
          <Button
            size="small"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={() => onChangeStep('back')}
          >
            编辑
          </Button>
        }
      />

      <Stack spacing={1} sx={{ p: 3 }}>
        {loading ? (
          renderLoading()
        ) : (
          <>
            <Box sx={{ typography: 'subtitle2' }}>
              {`${billing?.name} `}
              <Box component="span" sx={{ color: 'text.secondary', typography: 'body2' }}>
                ({billing?.addressType === 'Home' ? '家庭' : billing?.addressType === 'Office' ? '办公室' : billing?.addressType})
              </Box>
            </Box>

            <Box sx={{ color: 'text.secondary', typography: 'body2' }}>{billing?.fullAddress}</Box>
            <Box sx={{ color: 'text.secondary', typography: 'body2' }}>{billing?.phoneNumber}</Box>
          </>
        )}
      </Stack>
    </Card>
  );
}
