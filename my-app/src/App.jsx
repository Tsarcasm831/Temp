import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function App() {
  const mountRef = useRef(null)

  useEffect(() => {
    const el = mountRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 1000)
    camera.position.set(0, 1, 3)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(renderer.domElement)

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ metalness: 0.2, roughness: 0.6 })
    )
    scene.add(cube)

    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(2, 2, 2)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0xffffff, 0.3))

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const tick = () => {
      cube.rotation.y += 0.01
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      el.removeChild(renderer.domElement)
      cube.geometry.dispose()
      cube.material.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />
}
