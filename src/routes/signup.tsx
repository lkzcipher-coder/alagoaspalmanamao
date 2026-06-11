import { createFileRoute } from '@tanstack/react-router';
import { SignupComponent } from '@/components/auth/Signup';

export const Route = createFileRoute('/signup')({
  component: SignupComponent,
});
