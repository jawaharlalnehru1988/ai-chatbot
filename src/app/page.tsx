import { Chat } from "nest/components/chat";
import ThemeToggle from "nest/components/ui/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Chatbot</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Powered by OpenAI</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4">
        <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
          <Chat />
        </div>
      </div>
    </div>
  );
}
