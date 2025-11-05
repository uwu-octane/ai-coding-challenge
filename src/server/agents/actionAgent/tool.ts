import {
  createTicketTool,
  readTicketTool,
  updateTicketTool,
  dummyTool,
} from "@/server/agents/tool/ticketTool";

export const tools: Record<string, any> = {
  ticket_create: createTicketTool,
  ticket_read: readTicketTool,
  ticket_update: updateTicketTool,
  action_reflect: dummyTool,
};
