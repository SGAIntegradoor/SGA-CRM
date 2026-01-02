import React from "react";
import Swal from "sweetalert2";

export const TopRight = (index) => {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon: "info",
    title: `Campos incompletos en el pago ${index + 1}`,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      // Barra de progreso
      const bar = toast.querySelector(".swal2-timer-progress-bar");
      if (bar) {
        bar.style.backgroundColor = "#88D600";
      }

      // Icono (color del círculo y del símbolo)
      const icon = toast.querySelector(".swal2-icon");
      if (icon) {
        icon.style.borderColor = "#88D600"; // borde
        icon.style.color = "#88D600"; // símbolo (info, check, etc.)
      }
    },
  });
};
