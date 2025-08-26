import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const KakashiAnimationsModal = ({ onClose }) => {
  const [animations, setAnimations] = useState([]);
  const [currentUrl, setCurrentUrl] = useState(null);
  const mountRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/src/components/json/kakashiAnimations.json");
        const data = await res.json();
        if (!cancelled) {
          setAnimations(data.files || []);
          if (data.files && data.files[0]) setCurrentUrl(data.files[0]);
        }
      } catch (e) {
        console.error("Failed to load Kakashi animations", e);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!currentUrl || !mountRef.current) return;
    let renderer, scene, camera, mixer, frameId, model;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1, 3);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);
    const light = new THREE.HemisphereLight(16777215, 4473924, 1);
    scene.add(light);
    const loader = new GLTFLoader();
    const clock = new THREE.Clock();
    loader.load(currentUrl, (gltf) => {
      model = gltf.scene;
      scene.add(model);
      mixer = new THREE.AnimationMixer(model);
      const clip = gltf.animations[0];
      if (clip) {
        const action = mixer.clipAction(clip);
        action.play();
      }
      animate();
    });
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      renderer.render(scene, camera);
    };
    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (model) scene.remove(model);
      mixer && mixer.stopAllAction();
    };
  }, [currentUrl]);
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-black bg-opacity-60", onClick: onClose }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 67,
      columnNumber: 5
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "relative bg-gray-900 text-white border-2 border-yellow-600 rounded-xl shadow-2xl overflow-hidden w-[90vw] max-w-[900px] h-[80vh] flex", role: "dialog", "aria-modal": "true", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "w-1/3 overflow-y-auto p-4 space-y-2", children: animations.map((url) => /* @__PURE__ */ jsxDEV("button", { onClick: () => setCurrentUrl(url), className: "block w-full text-left px-3 py-2 rounded hover:bg-gray-800 truncate", title: url, children: url.substring(url.lastIndexOf('/') + 1) }, url, false, {
        fileName: "<stdin>",
        lineNumber: 75,
        columnNumber: 13
      })) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 74,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 flex items-center justify-center bg-black", ref: mountRef }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 79,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { onClick: onClose, className: "absolute top-2 right-2 text-red-400 hover:text-red-300 text-2xl font-bold", "aria-label": "Close", title: "Close", children: "\u00D7" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 80,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 73,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 66,
    columnNumber: 3
  });
};
var stdin_default = KakashiAnimationsModal;
export {
  stdin_default as default
};
