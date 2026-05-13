function LoadingButton({ isLoading, loadingText, idleText, ...props }) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-md disabled:opacity-60"
      {...props}
    >
      {isLoading ? loadingText : idleText}
    </button>
  );
}

export default LoadingButton;
