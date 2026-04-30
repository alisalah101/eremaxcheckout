import { z } from "zod";

export const formSchema = z.object({
  package: z.object({
    selectedBundleId: z.number().min(1, "Bundle required"),
    price: z.number().min(1),
    expeditedShipping: z.boolean(),
    quantity: z.number().min(1),
  }),
  user: z.object({
    name: z.string().nonempty("Name required"),
    surname: z.string().nonempty("Surname required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(8, "Phone too short"),
  }),
  shipment: z.object({
    country: z.string().nonempty("Country required"),
    address: z.string().nonempty("Address required"),
    city: z.string().nonempty("City required"),
    state: z.string().nonempty("State required"),
    postcode: z.string().min(4, "Invalid postcode"),
  }),
});
