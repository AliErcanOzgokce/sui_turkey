import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { DiscordCallback } from "./pages/DiscordCallback";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discord/callback" element={<DiscordCallback />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
