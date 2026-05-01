interface ValidationMessageProps {
  message: string;
  className?: string;
}

export default function ValidationMessage({
  message,
  className = "mt-2",
}: ValidationMessageProps) {
  return (
    <div className={`w-full flex justify-start ${className}`}>
      <p className="text-[12px] max-w-xs text-red-800 font-extrabold bg-red-100/90 border border-red-400 shadow-md px-3 py-1 rounded-md drop-shadow animate-pulse transition-all duration-300">
        {message}
      </p>
    </div>
  );
}
