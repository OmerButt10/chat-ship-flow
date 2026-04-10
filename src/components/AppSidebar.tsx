import {
  LayoutDashboard, MessageSquare, Package, Boxes, FileText,
  CreditCard, Settings, Upload, Users, LogOut, ChevronDown,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserRole } from '@/types';

const navItems: Record<UserRole, { title: string; url: string; icon: React.ElementType }[]> = {
  admin: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Orders', url: '/orders', icon: Package },
    { title: 'Inventory', url: '/inventory', icon: Boxes },
    { title: 'Invoices', url: '/invoices', icon: FileText },
    { title: 'Payments', url: '/payments', icon: CreditCard },
    { title: 'Users', url: '/users', icon: Users },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
  warehouse_staff: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Orders', url: '/orders', icon: Package },
    { title: 'Inventory', url: '/inventory', icon: Boxes },
  ],
  client: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'New Order', url: '/chat', icon: MessageSquare },
    { title: 'My Orders', url: '/orders', icon: Package },
    { title: 'Upload Labels', url: '/upload', icon: Upload },
    { title: 'Inventory', url: '/inventory', icon: Boxes },
    { title: 'Invoices', url: '/invoices', icon: FileText },
    { title: 'Payments', url: '/payments', icon: CreditCard },
  ],
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  warehouse_staff: 'Staff',
  client: 'Client',
};

export function AppSidebar() {
  const { user, switchRole, logout } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  if (!user) return null;
  const items = navItems[user.role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <Package className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">WarehouseOS</p>
              <p className="text-xs text-sidebar-muted">Management System</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <Package className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider">
            {!collapsed && 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md p-2 hover:bg-sidebar-accent transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
                {user.full_name.charAt(0)}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-sidebar-foreground">{user.full_name}</p>
                <p className="text-xs text-sidebar-muted">{roleLabels[user.role]}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-muted" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem onClick={() => switchRole('admin')}>Switch to Admin</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole('warehouse_staff')}>Switch to Staff</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole('client')}>Switch to Client</DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              {user.full_name.charAt(0)}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
