import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Journal from "./pages/Journal";
import NewEntry from "./pages/NewEntry";
import Settings from "./pages/Settings";
import Stats from "./pages/Stats";
// 1. IMPORTER LA NOUVELLE PAGE
import Calendar from "./pages/Calendar";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<NewEntry />} />
          <Route path="journal" element={<Journal />} />
          <Route path="stats" element={<Stats />} />
          <Route path="settings" element={<Settings />} />
          {/* 2. AJOUTER LA NOUVELLE ROUTE */}
          <Route path="calendar" element={<Calendar />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;