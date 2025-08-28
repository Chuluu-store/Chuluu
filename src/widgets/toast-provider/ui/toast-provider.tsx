'use client';

import { Toast, ToastContainer } from '../../../shared/ui/toast';
import { useToastStore } from '../../../shared/lib/toast';

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  // Group toasts by position
  const toastsByPosition = toasts.reduce((acc, toast) => {
    const position = toast.position || 'top-center';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(toast);
    return acc;
  }, {} as Record<string, typeof toasts>);

  return (
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <ToastContainer key={position} containerPosition={position as any}>
          {positionToasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              duration={0} // Disable auto-close since it's handled by store
              position={toast.position}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </ToastContainer>
      ))}
    </>
  );
}
