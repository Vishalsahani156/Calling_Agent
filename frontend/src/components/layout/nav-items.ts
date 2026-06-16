import {
  BookOpen,
  Bot,
  Contact,
  LayoutDashboard,
  Megaphone,
  Phone,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission: `${string}:${string}` | null;
}

export const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, permission: null },
  { title: 'Agents', href: '/agents', icon: Bot, permission: 'agents:read' },
  { title: 'Campaigns', href: '/campaigns', icon: Megaphone, permission: 'campaigns:read' },
  { title: 'Calls', href: '/calls', icon: Phone, permission: 'calls:read' },
  { title: 'Contacts', href: '/contacts', icon: Contact, permission: 'contacts:read' },
  { title: 'Knowledge', href: '/knowledge', icon: BookOpen, permission: 'knowledge:read' },
  { title: 'Users', href: '/users', icon: Users, permission: 'users:read' },
  { title: 'Settings', href: '/settings', icon: Settings, permission: 'settings:read' },
];
