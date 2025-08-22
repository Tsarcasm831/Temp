import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { useMinimap } from "../../../hooks/useMinimap.js";
const Minimap = ({ playerRef, worldObjects, zoomRef }) => {
  const {
    minimapState,
    minimapCanvasRef,
    posXRef,
    posZRef,
    zoomLevelRef,
    biomeRef,
    districtRef,
    roadRef
  } = useMinimap({ playerRef, worldObjects, zoomRef });
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      style: {
        position: "absolute",
        right: "16px",
        top: "16px",
        width: `${minimapState.width}px`
      },
      className: "z-10 flex flex-col shadow-2xl pointer-events-auto",
      children: [
        /* @__PURE__ */ jsxDEV(
          "div",
          {
            style: { height: `${minimapState.height}px` },
            className: "bg-black bg-opacity-70 border-2 border-b-0 border-gray-600 rounded-t overflow-hidden relative",
            children: /* @__PURE__ */ jsxDEV("canvas", { ref: minimapCanvasRef, width: minimapState.width, height: minimapState.height, className: "w-full h-full" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 31,
              columnNumber: 17
            })
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 27,
            columnNumber: 13
          }
        ),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-black bg-opacity-70 text-white p-2 rounded-b text-sm border-2 border-t-0 border-gray-600", children: [
          /* @__PURE__ */ jsxDEV("div", { ref: posXRef, children: "X: 0" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 36,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { ref: posZRef, children: "Z: 0" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 37,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { ref: zoomLevelRef, children: "Zoom Level: 1" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 38,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { ref: biomeRef, children: "Biome: Unknown" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 39,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { ref: districtRef, children: "District: Unknown" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 40,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { ref: roadRef, children: "Road: \u2013" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 41,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 35,
          columnNumber: 13
        })
      ]
    },
    void 0,
    true,
    {
      fileName: "<stdin>",
      lineNumber: 17,
      columnNumber: 9
    }
  );
};
export {
  Minimap
};
