import { varAlpha } from 'minimal-shared/utils';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CheckoutDelivery({ name, options, onApplyShipping, sx, ...other }) {
  const { control } = useFormContext();

  return (
    <Card sx={sx} {...other}>
      <CardHeader title="配送方式" />
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange } }) => (
          <Box
            sx={{
              p: 3,
              rowGap: 2.5,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
            }}
          >
            {options.map((option) => (
              <OptionItem
                key={option.label}
                option={option}
                selected={value === option.value}
                onClick={() => {
                  onChange(option.value);
                  onApplyShipping(option.value);
                }}
              />
            ))}
          </Box>
        )}
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

function OptionItem({ option, selected, sx, ...other }) {
  return (
    <Box
      sx={[
        (theme) => ({
          p: 2.5,
          gap: 2,
          display: 'flex',
          cursor: 'pointer',
          borderRadius: 1.5,
          border: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.24)}`,
          transition: theme.transitions.create(['box-shadow'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shortest,
          }),
          ...(selected && { boxShadow: `0 0 0 2px ${theme.vars.palette.text.primary}` }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Iconify
        width={28}
        icon={
          (option.label === '标准配送' && 'carbon:delivery') ||
          (option.label === '快递' && 'carbon:rocket') ||
          'carbon:bicycle'
        }
      />
      <Box sx={{ flex: '1 1 auto' }}>
        <Box
          sx={{
            mb: 0.5,
            display: 'flex',
            typography: 'h6',
            alignItems: 'center',
          }}
        >
          <Box component="span" sx={{ flexGrow: 1, typography: 'subtitle1' }}>
            {option.label === 'Standard' ? '标准配送' : option.label === 'Express' ? '快递' : option.label}
          </Box>

          {`￥${option.value}`}
        </Box>

        <Box
          component="span"
          sx={{ display: 'flex', typography: 'body2', color: 'text.secondary' }}
        >
          {option.description === 'Delivery in 3-5 days' ? '3-5天内送达' :
           option.description === 'Delivery within 24 hours' ? '24小时内送达' :
           option.description}
        </Box>
      </Box>
    </Box>
  );
}
