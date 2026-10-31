import ItemMasterScreen from "@/screens/ItemMasterScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <ItemMasterScreen />
    </ScreenGate>
  );
}
