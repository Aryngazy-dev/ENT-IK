import { redirect } from "next/navigation";
import { currentIdentity } from "@/server/auth/session";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const identity = await currentIdentity(); if (!identity || identity.role !== "ADMIN") redirect("/login");
  return children;
}
