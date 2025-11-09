import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FetchConfig {
  concurrency: number;
  delayBetweenRequests: number;
  maxRetries: number;
  autoRetry: boolean;
}

const DEFAULT_CONFIG: FetchConfig = {
  concurrency: 5,
  delayBetweenRequests: 1500,
  maxRetries: 3,
  autoRetry: true,
};

export const FetchConfigDialog = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<FetchConfig>(() => {
    const saved = localStorage.getItem('fetch_queue_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const handleSave = () => {
    localStorage.setItem('fetch_queue_config', JSON.stringify(config));
    toast({
      title: "Settings saved",
      description: "Fetch queue configuration has been updated",
    });
    setOpen(false);
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Fetch Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Fetch Queue Configuration</DialogTitle>
          <DialogDescription>
            Configure how the automatic fetch queue processes cases
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="concurrency">
              Concurrent Requests
              <span className="text-xs text-muted-foreground ml-2">
                (How many cases to process at once)
              </span>
            </Label>
            <Input
              id="concurrency"
              type="number"
              min={1}
              max={10}
              value={config.concurrency}
              onChange={(e) => setConfig({ ...config, concurrency: parseInt(e.target.value) || 1 })}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 3-5. Higher values may hit rate limits.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delay">
              Delay Between Requests (ms)
              <span className="text-xs text-muted-foreground ml-2">
                (Pause between each API call)
              </span>
            </Label>
            <Input
              id="delay"
              type="number"
              min={500}
              max={5000}
              step={100}
              value={config.delayBetweenRequests}
              onChange={(e) => setConfig({ ...config, delayBetweenRequests: parseInt(e.target.value) || 1000 })}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 1000-2000ms to avoid rate limiting.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxRetries">
              Maximum Retry Attempts
              <span className="text-xs text-muted-foreground ml-2">
                (How many times to retry failed fetches)
              </span>
            </Label>
            <Input
              id="maxRetries"
              type="number"
              min={0}
              max={10}
              value={config.maxRetries}
              onChange={(e) => setConfig({ ...config, maxRetries: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">
              Failed requests will retry with exponential backoff: 1min, 5min, 15min, 1hr
            </p>
          </div>

          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="autoRetry" className="cursor-pointer">
                Automatic Retry
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically retry failed fetches based on the schedule above
              </p>
            </div>
            <Switch
              id="autoRetry"
              checked={config.autoRetry}
              onCheckedChange={(checked) => setConfig({ ...config, autoRetry: checked })}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-medium">Queue Processing Schedule</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Automatic processing runs every 2 minutes</li>
              <li>• Processes up to {config.concurrency} cases concurrently</li>
              <li>• Failed cases retry automatically with increasing delays</li>
              <li>• You can manually trigger processing anytime</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};