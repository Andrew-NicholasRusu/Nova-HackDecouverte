import { Redirect } from 'expo-router';

import AppTabs from '@/components/layout/app-tabs';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { useAuth } from '@/features/auth/auth-provider';
import { OnboardingScreen } from '@/features/profile/components/onboarding-screen';
import { useProfileState } from '@/features/profile/use-profile';

/** Signed-in area. New students pick a username and campus before entering the tabs. */
export default function AppLayout() {
  const { session, event } = useAuth();
  const { status, profile } = useProfileState();

  if (!session) return <Redirect href={event === 'SIGNED_OUT' ? '/logged-out' : '/login'} />;

  if ((status === 'loading' || status === 'idle') && !profile) return <LoadingScreen />;
  // If the profile can't be loaded (e.g. migration not run yet) don't lock the student out.
  if (profile && !profile.username) return <OnboardingScreen profile={profile} />;
  return <AppTabs />;
}
