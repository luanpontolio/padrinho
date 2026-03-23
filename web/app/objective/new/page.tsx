"use client";

import { CreateObjectiveForm } from "@/app/components/CreateObjectiveForm";

export default function NewObjectivePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start px-4 py-12">
      <div className="w-full max-w-md">
        <a
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white"
        >
          ← Dashboard
        </a>
        <CreateObjectiveForm />
      </div>
    </main>
  );
}
