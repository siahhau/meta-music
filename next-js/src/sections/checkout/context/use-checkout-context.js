'use client';

import { use } from 'react';

import { CheckoutContext } from './checkout-context';

// ----------------------------------------------------------------------

export function useCheckoutContext() {
  const context = use(CheckoutContext);

  if (!context) throw new Error('useCheckoutContext 必须在 CheckoutProvider 中使用');

  return context;
}
