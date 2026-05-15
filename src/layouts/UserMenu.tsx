import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LogOutIcon, ReceiptIcon, SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/features/auth/store';
import type { UserRead } from '@/features/auth/types';

interface UserMenuProps {
  user: UserRead;
}

function initials(user: UserRead): string {
  const source = user.name?.trim() || user.email;
  const first = source.charAt(0);
  return first ? first.toUpperCase() : '?';
}

export function UserMenu({ user }: UserMenuProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = () => {
    useAuthStore.getState().clearToken();
    queryClient.clear();
    toast.success(t('sign_out_toast'));
    navigate('/auth/sign-in', { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="group flex size-9 items-center justify-center rounded-full ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=open]:ring-2 data-[state=open]:ring-ring data-[state=open]:ring-offset-2"
        aria-label={user.name ?? user.email}
      >
        <Avatar className="size-9">
          {user.avatar_url ? (
            <AvatarImage src={user.avatar_url} alt={user.name ?? user.email} />
          ) : null}
          <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
            {initials(user)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          {user.name ? (
            <span className="text-sm font-semibold text-foreground">
              {user.name}
            </span>
          ) : null}
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/settings')}>
          <SettingsIcon className="size-4" />
          {t('user_menu_settings')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/orders')}>
          <ReceiptIcon className="size-4" />
          {t('user_menu_bills')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOutIcon className="size-4" />
          {t('user_menu_sign_out')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
