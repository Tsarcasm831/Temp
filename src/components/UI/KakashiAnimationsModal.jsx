import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useMemo, useState } from "react";
import { kakashiAnimationList } from "./kakashiAnimationList.js";

const KakashiAnimationsModal = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const animations = useMemo(() => kakashiAnimationList, []);
  const filtered = useMemo(() => {
    if (!query) return animations;
    const q = query.toLowerCase();
    return animations.filter((a) => a.name.toLowerCase().includes(q));
  }, [animations, query]);
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-black bg-opacity-60", onClick: onClose }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 13,
      columnNumber: 5
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "relative bg-gray-900 text-white border-2 border-yellow-600 rounded-xl shadow-2xl overflow-hidden w-[70vw] h-[70vh] flex flex-col", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between px-5 py-3 bg-gray-800 border-b border-gray-700", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-yellow-400 font-bold text-xl", children: "Kakashi Animations" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 17,
          columnNumber: 9
        }),
        /* @__PURE__ */ jsxDEV("button", {
          onClick: onClose,
          className: "text-red-400 hover:text-red-300 text-2xl font-bold w-8 h-8 flex items-center justify-center",
          "aria-label": "Close animations list",
          title: "Close",
          children: "\xD7"
        }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 18,
          columnNumber: 9
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 16,
        columnNumber: 7
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "px-5 py-3 bg-gray-850 border-b border-gray-700 flex items-center gap-4", children: [
        /* @__PURE__ */ jsxDEV("input", {
          type: "text",
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: "Search animations...",
          className: "px-3 py-2 rounded bg-gray-800 border border-gray-600 w-72 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 27,
          columnNumber: 9
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-gray-400 ml-auto", children: ["Total: ", animations.length, " | Press Y to toggle this panel."] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 33,
          columnNumber: 9
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 26,
        columnNumber: 7
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3", children: [
        filtered.map(({ name, url }) => /* @__PURE__ */ jsxDEV("div", {
          className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2",
          title: url,
          children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-yellow-300 font-semibold truncate", children: name }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 43,
              columnNumber: 11
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-gray-400 truncate", children: url }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 44,
              columnNumber: 11
            })
          ]
        }, name, true, {
          fileName: "<stdin>",
          lineNumber: 38,
          columnNumber: 9
        })),
        filtered.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "col-span-full text-center text-gray-400", children: "No animations found." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 47,
          columnNumber: 9
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 37,
        columnNumber: 7
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 15,
      columnNumber: 5
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 12,
    columnNumber: 3
  });
};
var stdin_default = KakashiAnimationsModal;
export {
  stdin_default as default
};
