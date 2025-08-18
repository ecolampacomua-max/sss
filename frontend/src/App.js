import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

import HomePage from "./components/HomePage";
import TestCatalog from "./components/TestCatalog";
import CreateTest from "./components/CreateTest";
import TestSuccess from "./components/TestSuccess";
import TakeTest from "./components/TakeTest";
import TestResults from "./components/TestResults";
import AdminPanel from "./components/AdminPanel";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Global axios configuration
axios.defaults.baseURL = API;

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tests" element={<TestCatalog />} />
          <Route path="/create" element={<CreateTest />} />
          <Route path="/test-created/:shareToken" element={<TestSuccess />} />
          <Route path="/test/:shareToken" element={<TakeTest />} />
          <Route path="/results/:responseId" element={<TestResults />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/*" element={<AdminPanel />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;