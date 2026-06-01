/* eslint-disable no-unused-vars */

"use client";

import type { CampaignPickerOption } from "../domain/types";

type Props = {
  programs: Array<{
    slug: string;
    name: string;
  }>;
  campaigns: CampaignPickerOption[];
  selectedProgramSlug?: string;
  selectedCampaignId?: string;
  onProgramChange?: (...args: [string]) => void;
  onCampaignChange?: (...args: [string]) => void;
};

export function CampaignCatalogPicker({
  programs,
  campaigns,
  selectedProgramSlug,
  selectedCampaignId,
  onProgramChange,
  onCampaignChange,
}: Props) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Programa
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-400"
          value={selectedProgramSlug ?? ""}
          onChange={(event) => onProgramChange?.(event.target.value)}
        >
          <option value="">Selecionar programa</option>
          {programs.map((program) => (
            <option key={program.slug} value={program.slug}>
              {program.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Campanha
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-400"
          value={selectedCampaignId ?? ""}
          onChange={(event) => onCampaignChange?.(event.target.value)}
        >
          <option value="">Selecionar campanha</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.partnerName ? `${campaign.partnerName} · ` : ""}
              {campaign.label}
            </option>
          ))}
        </select>
      </label>

      <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
        A seleção por programa e campanha ficará ligada ao preenchimento
        automático de loja parceira, multiplicador, prazo de crédito e link da
        campanha na próxima etapa.
      </div>
    </div>
  );
}

export default CampaignCatalogPicker;
