import MessageMentionsRegex from "./MessageMentionsRegex.js";

export default function createPartialMessage(message, part) {
  const partial = Object.create(message, {
    content: { value: part },
  });

  partial.mentions = new MessageMentionsRegex(partial);

  return partial;
}
