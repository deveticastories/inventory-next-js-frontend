import StaffScreen from "@/screens/StaffScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <StaffScreen />
    </ScreenGate>
  );
}
