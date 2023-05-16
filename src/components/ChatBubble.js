export const ChatBubble = ({ message }) => {
  return (
    <div
      className={`flex ${
        /* message.role 이 assistant 인 경우 좌측 정렬, 그 외에는 우측 정렬 */
        message.role === "assistant" ? "justify-start" : "justify-end"
      }`}
    >
      {message.role === "assistant" && (
        <img
          src="einstein.png"
          alt="Einstein"
          className="w-10 h-10 object-cover mr-3 rounded-full"
        />
      )}
      <div
        className={`flex flex-col items-start ${
          message.role === "assistant" ? "items-start" : "items-end"
        }`}
      >
        <div
          className={`flex items-center ${
            message.role === "assistant"
              ? "bg-neutral-200 text-neutral-900"
              : "bg-blue-500 text-white"
          } rounded-2xl px-3 py-2 max-w-[100%] whitespace-pre-wrap`}
          style={{ overflowWrap: "anywhere" }}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};
