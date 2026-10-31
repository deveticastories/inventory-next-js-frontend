import ExpensesScreen from "@/screens/ExpensesScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <ExpensesScreen />
    </ScreenGate>
  );
}
