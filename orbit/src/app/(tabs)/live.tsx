import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';

export default function LiveScreen() {
  return (
    <Screen title="Campus Live" subtitle="What's happening around campus">
      <EmptyState
        title="No reports yet"
        message="Student-submitted queue and study-space reports arrive with Campus Live (Milestone 6)."
      />
    </Screen>
  );
}
