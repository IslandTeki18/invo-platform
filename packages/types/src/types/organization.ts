export interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  businessAddress: BusinessAddress | null;
  logoUrl: string | null;
  storageUsed: number;
  createdAt: number;
}
