import { Textarea } from "@/components/ui/textarea";
import PagesLayout from "../PagesLayout";
import { Button } from "@/components/ui/button";
import Layout from "./Layout";
import React, { useState } from "react";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router";

export default function AskAI() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(event.target.value);
  };

  const handleSend = async () => {
    setIsLoading(true);

    toast.info("Asking AI");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/${
          import.meta.env.VITE_API_VERSION
        }/rag/query`,
        {
          query: query,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        navigate(`/ask-ai/${response.data.data._id}`);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message);
      }
    }

    setIsLoading(false);
  };

  return (
    <PagesLayout page="Ask AI">
      <Layout>
        <div className="flex flex-col gap-3 items-center">
          <h1 className="text-2xl font-semibold">Ask AI</h1>
          <div className="flex flex-col gap-2 p-4 mx-2 rounded-lg shadow-lg items-start w-full lg:w-[550px]">
            <Textarea
              onChange={handleChange}
              value={query}
              placeholder="Type your question here..."
              className="resize-none"
            />
            <Button disabled={isLoading} onClick={handleSend} size={"sm"}>
              Ask
            </Button>
          </div>
        </div>
      </Layout>
    </PagesLayout>
  );
}
