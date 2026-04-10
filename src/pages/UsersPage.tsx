import { Users, Shield, UserCheck, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const users = [
  { id: '1', name: 'Admin User', email: 'admin@warehouse.com', role: 'admin' as const, status: 'active' },
  { id: '2', name: 'Staff Member', email: 'staff@warehouse.com', role: 'warehouse_staff' as const, status: 'active' },
  { id: '3', name: 'Acme Corp', email: 'client@warehouse.com', role: 'client' as const, status: 'active' },
];

const roleIcon = {
  admin: Shield,
  warehouse_staff: UserCheck,
  client: User,
};

const roleLabel = {
  admin: 'Admin',
  warehouse_staff: 'Staff',
  client: 'Client',
};

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage user accounts and roles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => {
                const Icon = roleIcon[u.role];
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{roleLabel[u.role]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="completed">Active</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
