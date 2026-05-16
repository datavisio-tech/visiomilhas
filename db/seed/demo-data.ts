export const DEMO_ADMIN = {
  user: { name: "Usuário Demo", email: "demo@visiomilhas.local" },
  organization: { name: "Workspace Demo", slug: "workspace-demo" },
  plans: [
    { code: "trial_full_15_days", name: "Trial 15 dias" },
    { code: "free_limited", name: "Free (limitado)" },
    { code: "pro_monthly", name: "Pro Mensal" },
  ],
};

export const DEMO_APP = {
  programs: [
    { slug: "livelo", name: "Livelo", type: "airline" },
    { slug: "latam", name: "LATAM Pass", type: "airline" },
    { slug: "smiles", name: "Smiles", type: "airline" },
    { slug: "azul", name: "Azul Fidelidade", type: "airline" },
    { slug: "esfera", name: "Esfera", type: "credit_card" },
  ],
  accounts: [
    {
      nickname: "Livelo Principal",
      holderName: "Demo Holder",
      slug: "livelo-principal",
    },
    { nickname: "LATAM João", holderName: "João Demo", slug: "latam-joao" },
    {
      nickname: "Smiles Família",
      holderName: "Família Demo",
      slug: "smiles-familia",
    },
    { nickname: "Azul Viagens", holderName: "Azul Demo", slug: "azul-viagens" },
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
