import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
			<div
				className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
						<X className="w-5 h-5" />
					</button>
				</div>
				<div className="px-5 py-4 overflow-y-auto">{children}</div>
				{footer && <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">{footer}</div>}
			</div>
		</div>
	);
}
