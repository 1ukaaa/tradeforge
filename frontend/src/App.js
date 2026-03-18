import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import AppLayout from "./layout/AppLayout";
import Calculator from "./pages/Calculator";
import Calendar from "./pages/Calendar";
import Dashboard from "./pages/Dashboard";
import DiscordStudio from "./pages/DiscordStudio";
import Investment from "./pages/Investment";
import Journal from "./pages/Journal";
import Settings from "./pages/Settings";
import SharedJournal from "./pages/SharedJournal";
import TradeForgeAI from "./pages/TradeForgeAI";
import MacroLens from "./pages/MacroLens";
import TwitterStudio from "./pages/TwitterStudio";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Route publique — journal partagé (sans menu de navigation) */}
        <Route path="/shared/:token" element={<SharedJournal />} />

        {/* Routes principales — Protégées par le mot de passe maître */}
        <Route
          path="/"
          element={
            <AuthGate>
              <AppLayout />
            </AuthGate>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tradeforge-ai" element={<TradeForgeAI />} />
          <Route path="journal" element={<Journal />} />
          <Route path="investissements" element={<Investment />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="macrolens" element={<MacroLens />} />
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
