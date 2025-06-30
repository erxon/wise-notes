import { useLLMOutput } from "@llm-ui/react";
import { markdownLookBack } from "@llm-ui/markdown";
import { useStreamExample, throttleBasic } from "@llm-ui/react";
import Markdown from "./markdown";
import type { Chat } from "@/lib/types";

const throttle = throttleBasic({
  readAheadChars: 2,
  targetBufferChars: 1,
  adjustPercentage: 0.35,
  frameLookBackMs: 10000,
  windowLookBackMs: 7000,
});

export default function Logs({ chat }: { chat: Chat }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gray-100 dark:bg-black dark:outline rounded-full p-3 w-fit self-end">
        {chat.query}
      </div>
      <Answer key={chat._id} answer={chat.answer} />
    </div>
  );
}

function Answer({ answer }: { answer: string }) {
  const { isStreamFinished, output } = useStreamExample(
    answer.split("</think>")[1]
  );

  const { blockMatches } = useLLMOutput({
    llmOutput: output,
    blocks: [],
    fallbackBlock: {
      component: Markdown, // from Step 1
      lookBack: markdownLookBack(),
    },
    isStreamFinished,
    throttle: throttle,
  });

  return (
    <div>
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch.block.component;
        return <Component key={index} blockMatch={blockMatch} />;
      })}
    </div>
  );
}
