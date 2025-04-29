import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function FaqsForm({ sx, ...other }) {
  return (
    <Box sx={sx} {...other}>
      <Typography variant="h4">还没有找到合适的帮助？</Typography>
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
