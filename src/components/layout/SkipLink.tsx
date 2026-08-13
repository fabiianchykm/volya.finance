"use client";

// «Перейти до основного вмісту» — перший фокусований елемент сторінки (WCAG 2.4.1).
// Прихований, зʼявляється лише при фокусі з клавіатури (Tab). Кожна сторінка має свій
// <main>, тож переводимо фокус на нього програмно (id проставляти не треба).
export function SkipLink() {
  return (
    <a
      href="#main"
      onClick={(e) => {
        const main = document.querySelector("main");
        if (main) {
          e.preventDefault();
          main.setAttribute("tabindex", "-1");
          (main as HTMLElement).focus();
          main.scrollIntoView();
        }
      }}
      className="sr-only rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
    >
      Перейти до основного вмісту
    </a>
  );
}
