import { Navigation } from "@/components/landing/navigation";

export default function SummarizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* <Navigation /> */}
      {children}
    </>
  );
}
