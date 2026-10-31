import VendorsScreen from "@/screens/VendorsScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <VendorsScreen />
    </ScreenGate>
  );
}
