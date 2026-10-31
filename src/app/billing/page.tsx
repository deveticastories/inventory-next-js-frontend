import BillingScreen from "@/screens/BillingScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <BillingScreen />
    </ScreenGate>
  );
}
