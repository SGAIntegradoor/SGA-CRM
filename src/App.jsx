import { Navigate, Route, Routes } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { CssBaseline, ThemeProvider, Box } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import Loader from "./components/LoaderFullScreen/Loader";
import Login from "./views/login/Login";
import MainLayout from "./layouts/MainLayout"; // <-- el nuevo layout
import { AuthContext } from "./context/AuthContext";
import { Inicio } from "./views/Inicio/Inicio";
import { Clientes } from "./views/Clientes/Clientes";
import { Polizas } from "./views/Polizas/Registro/RegistroPolizas";
import { EditarPoliza } from "./views/Polizas/Edicion/EditarPoliza";
import { Comisiones } from "./views/Comisiones/Comisiones";
import LiquidacionImpresion from "./views/Comisiones/Impresion/LiquidacionImpresion";
import { Pagos } from "./views/Pagos/Pagos";
import { AdminNegocios } from "./views/AdminNegocios/AdminNegocios";
import PdfServicesImpresion from "./views/Comisiones/Impresion/PdfPhp";

function App() {
  const [theme, colorMode] = useMode();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { isLogged } = useContext(AuthContext);
  const log = isLogged();

  useEffect(() => {
    setIsLoading(true);
    setIsLoading(false);
    setIsCheckingAuth(false);
  }, []);

  if (isCheckingAuth) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Loader isLoading={isLoading} />
      </Box>
    );
  }

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          {!log ? (
            <>
              <Route
                path="/login"
                element={
                  <Login
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    theme={theme}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              <Route
                path="/"
                element={
                  <MainLayout
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                  />
                }
              >
                <Route path="inicio" element={<Inicio />} />
                <Route
                  path="clientes"
                  element={
                    <Clientes loading={isLoading} setLoading={setIsLoading} />
                  }
                />
                <Route path="polizas">
                  <Route index element={<Navigate to="/inicio" />} />
                  <Route
                    path="registro"
                    element={
                      <Polizas setLoading={setIsLoading} loading={isLoading} />
                    }
                  />
                  <Route
                    path="consulta/detalle"
                    element={
                      <EditarPoliza
                        setLoading={setIsLoading}
                        loading={isLoading}
                        isCollapsed={isCollapsed}
                      />
                    }
                  />
                  <Route
                    path="consulta"
                    element={
                      <AdminNegocios
                        setLoading={setIsLoading}
                        loading={isLoading}
                        isCollapsed={isCollapsed}
                      />
                    }
                  />

                  <Route
                    path="edicion"
                    element={
                      <EditarPoliza
                        setLoading={setIsLoading}
                        loading={isLoading}
                      />
                    }
                  />
                </Route>
                <Route path="comisiones">
                  <Route index element={<Navigate to="/inicio" />} />
                  <Route
                    path="liquidacion"
                    element={
                      <Comisiones
                        setLoading={setIsLoading}
                        loading={isLoading}
                      />
                    }
                  />
                  <Route path="registro">
                    <Route index element={<Navigate to="/inicio" />} />
                    <Route
                      path="pagos"
                      element={
                        <Pagos
                          setLoading={setIsLoading}
                          loading={isLoading}
                          isCollapsed={isCollapsed}
                        />
                      }
                    />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/inicio" />} />
              </Route>
              <Route
                path="/comisiones/liquidacion/impresion"
                element={<LiquidacionImpresion />}
              />
              <Route
                path="/comisiones/liquidacion/pdfservice"
                element={<PdfServicesImpresion />}
              />
            </>
          )}
        </Routes>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
