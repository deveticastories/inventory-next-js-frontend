import CreditNoteScreen from "@/screens/CreditNoteScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <CreditNoteScreen />
    </ScreenGate>
  );
}
