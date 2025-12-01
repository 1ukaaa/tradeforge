import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Calculator from "./pages/Calculator";
import Calendar from "./pages/Calendar";
import Dashboard from "./pages/Dashboard";
import DiscordStudio from "./pages/DiscordStudio";
import Journal from "./pages/Journal";
import Settings from "./pages/Settings";
import Stats from "./pages/Stats";
import TradeForgeAI from "./pages/TradeForgeAI";
import TwitterStudio from "./pages/TwitterStudio";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="stats" element={<Stats />} />
          <Route path="tradeforge-ai" element={<TradeForgeAI />} />
          <Route path="journal" element={<Journal />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<Settings />} />
          <Route path="twitter" element={<TwitterStudio />} />
          <Route path="discord" element={<DiscordStudio />} />
          <Route path="calculator" element={<Calculator />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
