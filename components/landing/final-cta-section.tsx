import React from "react";
import PrimaryButton from "../ui/button";

export default function FinalCtaSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white">
      <div className="container mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-semibold mb-3">Pronto para organizar suas milhas?</h2>
        <p className="mb-6 max-w-2xl mx-auto">Comece gratuitamente e experimente todas as funcionalidades PRO por 15 dias.</p>
        <div className="flex justify-center gap-4">
          <PrimaryButton href="/sign-in?callbackUrl=/app/dashboard">Começar grátis</PrimaryButton>
        </div>
      </div>
    </section>
  );
}
