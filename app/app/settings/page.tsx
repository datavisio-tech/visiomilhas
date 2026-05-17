import PageHeader from "../../../components/ui/page-header";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Configurações"
        subtitle="Preferências da organização"
      />
      <div className="mb-4 text-sm text-gray-600">
        Tela preparatória — persistência e CRUD ainda não implementados.
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded border">Organização</div>
        <div className="bg-white p-4 rounded border">Preferências</div>
        <div className="bg-white p-4 rounded border">Assinatura</div>
        <div className="bg-white p-4 rounded border">Segurança</div>
      </div>
    </div>
  );
}
