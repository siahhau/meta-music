'use client';

import { varAlpha } from 'minimal-shared/utils';
import { useCountdownDate } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import { outlinedInputClasses } from '@mui/material/OutlinedInput';

import { _socials } from 'src/_mock';
import { ComingSoonIllustration } from 'src/assets/illustrations';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ComingSoonView() {
  const countdown = useCountdownDate(new Date('2026-08-20 20:30'));

  return (
    <Container>
      <Typography variant="h3" sx={{ mb: 2 }}>
        即将上线！
      </Typography>

      <Typography sx={{ color: 'text.secondary' }}>
        我们正在努力完善这个页面！
      </Typography>

      <ComingSoonIllustration sx={{ my: { xs: 5, sm: 10 } }} />

      <Stack
        divider={<Box sx={{ mx: { xs: 1, sm: 2.5 } }}>:</Box>}
        sx={{ typography: 'h2', justifyContent: 'center', flexDirection: 'row' }}
      >
        <TimeBlock label="天" value={countdown.days} />
        <TimeBlock label="小时" value={countdown.hours} />
        <TimeBlock label="分钟" value={countdown.minutes} />
        <TimeBlock label="秒" value={countdown.seconds} />
      </Stack>

      <TextField
        fullWidth
        placeholder="请输入您的邮箱"
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Button variant="contained" size="large">
                  通知我
                </Button>
              </InputAdornment>
            ),
            sx: [
              (theme) => ({
                pr: 0.5,
                [`&.${outlinedInputClasses.focused}`]: {
                  boxShadow: theme.vars.customShadows.z20,
                  transition: theme.transitions.create(['box-shadow'], {
                    duration: theme.transitions.duration.shorter,
                  }),
                  [`& .${outlinedInputClasses.notchedOutline}`]: {
                    border: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.32)}`,
                  },
                },
              }),
            ],
          },
        }}
        sx={{ my: 5 }}
      />
      <Box sx={{ gap: 1, display: 'flex', justifyContent: 'center' }}>
        {_socials.map((social) => (
          <IconButton key={social.label}>
            {social.value === 'twitter' && <Iconify icon="socials:twitter" />}
            {social.value === 'facebook' && <Iconify icon="socials:facebook" />}
            {social.value === 'instagram' && <Iconify icon="socials:instagram" />}
            {social.value === 'linkedin' && <Iconify icon="socials:linkedin" />}
          </IconButton>
        ))}
      </Box>
    </Container>
  );
}

function TimeBlock({ label, value }) {
  return (
    <div>
      <div> {value} </div>
      <Box sx={{ color: 'text.secondary', typography: 'body1' }}>{label}</Box>
    </div>
  );
}
