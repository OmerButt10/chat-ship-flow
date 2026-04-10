import { Boxes, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const statusVariant = (s: string) =>
  s === 'in_stock' ? 'completed' as const :
  s === 'low_stock' ? 'warning' as const : 'destructive' as const;

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [sku, setSku] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState(0);

  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: inventory = [] } = useQuery<any[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await api.get('/inventory/');
      return res.data;
    },
  });

  const filtered = (inventory || []).filter((item: any) =>
    (item.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
  await api.post('/inventory/create/', { sku, location, quantity_on_hand: quantity, extra_fields: {} });
    setSku(''); setLocation(''); setQuantity(0);
  qc.invalidateQueries({ queryKey: ['inventory'] });
  }

  async function handleApprove(id: string) {
  await api.post(`/inventory/${id}/approve/`, {});
  qc.invalidateQueries({ queryKey: ['inventory'] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Track SKU quantities and stock levels</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search SKUs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Boxes className="h-4 w-4" /> Inventory Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.sku}</TableCell>
                  <TableCell>{item.quantity_on_hand}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'APPROVED' ? 'completed' : item.status === 'PENDING' ? 'warning' : 'destructive'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.location || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.last_updated ? new Date(item.last_updated).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    {user?.role !== 'client' && item.status === 'PENDING' && (
                      <button className="btn-approve" onClick={() => handleApprove(item.id)}>Approve</button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
