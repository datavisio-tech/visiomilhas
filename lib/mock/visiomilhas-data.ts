export const programs = [
  { id: "livelo", name: "Livelo" },
  { id: "latam", name: "LATAM Pass" },
  { id: "smiles", name: "Smiles" },
  { id: "azul", name: "Azul Fidelidade" },
  { id: "esfera", name: "Esfera" },
];

export const accounts = [
  {
    id: "livelo-principal",
    program: "Livelo",
    nickname: "Livelo Principal",
    balance: 120000,
    cpmCents: 2480,
  },
  {
    id: "latam-joao",
    program: "LATAM Pass",
    nickname: "LATAM João",
    balance: 90000,
    cpmCents: 2500,
  },
  {
    id: "smiles-familia",
    program: "Smiles",
    nickname: "Smiles Família",
    balance: 150000,
    cpmCents: 2300,
  },
  {
    id: "azul-viagens",
    program: "Azul Fidelidade",
    nickname: "Azul Viagens",
    balance: 48500,
    cpmCents: 2600,
  },
];

export const metrics = {
  totalBalance: 428500,
  cpmCents: 2480,
  pointsToReceive: 35000,
  estimatedValueCents: 1062680,
  revenueCents: 845000,
  profitCents: 213000,
  milesSold: 180000,
  avgSoldPerThousandCents: 4694,
};

export const recentEntries = [
  {
    id: "e1",
    date: "2026-05-15",
    program: "Livelo",
    account: "Livelo Principal",
    type: "Compra",
    points: 10000,
    valueCents: 30000,
    status: "Recebida",
  },
  {
    id: "e2",
    date: "2026-05-14",
    program: "Smiles",
    account: "Smiles Família",
    type: "Venda",
    points: 5000,
    valueCents: 25000,
    status: "Concluída",
  },
  {
    id: "e3",
    date: "2026-05-13",
    program: "LATAM Pass",
    account: "LATAM João",
    type: "Transferência",
    points: 10000,
    valueCents: 0,
    status: "Com bônus",
  },
  {
    id: "e4",
    date: "2026-05-12",
    program: "Livelo",
    account: "Livelo Principal",
    type: "Crédito Clube",
    points: 2000,
    valueCents: 0,
    status: "Recebida",
  },
  {
    id: "e5",
    date: "2026-05-11",
    program: "Azul Fidelidade",
    account: "Azul Viagens",
    type: "Ajuste",
    points: -500,
    valueCents: 0,
    status: "Manual",
  },
];

export const purchases = [
  { id: "p1", status: "Pendente", points: 5000, valueCents: 15000 },
  { id: "p2", status: "Recebida", points: 10000, valueCents: 30000 },
];

export const sales = [
  { id: "s1", status: "Concluída", points: 5000, valueCents: 25000 },
];

export const transfers = [
  {
    id: "t1",
    from: "Livelo Principal",
    to: "LATAM João",
    pointsSent: 10000,
    bonusPercent: 30,
    pointsReceived: 13000,
    feeCents: 0,
  },
  {
    id: "t2",
    from: "Esfera",
    to: "Smiles Família",
    pointsSent: 5000,
    bonusPercent: 80,
    pointsReceived: 9000,
    feeCents: 0,
  },
];

export const clubs = [
  {
    id: "c1",
    name: "Clube Livelo",
    monthlyPoints: 1000,
    monthlyFeeCents: 1990,
  },
  {
    id: "c2",
    name: "Clube Smiles",
    monthlyPoints: 1500,
    monthlyFeeCents: 2990,
  },
  { id: "c3", name: "Clube Azul", monthlyPoints: 800, monthlyFeeCents: 1490 },
];
