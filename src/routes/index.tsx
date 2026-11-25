import { createFileRoute } from "@tanstack/react-router";
import { FolioStudio } from "@/components/folio-studio";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <FolioStudio />;
}
