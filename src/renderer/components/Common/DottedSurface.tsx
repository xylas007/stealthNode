import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useAppStore } from '../../store/appStore'

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const { theme } = useAppStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    particles: THREE.Points[]
    animationId: number
    count: number
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const SEPARATION = 150
    const AMOUNTX = 40
    const AMOUNTY = 60

    // Scene setup
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0xffffff, 2000, 10000)

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000
    )
    camera.position.set(0, 355, 1220)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(scene.fog.color, 0)

    containerRef.current.appendChild(renderer.domElement)

    // Create particles
    const particles: THREE.Points[] = []
    const positions: number[] = []
    const colors: number[] = []

    // Create geometry for all particles
    const geometry = new THREE.BufferGeometry()

    const isDark = theme?.isDark !== false

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2
        const y = 0 // Will be animated
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2

        positions.push(x, y, z)
        if (isDark) {
          colors.push(200 / 255, 200 / 255, 200 / 255)
        } else {
          colors.push(0, 0, 0)
        }
      }
    }

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    )
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    // Create material
    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: 0.25, // Subtle and elegant background opacity
      sizeAttenuation: true,
    })

    // Create points object
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    let count = 0
    let animationId = 0

    // Animation function
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // PAUSE RENDER LOOP IF HIDDEN TO SAVE CPU
      if (document.hidden) return

      const positionAttribute = geometry.attributes.position
      const positions = positionAttribute.array as Float32Array

      let i = 0
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const index = i * 3

          // Animate Y position with sine waves
          positions[index + 1] =
            Math.sin((ix + count) * 0.3) * 50 +
            Math.sin((iy + count) * 0.5) * 50

          i++
        }
      }

      positionAttribute.needsUpdate = true

      renderer.render(scene, camera)
      count += 0.05 // Smoother, slower wave speed for calm ambiance
    }

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Delay start slightly to prevent startup lag
    setTimeout(() => {
      if (containerRef.current) animate()
    }, 150)

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      particles: [points],
      animationId,
      count,
    }

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize)

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)

        // Clean up Three.js objects
        sceneRef.current.scene.traverse((object) => {
          if (object instanceof THREE.Points) {
            object.geometry.dispose()
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        })

        sceneRef.current.renderer.dispose()

        if (containerRef.current && sceneRef.current.renderer.domElement) {
          containerRef.current.removeChild(
            sceneRef.current.renderer.domElement
          )
        }
      }
    }
  }, [theme])

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none fixed inset-0 -z-10', className)}
      style={{ overflow: 'hidden' }}
      {...props}
    />
  )
}
