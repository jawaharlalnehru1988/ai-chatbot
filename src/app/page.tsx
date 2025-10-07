import AppLayout from "nest/components/layout/AppLayout";
import { ChatHistoryProvider } from "nest/contexts/ChatHistoryContext";
import { ThemeProvider } from "nest/contexts/ThemeContext";

export default function Home() {
  return (
    <ThemeProvider>
      <ChatHistoryProvider>
        <div className="h-screen">
          <AppLayout />
        </div>
      </ChatHistoryProvider>
    </ThemeProvider>
  );
}
