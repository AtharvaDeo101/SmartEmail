import { Navigation } from "@/components/landing/navigation";



export default function GenerateLayout({
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
