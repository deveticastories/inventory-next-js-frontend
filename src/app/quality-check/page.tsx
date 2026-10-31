import QualityCheckScreen from "@/screens/QualityCheckScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <QualityCheckScreen />
    </ScreenGate>
  );
}
