import axios from "axios";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { PrimeReactProvider } from "primereact/api";
import Tailwind from "primereact/passthrough/tailwind";
import { BrowserRouter } from "react-router-dom";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import NavProvider from "./context/NavContext.jsx";


axios.defaults.baseURL = "https://grupoasistencia.com/API"; // Configura la URL base para las solicitudes HTTP
// axios.defaults.baseURL = "http://localhost/IntegradoorQAS/API"; // Configura la URL base para las solicitudes HTTP

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter basename="/crm">
    <AuthProvider>
      <NavProvider>
        <PrimeReactProvider value={{ pt: Tailwind }}>
          <App />
        </PrimeReactProvider>
      </NavProvider>
    </AuthProvider>
  </BrowserRouter>
);
