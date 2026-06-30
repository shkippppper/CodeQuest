import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { TopicPage } from "./pages/TopicPage";
import { ReviewPage } from "./pages/ReviewPage";
import { ChallengePage } from "./pages/ChallengePage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ThemeProvider } from "./theme/ThemeContext";
import { ProgressProvider } from "./game/store";

export default function App() {
  return (
    <ThemeProvider>
      <ProgressProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/learn/:topicId" element={<TopicPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/challenge" element={<ChallengePage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProgressProvider>
    </ThemeProvider>
  );
}
