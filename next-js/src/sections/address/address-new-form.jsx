import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const NewAddressSchema = zod.object({
  city: zod.string().min(1, { message: '请输入城市！' }),
  state: zod.string().min(1, { message: '请输入州/省！' }),
  name: zod.string().min(1, { message: '请输入姓名！' }),
  address: zod.string().min(1, { message: '请输入地址！' }),
  zipCode: zod.string().min(1, { message: '请输入邮政编码！' }),
  phoneNumber: schemaHelper.phoneNumber({ isValid: isValidPhoneNumber }),
  country: schemaHelper.nullableInput(zod.string().min(1, { message: '请选择国家！' }), {
    // message for null value
    message: '请选择国家！',
  }),
  // Not required
  primary: zod.boolean(),
  addressType: zod.string(),
});

// ----------------------------------------------------------------------

export function AddressNewForm({ open, onClose, onCreate }) {
  const defaultValues = {
    name: '',
    city: '',
    state: '',
    address: '',
    zipCode: '',
    country: '',
    primary: true,
    phoneNumber: '',
    addressType: 'Home',
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(NewAddressSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      onCreate({
        name: data.name,
        phoneNumber: data.phoneNumber,
        fullAddress: `${data.address}, ${data.city}, ${data.state}, ${data.country}, ${data.zipCode}`,
        addressType: data.addressType,
        primary: data.primary,
      });
      onClose();
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>新增地址</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3}>
            <Field.RadioGroup
              row
              name="addressType"
              options={[
                { label: '家庭', value: 'Home' },
                { label: '办公室', value: 'Office' },
              ]}
            />

            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text name="name" label="姓名" />

              <Field.Phone name="phoneNumber" label="电话号码" country="CN" />
            </Box>

            <Field.Text name="address" label="地址" />

            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
              }}
            >
              <Field.Text name="city" label="城市" />

              <Field.Text name="state" label="州/省" />

              <Field.Text name="zipCode" label="邮政编码" />
            </Box>

            <Field.CountrySelect name="country" label="国家" placeholder="请选择国家" />

            <Field.Checkbox name="primary" label="设为默认地址" />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={onClose}>
            取消
          </Button>

          <Button type="submit" variant="contained" loading={isSubmitting}>
            配送至此地址
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
