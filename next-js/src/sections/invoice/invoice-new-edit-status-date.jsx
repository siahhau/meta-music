import { useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function InvoiceNewEditStatusDate() {
  const { watch } = useFormContext();

  const values = watch();

  return (
    <Box
      sx={{
        p: 3,
        gap: 2,
        display: 'flex',
        bgcolor: 'background.neutral',
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      <Field.Text
        disabled
        name="invoiceNumber"
        label="发票编号"
        value={values.invoiceNumber}
      />

      <Field.Select
        fullWidth
        name="status"
        label="状态"
        slotProps={{ inputLabel: { shrink: true } }}
      >
        {[
          { value: 'paid', label: '已支付' },
          { value: 'pending', label: '待处理' },
          { value: 'overdue', label: '逾期' },
          { value: 'draft', label: '草稿' },
        ].map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{ textTransform: 'capitalize' }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Field.Select>

      <Field.DatePicker name="createDate" label="创建日期" />
      <Field.DatePicker name="dueDate" label="到期日期" />
    </Box>
  );
}
