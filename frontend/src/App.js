import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Calendar from "./pages/Calendar";
import Dashboard from "./pages/Dashboard";
import Home from './pages/Home';
import Journal from "./pages/Journal";
import NewEntry from "./pages/NewEntry";
import Settings from "./pages/Settings";
import TwitterStudio from "./pages/TwitterStudio";
import DiscordStudio from "./pages/DiscordStudio";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route path="/home" element={<Home />} />
          <Route index element={<NewEntry />} />
          <Route path="journal" element={<Journal />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<Settings />} />
          <Route path="twitter" element={<TwitterStudio />} />
          <Route path="discord" element={<DiscordStudio />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
