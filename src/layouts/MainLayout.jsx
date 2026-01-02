// src/layouts/MainLayout.jsx
import { Topbar } from "../views/Global/Topbar";
import { Sidebar } from "../views/Global/Sidebar";
import { Footer } from "../views/Global/Footer";
import { Outlet } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const MainLayout = ({ isCollapsed, setIsCollapsed }) => {

  const { loggedData } = useContext(AuthContext);
  const loggedDataInfo = loggedData();

  return (
    <div className="flex flex-row min-h-screen">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        loggedDataInfo={loggedDataInfo}
      />
      <div className="flex flex-col w-3/4 flex-1">
        <main className="content">
          <Topbar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
