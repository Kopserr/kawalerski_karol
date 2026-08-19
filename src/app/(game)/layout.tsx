import { RequireGroom } from "@/components/RequireGroom";
import { ModalSlot } from "@/components/ModalSlot";
import { OfflineBanner } from "@/components/OfflineBanner";

export default function GameLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <RequireGroom>
      <OfflineBanner />
      {children}
      <ModalSlot>{modal}</ModalSlot>
    </RequireGroom>
  );
}
