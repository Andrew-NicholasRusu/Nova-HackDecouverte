import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';

export default function FriendsScreen() {
  return (
    <Screen title="Friends" subtitle="See when your friends are free">
      <EmptyState
        title="No friends yet"
        message="Friend requests and shared availability arrive with the Friends module (Milestone 5)."
      />
    </Screen>
  );
}
