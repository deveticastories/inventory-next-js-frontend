import CustomersScreen from "@/screens/CustomersScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <CustomersScreen />
    </ScreenGate>
  );
}
