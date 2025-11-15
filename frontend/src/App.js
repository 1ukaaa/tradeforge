import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Calendar from "./pages/Calendar";
import Home from './pages/Home';
import Journal from "./pages/Journal";
import NewEntry from "./pages/NewEntry";
import Settings from "./pages/Settings";
import Stats from "./pages/Stats";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route path="/home" element={<Home />} />
          <Route index element={<NewEntry />} />
          <Route path="journal" element={<Journal />} />
          <Route path="stats" element={<Stats />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;