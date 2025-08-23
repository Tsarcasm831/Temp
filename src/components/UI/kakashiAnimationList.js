import animationsData from "../json/kakashiAnimations.json";

function parseAnimationName(url) {
  const fileName = url.substring(url.lastIndexOf("/") + 1);
  let name = fileName.replace("Animation_", "").replace("_withSkin.glb", "");
  return name
    .toLowerCase()
    .split("_")
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

export const kakashiAnimationList = animationsData.files.map((url) => ({
  name: parseAnimationName(url),
  url,
}));
