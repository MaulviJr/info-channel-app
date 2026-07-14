import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import logoUrl from "../../assets/info2.svg";
/**
 * Logo3DHero
 * -----------------------------------------------------------------------
 * Loads a real SVG file (with its own colors — no manual color props
 * needed), auto-inlines any CSS-class-based styling and gradients,
 * extrudes filled shapes into 3D, renders stroke-only paths as flat
 * line accents, and gives the user OrbitControls to rotate/zoom.
 *
 * USAGE:
 *   <Logo3DHero svgUrl="/info2.svg" />
 *
 * `svgUrl` can be:
 *   - a path served from your public folder (e.g. "/info2.svg" in
 *     Vite/CRA — just drop the file in your `public/` directory), or
 *   - a raw SVG markup string (starting with "<svg") if you already
 *     have the file contents in JS (e.g. via a bundler's raw-loader
 *     or `?raw` import).
 *
 * WHY NO COLOR PROPS: your SVG's own fills/strokes/gradients are read
 * directly from the file. If your SVG uses CSS classes (<style> block)
 * to define fills, this component inlines those onto each path before
 * handing it to Three's SVGLoader, since SVGLoader only understands
 * inline/presentation attributes, not external stylesheet rules.
 * Gradients whose stops resolve to a single solid color are simplified
 * automatically; true multi-color gradients fall back to their first
 * stop color (since flat 3D extrusion can't texture-map a gradient
 * without additional UV/shader work).
 */

const EXTRUDE_DEPTH = 20; // thickness of the extruded logo, tune to taste
const BEVEL_SIZE = 2;

// ---------------------------------------------------------------------
// Reads a hex/rgb color string from an SVG <stop stop-color="...">
// ---------------------------------------------------------------------
function normalizeColor(str) {
  if (!str) return null;
  const trimmed = str.trim();
  if (trimmed === "none" || trimmed === "") return null;
  return trimmed;
}

// ---------------------------------------------------------------------
// Inlines <style> class rules and resolves simple gradients into
// direct fill/stroke attributes so SVGLoader can read them.
// ---------------------------------------------------------------------
function inlineSvgStyles(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");

  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error("Could not parse SVG file — check it is well-formed XML.");
  }

  // ---- 1. Build a map of className -> "fill:...;stroke:...;..." ----
  const classMap = {};
  doc.querySelectorAll("style").forEach((styleNode) => {
    const cssText = styleNode.textContent || "";
    const ruleRegex = /\.([\w-]+)\s*\{([^}]*)\}/g;
    let match;
    while ((match = ruleRegex.exec(cssText)) !== null) {
      const [, className, body] = match;
      classMap[className] = (classMap[className] || "") + body.trim();
    }
  });

  // ---- 2. Build a map of gradientId -> resolved color (if simple) ----
  const gradientColorMap = {};
  doc.querySelectorAll("linearGradient, radialGradient").forEach((grad) => {
    const id = grad.getAttribute("id");
    if (!id) return;
    const stops = Array.from(grad.querySelectorAll("stop"))
      .map((s) => normalizeColor(s.getAttribute("stop-color")))
      .filter(Boolean);
    if (stops.length === 0) return;
    const allSame = stops.every((c) => c === stops[0]);
    // If all stops share a color, it's effectively solid — use it directly.
    // Otherwise approximate with the first stop (documented limitation).
    gradientColorMap[id] = stops[0];
    if (!allSame) {
      console.warn(
        `Logo3DHero: gradient "#${id}" has multiple colors; approximating with its first stop (${stops[0]}) since flat extrusion can't render true gradients.`
      );
    }
  });

  const resolveFillOrStroke = (value) => {
    if (!value) return value;
    const urlMatch = value.match(/^url\(#([\w-]+)\)$/);
    if (urlMatch) {
      const resolved = gradientColorMap[urlMatch[1]];
      return resolved || value;
    }
    return value;
  };

  // ---- 3. Apply resolved styles as inline `style` attributes ----
  doc.querySelectorAll("[class]").forEach((el) => {
    const classes = el.getAttribute("class").split(/\s+/);
    let mergedStyle = "";
    classes.forEach((cls) => {
      if (classMap[cls]) mergedStyle += classMap[cls] + ";";
    });
    if (!mergedStyle) return;

    // Resolve any gradient references inside the merged style string
    mergedStyle = mergedStyle.replace(
      /(fill|stroke)\s*:\s*([^;]+)/g,
      (full, prop, val) => `${prop}:${resolveFillOrStroke(val.trim())}`
    );

    const existing = el.getAttribute("style") || "";
    el.setAttribute("style", existing + mergedStyle);
  });

  // ---- 4. Also resolve gradient refs on direct fill="url(#...)" attrs ----
  doc.querySelectorAll("[fill]").forEach((el) => {
    const resolved = resolveFillOrStroke(el.getAttribute("fill"));
    if (resolved) el.setAttribute("fill", resolved);
  });

  return new XMLSerializer().serializeToString(doc);
}

async function loadSvgMarkup(svgUrl) {
  if (svgUrl.trim().startsWith("<svg")) return svgUrl;
  const res = await fetch(svgUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch SVG at "${svgUrl}" (${res.status})`);
  }
  return res.text();
}

export default function Logo3DHero({
  svgUrl = logoUrl,
  className = "",
  style = {},
  backgroundColor = null, // e.g. "#0b0b12", or null for transparent
  autoRotate = true,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    let disposed = false;

    // ---- Scene / Camera / Renderer ----
    const scene = new THREE.Scene();
    if (backgroundColor) scene.background = new THREE.Color(backgroundColor);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(0, 0, 300);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: !backgroundColor,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ---- Lighting ----
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(100, 150, 200);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-150, -50, 100);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x88aaff, 0.8, 800);
    rimLight.position.set(0, 100, -200);
    scene.add(rimLight);

    // ---- Orbit Controls ----
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.5;
    controls.enablePan = false;
    controls.minDistance = 200;
    controls.maxDistance = 250;
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;
    const logoGroup = new THREE.Group();
    scene.add(logoGroup);

    // ---- Load, inline-style, and build the SVG logo ----
    loadSvgMarkup(svgUrl)
      .then((rawSvg) => {
        if (disposed) return;
        const inlinedSvg = inlineSvgStyles(rawSvg);

        const loader = new SVGLoader();
        const svgData = loader.parse(inlinedSvg);

        const extrudeSettings = {
          depth: EXTRUDE_DEPTH,
          bevelEnabled: true,
          bevelThickness: BEVEL_SIZE,
          bevelSize: BEVEL_SIZE,
          bevelSegments: 3,
          curveSegments: 24,
        };

        svgData.paths.forEach((path) => {
          const fillColor = normalizeColor(path.userData?.style?.fill);
          const strokeColor = normalizeColor(path.userData?.style?.stroke);
          const strokeWidth = parseFloat(path.userData?.style?.strokeWidth) || 2;

          if (fillColor) {
            // --- Filled shape: extrude into a solid 3D mesh ---
            const material = new THREE.MeshStandardMaterial({
              color: fillColor,
              metalness: 0.35,
              roughness: 0.4,
              side: THREE.DoubleSide,
            });
            const shapes = SVGLoader.createShapes(path);
            shapes.forEach((shape) => {
              const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
              logoGroup.add(new THREE.Mesh(geometry, material));
            });
          } else if (strokeColor) {
            // --- Stroke-only path: render as a flat line ribbon ---
            const strokeMaterial = new THREE.MeshStandardMaterial({
              color: strokeColor,
              metalness: 0.2,
              roughness: 0.5,
              side: THREE.DoubleSide,
            });
            path.subPaths.forEach((subPath) => {
              const points = subPath.getPoints();
              const strokeGeometry = SVGLoader.pointsToStroke(points, {
                strokeWidth,
                strokeLineJoin: "round",
                strokeLineCap: "round",
                strokeMiterLimit: 4,
              });
              if (strokeGeometry) {
                const mesh = new THREE.Mesh(strokeGeometry, strokeMaterial);
                mesh.position.z = EXTRUDE_DEPTH + 0.5; // sit just in front
                logoGroup.add(mesh);
              }
            });
          }
        });

        // ---- Center and normalize scale/orientation ----
        const box = new THREE.Box3().setFromObject(logoGroup);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        logoGroup.children.forEach((mesh) => {
          mesh.geometry.translate(-center.x, -center.y, -center.z);
        });

        // SVG y-axis points down; flip so the logo reads right-side up
        logoGroup.rotation.x = Math.PI;

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetSize = 160;
        const scale = targetSize / maxDim;
        logoGroup.scale.setScalar(scale);
      })
      .catch((err) => {
        console.error("Logo3DHero: failed to load/parse SVG —", err);
      });

    // ---- Resize handling ----
    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ---- Animation loop ----
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ---- Cleanup ----
    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      controls.dispose();

      logoGroup.children.forEach((mesh) => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [svgUrl, backgroundColor, autoRotate]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        cursor: "grab",
        ...style,
      }}
    />
  );
}