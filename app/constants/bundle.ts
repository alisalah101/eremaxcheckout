export type Bundle = {
  id: number;
  label: string;
  originalPrice: number;
  price: number;
  quantity: number;
  savings: string;
  popular: boolean;
  img: string;
};

export type  upsellBundle = {
    id: number;
    label: string;
    price: number;
    quantity: number;
    savings: string;
    popular: boolean;
}

export const bundles: Bundle[] = [
  {
    id: 1,
    label: "Buy 3 Get 2 Free",
    originalPrice: 599.8,
    price: 39.99,
    quantity: 5,  
    savings: "HIGH SAVING",
    popular: false,
    img: "/images/bundle-eremax-5.png",
  },
  {
    id: 2,
    label: "Buy 2 Get 1 Free",
    originalPrice: 359.88,
    price: 53.99,
    quantity: 3,
    savings: "MOST POPULAR",
    popular: true,
    img: "/images/bundle-eremax-3.png",
  },
  {
    id: 3,
    label: "Buy 1 Get 1 Free",
    originalPrice: 239.92,
    price: 59.99,
    quantity: 2,
    savings: "",
    popular: false,
    img: "/images/bundle-eremax-2.png",
  },
];




export const upsellBundle = {
  id: 4,
  label: "Premium Package Upgrade",
  price: 4333, // $43.33 in cents (display; matches upsellE333)
  quantity: 3,
  savings: "50% OFF!",
  popular: false,
};

/** Second upsell — [upsellp9](https://secure.getfmtoday.com/upsellp9) style, $33.99 display */
export const upsellBundle2 = {
  id: 5,
  label: "Ferti Bloom upsell",
  price: 3399, // $33.99 in cents
  quantity: 3,
  savings: "",
  popular: false,
};
