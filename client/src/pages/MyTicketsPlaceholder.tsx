import { useRequester } from "../context/RequesterContext.js";

export default function MyTicketsPlaceholder() {
  const { requester } = useRequester();
  return (
    <div>
      <h1 className="h4">My Tickets</h1>
      <p className="text-muted">
        Signed in as <strong>{requester?.name}</strong>. The full ticket list arrives in Issue #16
        for now this page only proves the Requester context and route guard work end to end.
      </p>
    </div>
  );
}