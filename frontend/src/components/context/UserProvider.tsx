import React, { useEffect, useState, type ReactNode } from "react";
import { UserContext } from "./userContext";
import axios from "axios";
import { backendUrl } from "@/utils/backendUrl";
import { type CurrentUser } from "@/types";
import { useNavigate } from "react-router-dom";

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>({
    id: "",
    email: "",
  });

  const navigate = useNavigate();

  const fetchCurrentUser = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    try {
      const res = await axios.get(`${backendUrl}/current-user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setUser(res.data);
    } catch (error) {
      setUser({ id: "", email: "" });
      navigate("/auth");
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const clearUser = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, fetchCurrentUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserProvider;
