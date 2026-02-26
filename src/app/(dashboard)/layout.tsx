import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardNav user={session.user} />
      <main className="flex-1 overflow-y-auto bg-muted/10">
        <div className="container py-8 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
