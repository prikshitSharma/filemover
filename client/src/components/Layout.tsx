import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Link, FileBox, ScrollText, Settings } from "lucide-react";

const navItems = [
	{ to: "/", icon: LayoutDashboard, label: "Dashboard" },
	{ to: "/connections", icon: Link, label: "Connections" },
	{ to: "/jobs", icon: FileBox, label: "Jobs" },
	{ to: "/transfers", icon: ScrollText, label: "Transfers" },
	{ to: "/settings", icon: Settings, label: "Settings" },
];

export function Layout() {
	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar */}
			<aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
				<div className="p-6 border-b border-gray-200">
					<h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
						<FileBox className="w-6 h-6 text-blue-600" />
						FileMover
					</h1>
				</div>
				<nav className="flex-1 p-4 space-y-1">
					{navItems.map(({ to, icon: Icon, label }) => (
						<NavLink
							key={to}
							to={to}
							end={to === "/"}
							className={({ isActive }) =>
								`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									isActive
										? "bg-blue-50 text-blue-700"
										: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
								}`
							}
						>
							<Icon className="w-5 h-5" />
							{label}
						</NavLink>
					))}
				</nav>
			</aside>

			{/* Main content */}
			<main className="flex-1 overflow-auto">
				<div className="p-8">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
