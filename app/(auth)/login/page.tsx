import { LoginPage } from '@/components/lms/login-page';

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginRoute({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  return <LoginPage callbackError={error} />;
}
