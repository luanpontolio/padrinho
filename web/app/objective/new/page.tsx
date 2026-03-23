"use client";

import { AppHeader } from "@/app/components/AppHeader";
import { CreateObjectiveForm } from "@/app/components/CreateObjectiveForm";

export default function NewObjectivePage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <CreateObjectiveForm />
      </main>
    </div>
  );
}
