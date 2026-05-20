type ToastType = 'success' | 'error';

type Toast = {
	id: number;
	message: string;
	type: ToastType;
};

class ToastStore {
	toasts = $state<Toast[]>([]);
	private counter = 0;

	add(message: string, type: ToastType = 'success', duration = 3000) {
		const id = ++this.counter;
		this.toasts = [...this.toasts, { id, message, type }];
		setTimeout(() => this.remove(id), duration);
	}

	remove(id: number) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}
}

export const toastStore = new ToastStore();
