import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const MAP_EDITOR_URL = "map/index.html";
const MAP_BUTTON_LABEL = "Map Editor";
const MAP_MODAL_WIDTH_PCT = 98;
const MAP_MODAL_HEIGHT_PCT = 98;
const MAP_MODAL_BACKDROP_OPACITY = 0.6;
const MAP_EDITOR_ENABLED = false;
const MainMenu = ({ onStart, onOptions, onChangelog, onCredits, version }) => {
  const [showMapModal, setShowMapModal] = React.useState(false);
  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowMapModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: "w-full h-full bg-cover bg-center flex flex-col items-center justify-center text-white",
      style: { backgroundImage: "url('/menu.png')" },
      children: [
        /* @__PURE__ */ jsxDEV("div", { className: "bg-black bg-opacity-60 p-12 rounded-xl shadow-2xl border-2 border-yellow-500 flex flex-col items-center gap-6 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxDEV("p", { className: "text-gray-300 -mt-4", children: version }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 29,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col gap-4 w-64", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: onStart,
                className: "bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200",
                children: "Start Game"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 31,
                columnNumber: 21
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: onOptions,
                className: "bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200",
                children: "Options"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 37,
                columnNumber: 21
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: onChangelog,
                className: "bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200",
                children: "Changelog"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 43,
                columnNumber: 21
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: onCredits,
                className: "bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200",
                children: "Credits"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 49,
                columnNumber: 21
              }
            ),
            MAP_EDITOR_ENABLED && /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => setShowMapModal(true),
                className: "bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200",
                children: MAP_BUTTON_LABEL
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 56,
                columnNumber: 23
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 30,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 28,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV(
          "a",
          {
            href: "https://websim.com/@LordTsarcasm",
            target: "_blank",
            rel: "noreferrer",
            className: "absolute bottom-4 right-4 text-yellow-300 hover:text-yellow-200 hover:underline bg-black/50 px-3 py-1 rounded border border-yellow-600 text-sm",
            title: "View profile",
            children: "@LordTsarcasm"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 66,
            columnNumber: 13
          }
        ),
        MAP_EDITOR_ENABLED && showMapModal && /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: "fixed inset-0 z-50 flex items-center justify-center",
            role: "dialog",
            "aria-modal": "true",
            "aria-label": "Map Editor",
            children: [
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: "absolute inset-0",
                  style: { background: `rgba(0,0,0,${MAP_MODAL_BACKDROP_OPACITY})` },
                  onClick: () => setShowMapModal(false)
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 83,
                  columnNumber: 17
                }
              ),
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: "relative border-2 border-yellow-600 rounded-xl shadow-2xl overflow-hidden bg-black",
                  style: {
                    width: `${MAP_MODAL_WIDTH_PCT}vw`,
                    height: `${MAP_MODAL_HEIGHT_PCT}vh`
                  },
                  children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "absolute top-2 right-2 z-10", children: /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        onClick: () => setShowMapModal(false),
                        className: "px-3 py-1 rounded bg-black/70 text-white border border-gray-400 hover:bg-black/80",
                        title: "Close map editor (Esc)",
                        children: "Close"
                      },
                      void 0,
                      false,
                      {
                        fileName: "<stdin>",
                        lineNumber: 96,
                        columnNumber: 21
                      }
                    ) }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 95,
                      columnNumber: 19
                    }),
                    /* @__PURE__ */ jsxDEV(
                      "iframe",
                      {
                        title: "Konoha Map Editor",
                        src: MAP_EDITOR_URL,
                        className: "w-full h-full",
                        style: { border: "none" }
                      },
                      void 0,
                      false,
                      {
                        fileName: "<stdin>",
                        lineNumber: 104,
                        columnNumber: 19
                      }
                    )
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 88,
                  columnNumber: 17
                }
              )
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 77,
            columnNumber: 15
          }
        )
      ]
    },
    void 0,
    true,
    {
      fileName: "<stdin>",
      lineNumber: 24,
      columnNumber: 9
    }
  );
};
var stdin_default = MainMenu;
export {
  MainMenu,
  stdin_default as default
};
