import { Package, DollarSign, Clock, CheckCircle, TrendingUp, Boxes } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { mockOrders, mockInvoices } from '@/data/mockData';

const recentActivity = [
  { id: '1', action: 'Order WH-1001 marked as completed', time: '2 hours ago', type: 'success' as const },
  { id: '2', action: 'Invoice INV-002 generated for WH-1002', time: '5 hours ago', type: 'default' as const },
  { id: '3', action: 'New order WH-1003 created', time: '8 hours ago', type: 'default' as const },
  { id: '4', action: 'Payment received for INV-001', time: '1 day ago', type: 'success' as const },
];

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const totalOrders = mockOrders.length;
  const pendingOrders = mockOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const completedOrders = mockOrders.filter(o => o.status === 'completed').length;
  const totalRevenue = mockInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Overview of warehouse operations' : 'Your orders and activity at a glance'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={<Package className="h-5 w-5" />}
          trend={{ value: '+12% this month', positive: true }}
        />
        <StatCard
          title="Pending"
          value={pendingOrders}
          icon={<Clock className="h-5 w-5" />}
          subtitle="Awaiting processing"
        />
        <StatCard
          title="Completed"
          value={completedOrders}
          icon={<CheckCircle className="h-5 w-5" />}
          trend={{ value: '+8% this month', positive: true }}
        />
        {isAdmin ? (
          <StatCard
            title="Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
            trend={{ value: '+15% this month', positive: true }}
          />
        ) : (
          <StatCard
            title="Inventory Items"
            value="4"
            icon={<Boxes className="h-5 w-5" />}
            subtitle="Across all SKUs"
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">{order.order_id}</p>
                    <p className="text-xs text-muted-foreground">{order.client_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={order.status === 'completed' ? 'completed' : order.status === 'pending' ? 'pending' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map(item => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className={`mt-0.5 h-2 w-2 rounded-full ${item.type === 'success' ? 'bg-success' : 'bg-primary'}`} />
                  <div>
                    <p className="text-sm">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
