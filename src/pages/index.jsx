import Layout from "./Layout.jsx";

import Workspace from "./Workspace";

import Dashboard from "./Dashboard";

import Templates from "./Templates";

import EmbedEditor from "./EmbedEditor";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

const PAGES = {
  Workspace: Workspace,

  Dashboard: Dashboard,

  Templates: Templates,
};

function _getCurrentPage(url) {
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split("/").pop();
  if (urlLastPart.includes("?")) {
    urlLastPart = urlLastPart.split("?")[0];
  }

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase()
  );
  return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        <Route
          path="/"
          element={<Workspace />}
        />

        <Route
          path="/Workspace"
          element={<Workspace />}
        />

        <Route
          path="/Dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/Templates"
          element={<Templates />}
        />
      </Routes>
    </Layout>
  );
}

export default function Pages() {
  return (
    <Router>
      <Routes>
        {/* embed-editor는 Layout 없이 독립적으로 렌더링 */}
        <Route
          path="/embed-editor"
          element={<EmbedEditor />}
        />

        {/* 나머지 페이지들은 Layout으로 감싸서 렌더링 */}
        <Route
          path="/*"
          element={<PagesContent />}
        />
      </Routes>
    </Router>
  );
}
