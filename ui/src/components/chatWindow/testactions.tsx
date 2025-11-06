import { HomeIcon, Package, Component, Activity, ScrollText, Mail, SunMoon } from 'lucide-react'

export const testActions = [
  {
    id: 'home',
    title: 'Home',
    icon: <HomeIcon className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
    href: '#',
  },
  {
    id: 'products',
    title: 'Products',
    icon: <Package className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
    href: '#',
  },
  {
    id: 'components',
    title: 'Components',
    icon: <Component className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
    href: '#',
  },
  {
    id: 'activity',
    title: 'Activity',
    icon: <Activity className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
    href: '#',
  },
  {
    id: 'change-log',
    title: 'Change Log',
    icon: <ScrollText className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
    href: '#',
  },
  {
    id: 'email',
    title: 'Email',
    icon: <Mail className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
    href: '#',
  },
  {
    id: 'theme',
    title: 'Theme',
    icon: <SunMoon className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
    href: '#',
  },
]
