import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import UsageInsights from "./pages/UsageInsights";
import Replenishment from "./pages/Replenishment";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<UsageInsights />} />
        <Route path="replenishment" element={<Replenishment />} />
      </Route>
    </Routes>
  );
}

export default App;
