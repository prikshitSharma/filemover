import { Settings } from "lucide-react";

export function SettingsPage() {
	return (
		<div>
			<h2 className="text-2xl font-bold tracking-tight mb-1">Settings</h2>
			<p className="text-sm text-muted-foreground mb-6">Application configuration and preferences.</p>
			<div className="bg-card text-card-foreground rounded-xl border p-12 text-center shadow-sm">
				<Settings className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
				<h3 className="text-lg font-medium mb-2">Settings</h3>
				<p className="text-muted-foreground text-sm">Application settings will be available here.</p>
			</div>
		</div>
	);
}
