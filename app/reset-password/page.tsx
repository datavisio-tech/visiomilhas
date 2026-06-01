import ResetPasswordForm from "../../src/modules/auth/components/reset-password-form";

type ResetPasswordPageProps = {
  searchParams?: {
    token?: string;
  };
};

export default function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const token = searchParams?.token?.trim();

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.38),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.22),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#020617_42%,_#07111f_100%)]" />
      <div className="absolute left-[-80px] top-[-90px] h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute right-[-80px] top-24 h-64 w-64 rounded-full bg-cyan-400/12 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <ResetPasswordForm token={token} />
      </div>
    </main>
  );
}
