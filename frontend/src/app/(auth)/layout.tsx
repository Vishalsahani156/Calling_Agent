export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          AI Voice Calling
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Campaign Platform</h1>
      </div>
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
