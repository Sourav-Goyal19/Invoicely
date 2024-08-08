const LoadingModal = () => {
  return (
    <div className="fixed top-0 left-0 h-screen w-screen bg-background opacity-50 z-[500]">
      <div className="h-10 w-10 fixed top-[50%] left-[50%] border-2 border-foreground rounded-full border-b-transparent animate-spin"></div>
    </div>
  );
};

export default LoadingModal;
