import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../../styles/layout.css";
import "../../styles/sidebar.css";

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <AnimatePresence mode="wait">
          <motion.section
            className="page-content"
            key={typeof window !== "undefined" ? window.location.pathname : "page"}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default Layout;