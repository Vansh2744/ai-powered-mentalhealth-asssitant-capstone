import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CreditCardIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../context/userContext";
import { backendUrl } from "@/utils/backendUrl";
import axios from "axios";

export function ProfileDropdown() {
  const navigate = useNavigate();
  const { user, clearUser } = useCurrentUser();
  const handleLogout = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/sign-out/`, {
        email: user?.email,
      });

      console.log(data);

      clearUser();

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      navigate("/auth");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="rounded-full h-10 w-10">
          <UserIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <UserIcon />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCardIcon />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SettingsIcon />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
