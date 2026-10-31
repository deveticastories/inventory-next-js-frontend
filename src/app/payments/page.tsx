import PaymentEntryScreen from "@/screens/PaymentEntryScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <PaymentEntryScreen />
    </ScreenGate>
  );
}
