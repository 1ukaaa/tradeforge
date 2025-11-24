import { render, screen } from "@testing-library/react";
import App from "./App";
import { ThemeModeProvider } from "./context/ThemeModeContext";
// Mock Calendar to avoid parsing FullCalendar ESM modules in tests
jest.mock("./pages/Calendar", () => () => null);
jest.mock("./pages/Dashboard", () => () => <div>Dashboard Page</div>);

test("affiche le dashboard en page d'accueil", () => {
  // Le composant App a besoin du ThemeModeProvider pour se rendre
  render(
    <ThemeModeProvider>
      <App />
    </ThemeModeProvider>
  );

  // La page d'accueil doit afficher le dashboard
  const dashboardElement = screen.getByText(/Dashboard Page/i);
  expect(dashboardElement).toBeInTheDocument();
});
