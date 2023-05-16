import { IconDots } from "@tabler/icons-react";

export const ChatLoader = () => {
  return (
    <div className="flex items-start">
      <img
        src="/einstein.png"
        alt="einstein"
        className="w-10 h-10 object-cover mr-3 rounded-full"
      />
      <div
        className={`flex items-center bg-neutral-200 text-neutral-900 rounded-2xl px-4 py-2 w-fit`}
        style={{ overflowWrap: "anywhere" }}
      >
        <IconDots className="animate-pulse" />
      </div>
    </div>
  );
};
