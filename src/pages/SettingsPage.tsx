import { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [pricing, setPricing] = useState({
    fnsku_fee: '0.50',
    box_handling_fee: '1.00',
    polybagging_fee: '0.75',
    storage_fee: '0.15',
  });
  const [company, setCompany] = useState({
    name: 'WarehouseOS Inc.',
    email: 'billing@warehouseos.com',
    payment_terms: 'Net 14',
  });

  const handleSave = () => {
    toast({ title: 'Settings saved', description: 'Pricing and company settings have been updated.' });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure pricing rules and company details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" /> Pricing Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>FNSKU Fee (per unit)</Label>
              <Input
                type="number" step="0.01" value={pricing.fnsku_fee}
                onChange={(e) => setPricing(p => ({ ...p, fnsku_fee: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Box Handling Fee (per unit)</Label>
              <Input
                type="number" step="0.01" value={pricing.box_handling_fee}
                onChange={(e) => setPricing(p => ({ ...p, box_handling_fee: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Polybagging Fee (per unit)</Label>
              <Input
                type="number" step="0.01" value={pricing.polybagging_fee}
                onChange={(e) => setPricing(p => ({ ...p, polybagging_fee: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Storage Fee (per unit/month)</Label>
              <Input
                type="number" step="0.01" value={pricing.storage_fee}
                onChange={(e) => setPricing(p => ({ ...p, storage_fee: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={company.name} onChange={(e) => setCompany(c => ({ ...c, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Billing Email</Label>
            <Input value={company.email} onChange={(e) => setCompany(c => ({ ...c, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Payment Terms</Label>
            <Input value={company.payment_terms} onChange={(e) => setCompany(c => ({ ...c, payment_terms: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="gap-2">
        <Save className="h-4 w-4" /> Save Settings
      </Button>
    </div>
  );
}
