import { useEffect } from "react";

// Hook personalizado para manejar todos los eventos DOM del dashboard
export const useDashboardEvents = (showNotification?: (type: 'success' | 'error' | 'info', title: string, message: string, rewards?: { candies?: number; xp?: number }) => void) => {
  useEffect(() => {
    // Progress bar inicial
    setTimeout(() => {
      const progressFill = document.querySelector<HTMLElement>(".progress-fill");
      if (progressFill) progressFill.style.width = "35%";

      const challengeFill = document.querySelector<HTMLElement>(
        ".challenge-progress-fill"
      );
      if (challengeFill) challengeFill.style.width = "43%";
    }, 500);

    // Avatar color picker
    document.querySelectorAll<HTMLElement>(".color-option").forEach((option) => {
      option.addEventListener("click", function () {
        document
          .querySelectorAll<HTMLElement>(".color-option")
          .forEach((opt) => opt.classList.remove("active"));
        this.classList.add("active");

        const avatar = document.querySelector<HTMLElement>(".avatar-preview");
        const colorClass = this.className.split(" ")[1];
        if (!avatar) return;

        switch (colorClass) {
          case "color-red":
            avatar.style.background = "#fecaca";
            avatar.style.color = "#dc2626";
            break;
          case "color-green":
            avatar.style.background = "#bbf7d0";
            avatar.style.color = "#059669";
            break;
          case "color-purple":
            avatar.style.background = "#ddd6fe";
            avatar.style.color = "#7c3aed";
            break;
          case "color-yellow":
            avatar.style.background = "#fef3c7";
            avatar.style.color = "#d97706";
            break;
        }
      });
    });

    // Hover en botones
    document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      button.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-1px)";
      });
      button.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0)";
      });
    });

    // Misiones: Los botones ahora usan onClick en el componente Dashboard_Usuario
    // Ya no necesitamos interceptar aquí con event listeners hardcodeados

    // Clases: botón cancelar
    document.querySelectorAll<HTMLButtonElement>(".cancel-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const row = this.closest(".table-row");
        const teacher = row?.querySelector(".teacher-name")?.textContent;
        if (confirm(`¿Cancelar clase con ${teacher}?`)) {
          row?.remove();
        }
      });
    });
  }, []);
};
