import PurchaseDataScreen from "@/screens/PurchaseDataScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <PurchaseDataScreen />
    </ScreenGate>
  );
}
