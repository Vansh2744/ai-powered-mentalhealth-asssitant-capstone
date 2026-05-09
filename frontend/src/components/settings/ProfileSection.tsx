import { Bell, Volume2, User, Shield, HelpCircle, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { useCurrentUser } from "../context/userContext";
import { backendUrl } from "@/utils/backendUrl";

export function ProfileSection({ userId }: { userId?: string }) {
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const { user, logout } = useCurrentUser();

  useEffect(() => {
    if (!userId) return;

    fetch(`${backendUrl}/reminder/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.reminder) {
          setNotifications(data.reminder.enabled);
        }
      });
  }, [userId]);

  const toggleNotifications = async (value: boolean) => {
    setNotifications(value);

    try {
      await fetch(`${backendUrl}/reminder/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: value,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Profile & Settings</h2>
        <p className="text-sm text-gray-500">
          Manage your preferences and account
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="h-7 w-7 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">{user?.email}</p>
          <p className="text-sm text-gray-500">Profile and Settings</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
          Preferences
        </p>

        <div className="bg-white rounded-2xl shadow-sm border divide-y">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Notifications
                </p>
                <p className="text-xs text-gray-500">Daily reminder emails</p>
              </div>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={toggleNotifications}
            />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Sound Effects
                </p>
                <p className="text-xs text-gray-500">Play calming sounds</p>
              </div>
            </div>
            <Switch checked={sound} onCheckedChange={setSound} />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
          Support
        </p>

        <div className="bg-white rounded-2xl shadow-sm border divide-y">
          <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition">
            <Shield className="h-5 w-5 text-gray-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">
                Privacy & Security
              </p>
              <p className="text-xs text-gray-500">
                Your data is safe and secure
              </p>
            </div>
          </button>

          <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition">
            <HelpCircle className="h-5 w-5 text-gray-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">
                Help & Support
              </p>
              <p className="text-xs text-gray-500">FAQs and resources</p>
            </div>
          </button>
        </div>
      </div>

      <button
        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl border border-red-200 hover:bg-red-100 transition"
        onClick={logout}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
      <div className="text-xs text-gray-400 text-center">
        Need immediate help? Contact a professional or local helpline.
      </div>
    </div>
  );
}
