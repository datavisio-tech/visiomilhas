export const DEMO_ADMIN = {
  user: {
    name: "Usuário Demo",
    email: "demo@visiomilhas.local",
    status: "active",
  },
  organization: {
    name: "Organização Demo VisioMilhas",
    slug: "demo-visiomilhas",
    status: "active",
  },
  plans: [
    {
      code: "free_trial",
      name: "Gratuito Trial",
      trialDays: 15,
      billingModel: "organization",
      priceCents: 0,
      currency: "BRL",
      isActive: true,
    },
    {
      code: "free_limited",
      name: "Free (limitado)",
      priceCents: 0,
      currency: "BRL",
      isActive: true,
    },
    {
      code: "pro_monthly",
      name: "Pro Mensal",
      priceCents: 19900,
      currency: "BRL",
      isActive: true,
    },
  ],
};

export const DEMO_APP = {
  programs: [
    { slug: "livelo", name: "Livelo", type: "airline" },
    { slug: "latam", name: "Latam Pass", type: "airline" },
    { slug: "smiles", name: "Smiles", type: "airline" },
    { slug: "azul", name: "Azul Fidelidade", type: "airline" },
    { slug: "esfera", name: "Esfera", type: "credit_card" },
  ],
  accounts: [
    {
      nickname: "Conta Livelo Demo",
      holderName: "Demo Holder",
      slug: "livelo-principal",
      programSlug: "livelo",
    },
    {
      nickname: "Conta Latam Pass Demo",
      holderName: "Demo Holder",
      slug: "latam-principal",
      programSlug: "latam",
    },
    {
      nickname: "Conta Smiles Demo",
      holderName: "Demo Holder",
      slug: "smiles-principal",
      programSlug: "smiles",
    },
  ],
};

export const DEMO_METRICS = {
  totalPoints: 428500,
  avgCostCents: 2480, // R$24,80
  pendingPoints: 35000,
  revenueCents: 845000,
  profitCents: 213000,
  milesSold: 180000,
  avgSoldPerThousandCents: 4694, // R$46,94
};
