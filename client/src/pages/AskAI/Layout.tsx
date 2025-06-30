import fetcher from "@/lib/fetcher";
import { MessageCircleQuestion, PlusIcon, Trash2Icon } from "lucide-react";
import useSWR, { mutate } from "swr";
import type { Chat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="grid lg:grid-cols-12">
      <div className="col-span-3 lg:block hidden">
        <div className="flex gap-2 items-center rounded-lg shadow-lg p-3 mb-4">
          <MessageCircleQuestion className="w-6 h-6" />
          <p>Ask AI about your notes</p>
        </div>
        <div>
          <Button
            onClick={() => navigate("/ask-ai")}
            variant={"outline"}
            className="mb-2"
          >
            <span>New query</span>
            <PlusIcon />
          </Button>
          <History currentChat={id} />
        </div>
      </div>{" "}
      <div className="col-span-7">{children}</div>
    </div>
  );
}

function History({ currentChat }: { currentChat?: string }) {
  const {
    data: chats,
    isLoading,
    error,
  } = useSWR(
    `${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}/chats`,
    fetcher
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Something went wrong</div>;
  }

  return (
    <div>
      {chats.data && chats.data.length > 0 ? (
        chats.data.map((chat: Chat) => (
          <HistoryItem key={chat._id} chat={chat} currentChat={currentChat} />
        ))
      ) : (
        <div>There were no chats yet</div>
      )}
    </div>
  );
}

function HistoryItem({
  chat,
  currentChat,
}: {
  chat: Chat;
  currentChat?: string;
}) {
  const navigate = useNavigate();
  const [mouseOver, setMouseOver] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleMouseOver = () => {
    setMouseOver(true);
  };

  const handleMouseLeave = () => {
    setMouseOver(false);
  };

  const handleDelete = async () => {
    setIsLoading(true);

    toast.info("Deleting chat");

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/${
          import.meta.env.VITE_API_VERSION
        }/chats/${chat._id}`,
        { withCredentials: true }
      );

      if (response.status === 200) {
        if (currentChat && currentChat === chat._id) {
          navigate("/ask-ai");
        }

        mutate(
          `${import.meta.env.VITE_API_URL}/${
            import.meta.env.VITE_API_VERSION
          }/chats`
        );

        toast.success(response.data.message);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message);
      }
    }

    setIsLoading(false);
  };

  return (
    <div
      onMouseEnter={handleMouseOver}
      onMouseLeave={handleMouseLeave}
      className="flex items-center"
    >
      <Link
        to={`/ask-ai/${chat._id}`}
        className="p-2 hover:bg-secondary rounded-lg mb-1 grow"
      >
        <p className="grow">{chat.query}</p>
      </Link>
      {mouseOver && (
        <Button
          disabled={isLoading}
          onClick={handleDelete}
          size={"icon"}
          variant={"ghost"}
        >
          <Trash2Icon />
        </Button>
      )}
    </div>
  );
}
