import React from "react";
import LoginForm from "./auth/login/login";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import SignupForm from "./auth/signup/signup";
import DashBoardPage from "./pages/dashboard/dashboard";
function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/profile" element={<DashBoardPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
