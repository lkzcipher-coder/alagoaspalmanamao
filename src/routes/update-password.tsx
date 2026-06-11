import { createFileRoute } from '@tanstack/react-router';
import { UpdatePasswordComponent } from '@/components/auth/UpdatePassword';

export const Route = createFileRoute('/update-password')({
  component: UpdatePasswordComponent,
  onError: ({ error }) => {
    console.error('Update password route error:', error);
  },
});