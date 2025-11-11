import { render, screen } from "@testing-library/react";
import App from "./App";
import { ThemeModeProvider } from "./context/ThemeModeContext";

test("affiche la page Nouvelle Entrée", () => {
  // Le composant App a besoin du ThemeModeProvider pour se rendre
  render(
    <ThemeModeProvider>
      <App />
    </ThemeModeProvider>
  );

  // On recherche le titre H1 de la page NewEntry.js
  const titleElement = screen.getByText(/Nouvelle Entrée/i);
  expect(titleElement).toBeInTheDocument();

  // On vérifie aussi que la description est présente
  const descriptionElement = screen.getByText(
    /Dicte ou colle ton analyse/i
  );
  expect(descriptionElement).toBeInTheDocument();
});