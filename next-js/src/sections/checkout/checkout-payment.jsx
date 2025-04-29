import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';

import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

import { useCheckoutContext } from './context';
import { CheckoutSummary } from './checkout-summary';
import { CheckoutDelivery } from './checkout-delivery';
import { CheckoutBillingInfo } from './checkout-billing-info';
import { CheckoutPaymentMethods } from './checkout-payment-methods';

// ----------------------------------------------------------------------

const DELIVERY_OPTIONS = [
  { value: 0, label: '免费', description: '5-7天送达' },
  { value: 10, label: '标准配送', description: '3-5天送达' },
  { value: 20, label: '快递', description: '2-3天送达' },
];

const PAYMENT_OPTIONS = [
  {
    value: 'paypal',
    label: '使用Paypal支付',
    description: '您将被重定向到Paypal网站以安全完成购买。',
  },
  {
    value: 'creditcard',
    label: '信用卡/借记卡',
    description: '我们支持Mastercard、Visa、Discover和Stripe。',
  },
  {
    value: 'cash',
    label: '现金',
    description: '订单送达时使用现金支付。',
  },
];

const CARD_OPTIONS = [
  { value: 'visa1', label: '**** **** **** 1212 - 张伟' },
  { value: 'visa2', label: '**** **** **** 2424 - 李明' },
  { value: 'mastercard', label: '**** **** **** 4545 - 王强' },
];

export const PaymentSchema = zod.object({
  payment: zod.string().min(1, { message: '请选择支付方式！' }),
  // Not required
  delivery: zod.number(),
});

// ----------------------------------------------------------------------

export function CheckoutPayment() {
  const {
    loading,
    onResetCart,
    onChangeStep,
    onApplyShipping,
    state: checkoutState,
  } = useCheckoutContext();

  const defaultValues = {
    delivery: checkoutState.shipping,
    payment: '',
  };

  const methods = useForm({
    resolver: zodResolver(PaymentSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      onResetCart();
      onChangeStep('next');
      console.info('数据', data);
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <CheckoutDelivery
            name="delivery"
            onApplyShipping={onApplyShipping}
            options={DELIVERY_OPTIONS}
          />

          <CheckoutPaymentMethods
            name="payment"
            options={{ cards: CARD_OPTIONS, payments: PAYMENT_OPTIONS }}
            sx={{ my: 3 }}
          />

          <Button
            size="small"
            color="inherit"
            onClick={() => onChangeStep('back')}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            返回
          </Button>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <CheckoutBillingInfo
            loading={loading}
            onChangeStep={onChangeStep}
            checkoutState={checkoutState}
          />

          <CheckoutSummary checkoutState={checkoutState} onEdit={() => onChangeStep('go', 0)} />

          <Button fullWidth size="large" type="submit" variant="contained" loading={isSubmitting}>
            完成订单
          </Button>
        </Grid>
      </Grid>
    </Form>
  );
}
