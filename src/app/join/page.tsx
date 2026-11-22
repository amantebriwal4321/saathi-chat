import { Suspense } from "react";
import { JoinForm } from "@/components/join-form";

export default function JoinPage() {
  return (
    <Suspense fallback={<p className="px-6 py-10 text-2xl">Opening Saathi...</p>}>
      <JoinForm />
    </Suspense>
  );
}
