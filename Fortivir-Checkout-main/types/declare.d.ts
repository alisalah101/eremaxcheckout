// types/react-forex-price.d.ts

declare module 'react-forex-price' {
  import * as React from 'react';

  interface PriceProps {
    amount: number;
    baseCurrency: string;
    displayCurrency: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  }

  const Price: React.FC<PriceProps>;

  export default Price;
}
