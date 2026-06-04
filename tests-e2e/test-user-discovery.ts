import { readFile } from "node:fs/promises";
import path from "node:path";

export type TestUserRole =
  | "QA_OWNER"
  | "QA_ACTIVE"
  | "QA_TRIAL"
  | "QA_EXPIRED"
  | "QA_NEW";

export type TestUser = {
  role: TestUserRole;
  email: string;
  password: string;
  name: string;
};

const ROLE_ORDER: TestUserRole[] = [
  "QA_OWNER",
  "QA_ACTIVE",
  "QA_TRIAL",
  "QA_EXPIRED",
  "QA_NEW",
];

const FALLBACK_USERS: Record<TestUserRole, TestUser> = {
  QA_OWNER: {
    role: "QA_OWNER",
    email: "emailteste01@teste.com",
    password: "emailteste01",
    name: "QA Owner",
  },
  QA_ACTIVE: {
    role: "QA_ACTIVE",
    email: "emailteste02@teste.com",
    password: "emailteste02",
    name: "QA Active",
  },
  QA_TRIAL: {
    role: "QA_TRIAL",
    email: "emailteste03@teste.com",
    password: "emailteste03",
    name: "QA Trial",
  },
  QA_EXPIRED: {
    role: "QA_EXPIRED",
    email: "emailteste04@teste.com",
    password: "emailteste04",
    name: "QA Expired",
  },
  QA_NEW: {
    role: "QA_NEW",
    email: "emailteste05@teste.com",
    password: "emailteste05",
    name: "QA New",
  },
};

function parseRoleRow(line: string): TestUser | null {
  const normalized = line.trim();
  if (!normalized.startsWith("|")) return null;
  if (normalized.includes("---")) return null;
  const cells = normalized
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  if (cells.length < 4) return null;

  const [roleCell, emailCell, passwordCell, nameCell] = cells;
  if (!roleCell?.startsWith("`QA_")) return null;

  const role = roleCell.replace(/`/g, "") as TestUserRole;
  if (!ROLE_ORDER.includes(role)) return null;

  return {
    role,
    email: emailCell.replace(/`/g, ""),
    password: passwordCell.replace(/`/g, ""),
    name: nameCell.replace(/`/g, ""),
  };
}

async function readTextIfExists(relativePath: string): Promise<string | null> {
  try {
    return await readFile(relativePath, "utf8");
  } catch {
    return null;
  }
}

function parseMarkdownUsers(content: string): Partial<Record<TestUserRole, TestUser>> {
  const discovered: Partial<Record<TestUserRole, TestUser>> = {};
  for (const line of content.split(/\r?\n/)) {
    const row = parseRoleRow(line);
    if (row) discovered[row.role] = row;
  }
  return discovered;
}

export async function discoverTestUsers(): Promise<Record<TestUserRole, TestUser>> {
  const candidates = [
    path.join(process.cwd(), "docs", "ai-context", "TEST_USERS.md"),
    path.join(process.cwd(), "docs", "testing", "AUTH_TEST_USERS.md"),
  ];

  for (const file of candidates) {
    const content = await readTextIfExists(file);
    if (!content) continue;

    const parsed = parseMarkdownUsers(content);
    const complete = ROLE_ORDER.every((role) => parsed[role]);
    if (complete) {
      return parsed as Record<TestUserRole, TestUser>;
    }
  }

  return FALLBACK_USERS;
}
