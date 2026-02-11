import { Bell, Shield, User, HelpCircle, Volume2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export function SettingsSection() {
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="font-semibold text-foreground text-lg">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your experience
        </p>
      </div>

      {/* Settings groups */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Profile section */}
        <div className="bg-card rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Guest User</h3>
              <p className="text-sm text-muted-foreground">Create an account to save your progress</p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Preferences
          </h3>
          
          <div className="bg-card rounded-2xl shadow-soft divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-sm">Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive daily wellness reminders</p>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-sm">Sound Effects</p>
                  <p className="text-xs text-muted-foreground">Calming sounds during exercises</p>
                </div>
              </div>
              <Switch checked={soundEffects} onCheckedChange={setSoundEffects} />
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Support
          </h3>
          
          <div className="bg-card rounded-2xl shadow-soft divide-y divide-border">
            <button className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground text-sm">Privacy & Security</p>
                <p className="text-xs text-muted-foreground">Your data is always private and secure</p>
              </div>
            </button>
            
            <button className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground text-sm">Help & Resources</p>
                <p className="text-xs text-muted-foreground">Crisis resources and FAQs</p>
              </div>
            </button>
          </div>
        </div>

        {/* Crisis notice */}
        <div className="bg-accent rounded-2xl p-4 border border-primary/20">
          <p className="text-sm text-foreground font-medium mb-2">
            Need immediate support?
          </p>
          <p className="text-xs text-muted-foreground">
            If you're in crisis, please reach out to a mental health professional or call your local crisis helpline. This AI is not a replacement for professional care.
          </p>
        </div>
      </div>
    </div>
  );
}
