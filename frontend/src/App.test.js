import { render, screen } from "@testing-library/react";
import App from "./App";

test("affiche la page nouvelle analyse", () => {
  render(<App />);
  expect(screen.getByText(/Nouvelle analyse \/ Trade/i)).toBeInTheDocument();
});
