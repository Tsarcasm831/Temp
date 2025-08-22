import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("UI ErrorBoundary caught an error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return /* @__PURE__ */ jsxDEV("div", { className: "fixed top-4 right-4 bg-red-700 text-white p-3 rounded shadow-lg z-50", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "font-bold", children: "Something went wrong." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 22,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "text-sm opacity-80", children: "One of the UI panels failed to render." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 23,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            className: "mt-2 px-3 py-1 bg-red-800 rounded hover:bg-red-900",
            onClick: () => this.setState({ hasError: false }),
            children: "Dismiss"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 24,
            columnNumber: 11
          },
          this
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 21,
        columnNumber: 9
      }, this);
    }
    return this.props.children;
  }
}
var stdin_default = ErrorBoundary;
export {
  stdin_default as default
};
