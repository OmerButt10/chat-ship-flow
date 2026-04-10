import { Package, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockOrders } from '@/data/mockData';

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage and track warehouse orders</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" /> All Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>SKUs</TableHead>
                <TableHead>Box Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_id}</TableCell>
                  <TableCell>{order.client_name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      order.status === 'completed' ? 'completed' :
                      order.status === 'pending' ? 'pending' : 'secondary'
                    }>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.received_date || '—'}</TableCell>
                  <TableCell>{order.skus.length} SKU(s)</TableCell>
                  <TableCell>
                    {order.box_dimensions
                      ? `${order.box_dimensions}, ${order.box_weight} lbs`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Order {order.order_id}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Client</p>
                              <p className="font-medium">{order.client_name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <Badge variant={order.status === 'completed' ? 'completed' : 'pending'}>{order.status}</Badge>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Received Date</p>
                              <p className="font-medium">{order.received_date || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Box Details</p>
                              <p className="font-medium">{order.box_dimensions || 'N/A'}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">SKUs</p>
                            <div className="space-y-2">
                              {order.skus.map(sku => (
                                <div key={sku.id} className="rounded-lg border p-3 text-sm">
                                  <p className="font-medium">{sku.product_name} (×{sku.quantity})</p>
                                  <div className="flex gap-2 mt-1">
                                    {sku.fnsku_labeling && <Badge variant="secondary">FNSKU</Badge>}
                                    {sku.box_handling && <Badge variant="secondary">Box Handling</Badge>}
                                    {sku.polybagging && <Badge variant="secondary">Polybagging</Badge>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
