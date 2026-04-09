import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Connections } from "./pages/Connections";
import { Jobs } from "./pages/Jobs";
import { Transfers } from "./pages/Transfers";
import { SettingsPage } from "./pages/SettingsPage";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<Routes>
					<Route element={<Layout />}>
						<Route path="/" element={<Dashboard />} />
						<Route path="/connections" element={<Connections />} />
						<Route path="/jobs" element={<Jobs />} />
						<Route path="/transfers" element={<Transfers />} />
						<Route path="/settings" element={<SettingsPage />} />
					</Route>
				</Routes>
			</BrowserRouter>
		</QueryClientProvider>
	);
}

export default App;
