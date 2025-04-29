import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function ContactForm({ sx, ...other }) {
  return (
    <Box sx={sx} {...other}>
      <Typography variant="h3">
        欢迎随时联系我们！ <br />
        我们很高兴听到您的消息，朋友。
      </Typography>
      <Box
        sx={{
          my: 5,
          gap: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TextField fullWidth label="姓名" />
        <TextField fullWidth label="邮箱" />
        <TextField fullWidth label="主题" />
        <TextField fullWidth label="在此输入您的消息" multiline rows={4} />
      </Box>

      <Button size="large" variant="contained">
        提交
      </Button>
    </Box>
  );
}
