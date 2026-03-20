import TicketManagementListView from "../../../components/ticket/TicketManagementListView";

export default function AdminTicketPage() {
  return <TicketManagementListView basePath="/admin" roleLabel="Admin" />;
}