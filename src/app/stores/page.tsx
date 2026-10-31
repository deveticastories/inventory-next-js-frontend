import StoresScreen from "@/screens/StoresScreen";
import ScreenGate from "@/components/ScreenGate";

export default function Page() {
  return (
    <ScreenGate>
      <StoresScreen />
    </ScreenGate>
  );
}
