'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { signUp } from '../../context/jwt';
import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { SignUpTerms } from '../../components/sign-up-terms';

// ----------------------------------------------------------------------

export const SignUpSchema = zod.object({
  firstName: zod.string().min(1, { message: '必须填写名字！' }),
  lastName: zod.string().min(1, { message: '必须填写姓氏！' }),
  username: zod.string().min(1, { message: '必须填写用户名！' }), // 新增 username
  email: zod.string().min(1, { message: '必须填写邮箱！' }).email({ message: '邮箱格式无效！' }),
  password: zod
    .string()
    .min(1, { message: '必须填写密码！' })
    .min(6, { message: '密码至少需要6个字符！' }),
});

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  const router = useRouter();
  const showPassword = useBoolean();
  const { checkUserSession } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState('');

  const defaultValues = {
    firstName: '',
    lastName: '',
    username: '', // 新增 username
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signUp({
        email: data.email,
        password: data.password,
        username: data.username, // 新增 username
        firstName: data.firstName,
        lastName: data.lastName,
      });
      await checkUserSession?.();
      router.refresh();
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{ display: 'flex', gap: { xs: 3, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}
      >
        <Field.Text name="lastName" label="姓" slotProps={{ inputLabel: { shrink: true } }} />
        <Field.Text name="firstName" label="名" slotProps={{ inputLabel: { shrink: true } }} />
      </Box>

      <Field.Text name="email" label="邮箱地址" slotProps={{ inputLabel: { shrink: true } }} />

      {/* 新增 username 字段 */}
      <Field.Text name="username" label="用户名" slotProps={{ inputLabel: { shrink: true } }} />

      <Field.Text
        name="password"
        label="密码"
        placeholder="6个字符以上"
        type={showPassword.value ? 'text' : 'password'}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={showPassword.onToggle} edge="end">
                  <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="正在创建账户..."
      >
        创建账户
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        title="免费开始使用"
        description={
          <>
            {`已有账户？ `}
            <Link component={RouterLink} href={paths.auth.jwt.signIn} variant="subtitle2">
              登录
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      <SignUpTerms />
    </>
  );
}
