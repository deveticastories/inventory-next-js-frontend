import PackingListScreen from "@/screens/PackingListScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <PackingListScreen />
    </ScreenGate>
  );
}
