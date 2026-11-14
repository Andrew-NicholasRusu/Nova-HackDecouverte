import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';

export default function ScheduleScreen() {
  return (
    <Screen title="Schedule" subtitle="Your classes, in one place">
      <EmptyState
        title="No classes yet"
        message="Adding and importing classes arrives with the Schedule module (Milestone 3)."
      />
    </Screen>
  );
}
