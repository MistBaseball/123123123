import { createRoot } from "react-dom/client";
import DiamondGame from "../components/game/DiamondGame";
import "../app/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Game root element is missing.");
createRoot(root).render(<DiamondGame />);
