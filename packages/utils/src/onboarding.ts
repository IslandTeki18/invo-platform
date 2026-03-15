interface OnboardingOrg {
  name: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
}

interface OnboardingOrgWithStripe extends OnboardingOrg {
  stripeAccountId: string | null;
  chargesEnabled: boolean;
}

export function isOrgNameSet(org: OnboardingOrg): boolean {
  return org.name.trim().length > 0;
}

export function isBusinessAddressSet(org: OnboardingOrg): boolean {
  if (org.businessAddress === null) {
    return false;
  }
  const { street, city, state, postalCode, country } = org.businessAddress;
  return [street, city, state, postalCode, country].every(
    (field) => field.trim().length > 0,
  );
}

export function isStripeConnected(org: OnboardingOrgWithStripe): boolean {
  return org.stripeAccountId !== null && org.chargesEnabled;
}

export function isReadyToSendInvoice(org: OnboardingOrgWithStripe): boolean {
  return (
    isOrgNameSet(org) && isBusinessAddressSet(org) && isStripeConnected(org)
  );
}
