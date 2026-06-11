import { createFileRoute } from '@tanstack/react-router';
import { WelcomeComponent } from '@/components/auth/Welcome';

export const Route = createFileRoute('/welcome')({
  component: WelcomeComponent,
});