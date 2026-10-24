import "./ui/style.css";
import { Game } from "./core/game";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Jade Harbor root element #app is missing.");

try {
  const game = new Game(root);
  if (import.meta.env.DEV) {
    (window as unknown as { __game: Game }).__game = game;
  }
} catch (error) {
  root.innerHTML =
    '<main class="fatal-error"><h1>Jade Harbor needs WebGL 2.</h1><p>Enable graphics acceleration in your browser, then reload. Try a recent Chrome, Edge or Firefox on a desktop computer.</p></main>';
  console.error(error);
}
