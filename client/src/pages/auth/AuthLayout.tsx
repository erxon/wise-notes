import { Toaster } from "@/components/ui/sonner";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      await axios.get(
        `${import.meta.env.VITE_API_URL}/${
          import.meta.env.VITE_API_VERSION
        }/users/`,
        {
          withCredentials: true,
        }
      );
      navigate("/");
    } catch {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="p-4 bg-white rounded-lg shadow-lg m-4 md:m-0">
          {children}
        </div>
      </div>
      <Toaster />
    </>
  );
}
