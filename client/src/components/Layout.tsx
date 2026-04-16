import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Link, FileBox, ScrollText, Settings } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
	{ to: "/", icon: LayoutDashboard, label: "Dashboard" },
	{ to: "/connections", icon: Link, label: "Connections" },
	{ to: "/jobs", icon: FileBox, label: "Jobs" },
	{ to: "/transfers", icon: ScrollText, label: "Transfers" },
	{ to: "/settings", icon: Settings, label: "Settings" },
];

export function Layout() {
	return (
		<div className="flex h-screen bg-background text-foreground">
			<aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
				<div className="px-6 py-5 border-b border-sidebar-border flex items-center justify-between">
					<h1 className="text-lg font-semibold flex items-center gap-2">
						<span className="grid place-items-center w-8 h-8 rounded-lg bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
							<FileBox className="w-4 h-4" />
						</span>
						FileMover
					</h1>
					<ThemeToggle />
				</div>
				<nav className="flex-1 p-3 space-y-1">
					{navItems.map(({ to, icon: Icon, label }) => (
						<NavLink
							key={to}
							to={to}
							end={to === "/"}
							className={({ isActive }) =>
								`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
									isActive
										? "bg-sidebar-accent text-sidebar-accent-foreground"
										: "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
								}`
							}
						>
							<Icon className="w-4 h-4" />
							{label}
						</NavLink>
					))}
				</nav>
				<div className="px-4 py-3 text-xs text-sidebar-foreground/50 border-t border-sidebar-border">
					v0.1 · Phase 2
				</div>
			</aside>

			<main className="flex-1 overflow-auto bg-linear-to-b from-background to-muted/30">
				<div className="p-8 max-w-7xl mx-auto">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
