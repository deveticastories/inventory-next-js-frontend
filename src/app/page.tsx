import DashboardScreen from "@/screens/DashboardScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <DashboardScreen />
    </ScreenGate>
  );
}
