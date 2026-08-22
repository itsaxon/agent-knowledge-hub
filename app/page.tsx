import { getEntries } from "@/lib/entries";
import { HubApp } from "@/components/HubApp";

// Static generation — default behavior, no force-dynamic needed.
export default async function Page() {
  const entries = await getEntries();
  return <HubApp entries={entries} />;
}
