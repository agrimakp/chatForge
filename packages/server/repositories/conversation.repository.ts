//store conversation in memory -- implementation details are hidden from the client
const conversations = new Map<string, string>();
// export public interface for the conversation repository

export const conversationRepository = {
  getLastResponseId(conversationId: string): string | undefined {
    return conversations.get(conversationId);
  },
  setLastResponseId(conversationId: string, responseId: string): void {
    conversations.set(conversationId, responseId);
  },
  deleteConversation(conversationId: string): void {
    conversations.delete(conversationId);
  },
};
