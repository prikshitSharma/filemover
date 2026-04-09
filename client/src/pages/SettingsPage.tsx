import { Settings } from "lucide-react";

export function SettingsPage() {
	return (
		<div>
			<h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
			<div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
				<Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
				<p className="text-gray-500 text-sm">Application settings will be available here.</p>
			</div>
		</div>
	);
}
