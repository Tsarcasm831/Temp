import * as THREE from 'three';
import { loadPlayerAssets, playAnimation, DEFAULT_ANIMATION } from './animations.js';
import { updatePlayerMovement } from './movement/index.js';
// @tweakable base path anchor for terrain imports (change only if your host serves /src under a different root)
import { WORLD_SIZE } from '/src/scene/terrain.js';

let lastLightUpdatePosition = new THREE.Vector3();
let shadowCastingObjects = new Set();

/**
 * Resets the internal state of the player module, like shadow casting lists.
 * Should be called when the scene's objects are regenerated.
 */
export function resetPlayerState() {
    lastLightUpdatePosition.set(0, 0, 0);
    shadowCastingObjects.clear();
}

/**
 * Creates the player object, loads its assets, and adds it to the scene.
 * @param {THREE.Scene} scene - The main scene.
 * @param {object} settings - The current game settings.
 * @param {function} onReady - Callback when player is ready.
 * @returns {THREE.Group} The player group object.
 */
export function createPlayer(scene, settings, onReady) {
    const player = new THREE.Group();
    // Spawn the player at x: 0, z: 0 (ground level y will be managed by movement)
    player.position.set(0, 0, 0);

    // Add custom properties for physics and state
    player.userData.velocity = new THREE.Vector3(0, 0, 0);
    player.userData.onGround = true;
    player.userData.model = null;
    player.userData.mixer = null;
    player.userData.animations = {};
    player.userData.currentAnimation = null;
    player.userData.jumpListener = null;
    // New: lock flag to prevent animation changes during one-shot actions (e.g., attack)
    player.userData.actionLocked = false;

    loadPlayerAssets().then(({ model, animations }) => {
        model.scale.set(4, 4, 4);
        model.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = settings.shadows;
                child.receiveShadow = true;
            }
        });
        player.add(model);
        player.userData.model = model;
        scene.add(player);

        const mixer = new THREE.AnimationMixer(model);
        player.userData.mixer = mixer;

        // Create ClipActions from the loaded clips
        for (const name in animations) {
            const clip = animations[name];
            player.userData.animations[name] = mixer.clipAction(clip);
        }
        
        playAnimation(player, DEFAULT_ANIMATION);

        // Notify scene/game that the player (critical asset) is ready
        try { onReady && onReady(); } catch (_) {}
    }).catch(error => {
        console.error('Error creating player:', error);
        // Fallback to a cylinder if model fails to load
        const playerGeometry = new THREE.CylinderGeometry(2, 2, 8, 8);
        const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        const fallbackPlayer = new THREE.Mesh(playerGeometry, playerMaterial);
        fallbackPlayer.position.y = 4;
        player.add(fallbackPlayer);
        scene.add(player);

        // Even on fallback, signal readiness so the game can proceed
        try { onReady && onReady(); } catch (_) {}
    });
    
    return player;
}


/**
 * Updates the player's state every frame.
 * This includes movement, animation, camera, and lighting updates.
 */
export function updatePlayer(player, keys, camera, light, throttledSetPlayerPosition, objectGrid, delta, joystick, zoom, cameraOrbitRef, cameraPitchRef, firstPersonRef) {
    if (!player.userData.model) {
        // Model not loaded yet, do nothing.
        return;
    }

    // Ensure model visibility matches camera mode (hide body in first-person)
    if (player.userData.model) {
        const fpv = !!(firstPersonRef && firstPersonRef.current);
        player.userData.model.visible = !fpv;
    }

    // First, determine camera yaw/pitch for movement controls
    const yaw = (cameraOrbitRef && typeof cameraOrbitRef.current === 'number') ? cameraOrbitRef.current : 0;
    const pitchRaw = (cameraPitchRef && typeof cameraPitchRef.current === 'number') ? cameraPitchRef.current : 0;
    const isFirstPerson = !!(firstPersonRef && firstPersonRef.current);

    // Pass objectGrid and camera orientation to movement for camera-relative controls
    updatePlayerMovement(player, keys, joystick, delta, objectGrid, yaw, pitchRaw, isFirstPerson);
    
    // Update animation mixer
    if (player.userData.mixer) {
        player.userData.mixer.update(delta);
    }

    // Constrain player to world bounds
    const worldBounds = WORLD_SIZE / 2 - 10;
    player.position.x = Math.max(-worldBounds, Math.min(worldBounds, player.position.x));
    player.position.z = Math.max(-worldBounds, Math.min(worldBounds, player.position.z));

    const playerPosition = player.position;

    // Camera follow with yaw and pitch
    const baseY = 50;
    const baseR = 50;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    // pitchRaw computed above
    const pitch = clamp(pitchRaw, -0.9, 0.9);

    if (isFirstPerson) {
        // First-person: place camera at player's head and look forward based on yaw/pitch
        const headHeight = 7.5; // approximate eye height for our scaled model
        const eyePos = new THREE.Vector3(playerPosition.x, playerPosition.y + headHeight, playerPosition.z);

        // Forward vector from yaw/pitch
        const cp = Math.cos(pitch);
        const sp = Math.sin(pitch);
        const sx = Math.sin(yaw);
        const cx = Math.cos(yaw);

        const dir = new THREE.Vector3(sx * cp, sp, cx * cp);
        const lookTarget = new THREE.Vector3().copy(eyePos).add(dir.multiplyScalar(10));

        camera.position.copy(eyePos);
        camera.lookAt(lookTarget);
    } else {
        // Third-person (existing behavior)
        const r = baseR * zoom;
        const elev = 0.4 + pitch;
        const cosE = Math.cos(elev);
        const sinE = Math.sin(elev);

        const offX = Math.sin(yaw) * r * cosE;
        const offZ = Math.cos(yaw) * r * cosE;
        const offY = baseY * zoom + r * sinE;

        const cameraOffset = new THREE.Vector3(offX, offY, offZ);
        camera.position.copy(playerPosition).add(cameraOffset);
        camera.lookAt(playerPosition);
    }
    
    // Update light and shadows
    if (light) {
        // The light's shadow camera should follow the player's position
        // to ensure shadows are always rendered around the player.
        light.position.copy(playerPosition).add(new THREE.Vector3(30, 80, 40));
        light.target.position.copy(playerPosition);
        light.target.updateMatrixWorld();

        // Dynamically enable/disable shadow casting for objects based on distance.
        if (playerPosition.distanceTo(lastLightUpdatePosition) > 15) {
            const shadowCastDistance = 300;
            const maxShadowCasters = 20;
            
            const nearbyObjects = objectGrid.getObjectsNear(playerPosition, shadowCastDistance);

            nearbyObjects.sort((a, b) => a.position.distanceToSquared(playerPosition) - b.position.distanceToSquared(playerPosition));

            const newShadowCasters = new Set();
            for (let i = 0; i < Math.min(nearbyObjects.length, maxShadowCasters); i++) {
                newShadowCasters.add(nearbyObjects[i]);
            }

            // Turn off shadows for objects that are no longer in the new set.
            shadowCastingObjects.forEach(obj => {
                if (!newShadowCasters.has(obj) && obj.isLOD && obj.children[0]) {
                    // Support both Mesh and Group as LOD level-0
                    const target = obj.children[0];
                    const setCastShadowRecursive = (node, value) => {
                        if (node.isMesh) node.castShadow = value;
                        if (node.children) node.children.forEach(c => setCastShadowRecursive(c, value));
                    };
                    setCastShadowRecursive(target, false);
                }
            });

            // Turn on shadows for new objects in the set.
            newShadowCasters.forEach(obj => {
                if (obj.isLOD && obj.children[0]) {
                    const target = obj.children[0];
                    const setCastShadowRecursive = (node, value) => {
                        if (node.isMesh) node.castShadow = value;
                        if (node.children) node.children.forEach(c => setCastShadowRecursive(c, value));
                    };
                    // Only flip on if at least one child mesh is not casting yet (cheap check)
                    setCastShadowRecursive(target, true);
                }
            });
            
            shadowCastingObjects = newShadowCasters;
            lastLightUpdatePosition.copy(playerPosition);
        }
    }

    if (player.userData.movedLastFrame) {
        // Use throttled function to update React state, reducing re-renders
        throttledSetPlayerPosition({
            x: Math.round(playerPosition.x),
            z: Math.round(playerPosition.z)
        });
    }
}