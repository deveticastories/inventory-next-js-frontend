import ReceiptEntryScreen from "@/screens/ReceiptEntryScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <ReceiptEntryScreen />
    </ScreenGate>
  );
}
