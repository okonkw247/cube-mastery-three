import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HardDrive, Camera, Bell, AlertCircle, Check, X } from "lucide-react";
import { toast } from "sonner";

type PermissionType = "storage" | "camera" | "notifications";

interface PermissionRequestProps {
  type: PermissionType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGranted?: () => void;
  onDenied?: () => void;
}

const PERMISSION_CONFIG: Record<PermissionType, {
  icon: typeof HardDrive;
  title: string;
  description: string;
  benefit: string;
  deniedMessage: string;
}> = {
  storage: {
    icon: HardDrive,
    title: "Storage Access",
    description: "Allow Cube Mastery to save lessons for offline viewing. This helps you practice even without an internet connection.",
    benefit: "Download courses for offline practice sessions",
    deniedMessage: "Offline access disabled. You can still watch lessons online.",
  },
  camera: {
    icon: Camera,
    title: "Camera Access",
    description: "Enable your camera to record your cube-solving sessions and track your progress visually.",
    benefit: "Record and review your solving technique",
    deniedMessage: "Camera features disabled. You can still use the timer and watch lessons.",
  },
  notifications: {
    icon: Bell,
    title: "Notification Access",
    description: "Stay updated with new lessons, practice reminders, and achievement notifications.",
    benefit: "Get notified about new content and your progress",
    deniedMessage: "Notifications disabled. Check the app regularly for updates.",
  },
};

export function PermissionRequest({
  type,
  open,
  onOpenChange,
  onGranted,
  onDenied,
}: PermissionRequestProps) {
  const { t } = useTranslation();
  const [requesting, setRequesting] = useState(false);
  const config = PERMISSION_CONFIG[type];
  const Icon = config.icon;

  const requestPermission = async () => {
    setRequesting(true);
    
    try {
      let granted = false;

      switch (type) {
        case "notifications":
          if ("Notification" in window) {
            const result = await Notification.requestPermission();
            granted = result === "granted";
          }
          break;
        
        case "camera":
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            granted = true;
          } catch {
            granted = false;
          }
          break;
        
        case "storage":
          // Storage API doesn't require explicit permission in most browsers
          // Check if storage is available
          if (navigator.storage && navigator.storage.persist) {
            granted = await navigator.storage.persist();
          } else {
            granted = true; // Assume available if API not present
          }
          break;
      }

      if (granted) {
        toast.success(`${config.title} enabled!`);
        onGranted?.();
      } else {
        toast.info(config.deniedMessage);
        onDenied?.();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Permission request error:", error);
      toast.info(config.deniedMessage);
      onDenied?.();
      onOpenChange(false);
    } finally {
      setRequesting(false);
    }
  };

  const handleDeny = () => {
    toast.info(config.deniedMessage);
    onDenied?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">{config.title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
            <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm">{config.benefit}</p>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              You can change this later in your browser settings. We only request permissions when needed for specific features.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDeny}
            disabled={requesting}
          >
            <X className="w-4 h-4 mr-2" />
            Not Now
          </Button>
          <Button
            className="flex-1"
            onClick={requestPermission}
            disabled={requesting}
          >
            {requesting ? (
              "Requesting..."
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Allow
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check and request permissions when needed
export function usePermission(type: PermissionType) {
  const [status, setStatus] = useState<"granted" | "denied" | "prompt">("prompt");
  const [showRequest, setShowRequest] = useState(false);

  useEffect(() => {
    checkPermission();
  }, [type]);

  const checkPermission = async () => {
    try {
      switch (type) {
        case "notifications":
          if ("Notification" in window) {
            setStatus(Notification.permission as "granted" | "denied" | "prompt");
          }
          break;
        
        case "camera":
          if (navigator.permissions) {
            const result = await navigator.permissions.query({ name: "camera" as PermissionName });
            setStatus(result.state === "granted" ? "granted" : result.state === "denied" ? "denied" : "prompt");
          }
          break;
        
        case "storage":
          if (navigator.storage && navigator.storage.persisted) {
            const persisted = await navigator.storage.persisted();
            setStatus(persisted ? "granted" : "prompt");
          }
          break;
      }
    } catch (error) {
      // Permission API might not be available
      setStatus("prompt");
    }
  };

  const requestIfNeeded = () => {
    if (status === "prompt") {
      setShowRequest(true);
    }
  };

  return {
    status,
    showRequest,
    setShowRequest,
    requestIfNeeded,
    isGranted: status === "granted",
  };
}
