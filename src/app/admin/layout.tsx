import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: "Admin — Brother's Photography",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
