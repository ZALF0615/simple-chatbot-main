import { Chat } from "@/components/Chat";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import firebase from "firebase/app";
import "firebase/firestore";
import{ db } from "@/firebase";

import{  collection,  doc,  addDoc,  setDoc, deleteDoc }from "firebase/firestore"

export default function Home() {
  /*
    메시지 목록을 저장하는 상태로, 메시지의 형태는 다음과 같음
    { role: "system" | "user" | "assistant", content: string }

    role 에 대한 상세한 내용은 다음 문서를 참고
    https://platform.openai.com/docs/guides/chat/introduction

    ex)
    [
      { role: "system", content: "너의 이름을 엘리엇이고, 나의 AI 친구야. 친절하고 명랑하게 대답해줘. 고민을 말하면 공감해줘. 반말로 대답해줘." },
      { role: "assistant", content: "안녕? 나는 엘리엇이야. 오늘은 무슨 일이 있었니?" }
      { role: "user", content: "오늘 재미난 일이 있었어! 한 번 들어볼래?" },
      ...
    ]
  */
  const [messages, setMessages] = useState([]);
  // 메시지를 전송 중인지 여부를 저장하는 상태
  const [loading, setLoading] = useState(false);

  // 스레드 id를 저장하는 상태
  const [threadId, setThreadId] = useState(null);

  const messagesEndRef = useRef(null);

  // 새로운 채팅 세션을 시작할 때 Firestore에 새로운 문서를 생성하고, 그 때 생성된 ID를 가져옵니다.
  const startNewThread = async () => {
    const docRef = await addDoc(collection(db, "threads"), { messages: [] });
    console.log("threadId : " + docRef.id);
    return docRef.id;  // 새로 생성된 문서의 ID를 반환합니다.
  };

  // 메시지 목록을 끝으로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지를 전송하는 함수
  const handleSend = async (message) => {
    // message 를 받아 메시지 목록에 추가
    // message 형태 = { role: "user", content: string }
    // ChatInput.js 26번째 줄 참고
    const updatedMessages = [...messages, message];
    // console.log(updatedMessages);
    // console.log(updatedMessages.slice(-6));

    setMessages(updatedMessages);
    // 메시지 전송 중임을 표시
    setLoading(true);

    // /api/chat 에 메시지 목록을 전송하고 응답을 받음
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // 메시지 목록의 마지막 6개만 전송
        messages: updatedMessages.slice(-6),
      }),
    });

    if (!response.ok) {
      setLoading(false);
      throw new Error(response.statusText);
    }

    // 응답을 JSON 형태로 변환
    // 비동기 API 를 사용하여 응답을 받기 때문에 await 사용
    const result = await response.json();

    if (!result) {
      return;
    }

    saveThreadToFirebase(threadId, updatedMessages.concat(result));

    // 로딩 상태를 해제하고, 메시지 목록에 응답을 추가
    setLoading(false);
    setMessages((messages) => [...messages, result]);

    // 해당 메시지 목록을 Firebase에 저장
  };

  // 스레드를 저장하는 함수
  const saveThreadToFirebase = async (threadId, updatedMessages) => {
    const threadRef = doc(db, "threads", threadId);
  
    try {
      await setDoc(threadRef, { messages: updatedMessages }, { merge: true });
    } catch (error) {
      console.error("Error writing message to Firestore: ", error);
    }
  };

  // (빈) 스레드를 삭제하는 함수
  const deleteThreadFromFirebase = async (threadId) => {
    console.log("delete Thread From Firebase");    
    const threadRef = doc(db, "threads", threadId);
  
    try {
      await deleteDoc(threadRef);
    } catch (error) {
      console.error("Error deleting document from Firestore: ", error);
    }
  };
  // 메시지 목록을 초기화하는 함수
  // 처음 시작할 메시지를 설정
  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "안녕하신가, 나는 아인슈타인이네. 무슨 용건이지?",
      },
    ]);
  };

  // 메시지 목록이 업데이트 될 때마다 맨 아래로 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 컴포넌트가 처음 렌더링 될 때 메시지 목록을 초기화, Thread id 획득
  useEffect(() => {
    handleReset();
    (async () => {
      const id = await startNewThread();
      setThreadId(id);
    })();
  }, []);

  // 메시지가 추가되지 않고 페이지를 벗어나는 경우 생성한 문서 삭제
  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      // 여기서 메시지가 추가되지 않은 경우를 검사합니다.
      console.log("unload" + messages.length);
      if (messages.length === 1) {
        event.preventDefault();
        await deleteThreadFromFirebase(threadId);
      }
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [messages, threadId]);
  

  return (
    <>
      <Head>
        <title>Einstein Chatbot</title>
        <meta name="description" content="A Simple Chatbot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col h-screen">
        <div className="flex h-[50px] sm:h-[60px] border-b border-neutral-300 py-2 px-2 sm:px-8 items-center justify-between">
          <div className="font-bold text-3xl flex text-center">
            <a
              className="ml-2 hover:opacity-50"
              href="https://simple-chatbot-main.vercel.app/"
            >
             아인슈타인과 대화하기
            </a>
          </div>
        </div>

        <div className="flex-1 overflow-auto sm:px-10 pb-4 sm:pb-10">
          <div className="max-w-[800px] mx-auto mt-4 sm:mt-12">
            {/*
              메인 채팅 컴포넌트
              messages: 메시지 목록
              loading: 메시지 전송 중인지 여부
              onSendMessage: 메시지 전송 함수
            */}
            <Chat
              messages={messages}
              loading={loading}
              onSendMessage={handleSend}
            />
            {/* 메시지 목록의 끝으로 스크롤하기 위해 참조하는 엘리먼트 */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="flex h-[30px] sm:h-[50px] border-t border-neutral-300 py-2 px-8 items-center sm:justify-between justify-center"></div>
      </div>
    </>
  );
}
