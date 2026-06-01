import { NextResponse } from "next/server";

const PARTNERS = [
  {
    id: 1,
    slug: "mercado-livre",
    name: "Mercado Livre",
    logoUrl: "/partners/mercado-livre.svg",
  },
  {
    id: 2,
    slug: "casas-bahia",
    name: "Casas Bahia",
    logoUrl: "/partners/default-store.svg",
  },
  {
    id: 3,
    slug: "magalu",
    name: "Magazine Luiza",
    logoUrl: "/partners/default-store.svg",
  },
];

export async function GET() {
  return NextResponse.json(PARTNERS);
}
