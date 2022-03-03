import * as THREE from 'three'
import { useState, useRef, Suspense, useMemo } from 'react'
import { Canvas, useThree, useFrame, useLoader } from '@react-three/fiber'
import { Reflector, CameraShake, OrbitControls, useTexture } from '@react-three/drei'
import { KernelSize } from 'postprocessing'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'


const SvgShape = ({ shape, color, ...props }) => {

  return (<mesh {...props}>
    <meshBasicMaterial
      color={color}
      toneMapped={false}
    />
    <shapeBufferGeometry attach="geometry" args={[shape]} />
  </mesh>);
}


function MyFrame({ color, ...props }) {
  const ref = useRef()
  const [r] = useState(() => Math.random() * 10000)
  useFrame((_) => (ref.current.position.y = -1.75 + Math.sin(_.clock.elapsedTime*0.2 + r) / 40))
  const { paths: [path] } = useLoader(SVGLoader, '/web/frame.svg') // prettier-ignore
  const geom = useMemo(() => SVGLoader.pointsToStroke(path.subPaths[0].getPoints(), path.userData.style), [])
  return (
    <group ref={ref}>
      <mesh geometry={geom} {...props}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}

function MySvg({ filename, ...config }) {
  const ref = useRef()
  const [r] = useState(() => Math.random() * 1000)
  const [sc] = useState(() => 1.5 + Math.random() * .75)

  useFrame((_) => (ref.current.position.y = -1.75 + Math.sin(_.clock.elapsedTime*0.2  * sc + r) /60))

  const { paths } = useLoader(SVGLoader, filename)
  const shapes = useMemo(
    () =>
      paths.flatMap((path, index) =>
        path.toShapes(true).map(shape => ({ index, shape, color: path.color }))
      ),
    [paths]
  )

  return (
    <group ref={ref}

      children={shapes.map((props, key) => (
        <SvgShape key={key} {...props} {...config} />
      ))}
    >
    </group>
  )
}



function Rig({ children }) {
  const ref = useRef()
  const vec = new THREE.Vector3()
  const { camera, mouse } = useThree()
  useFrame(() => {
    camera.position.lerp(vec.set(mouse.x * 2, 0, 3.5), 0.05)
    ref.current.position.lerp(vec.set(mouse.x * 1, mouse.y * 0.1, 0), 0.1)
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, (-mouse.x * Math.PI) / 20, 0.1)
  })
  return <group ref={ref}>{children}</group>
}

function Ground(props) {
  const [floor, normal] = useTexture(['/web/Ice001_1K_Color.jpg', '/web/Ice001_1K_NormalDX.jpg'])
  return (
    <Reflector resolution={1024} args={[13, 13]} {...props}>
      {(Material, props) => <Material color="#ccc" metalness={0} roughnessMap={floor} roughness={0.2} normalMap={normal} normalScale={[.2, .2]} {...props} />}
    </Reflector>
  )
}

export default function App() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{fov: 115, position: [0, 0, 15] }}>
      <color attach="background" args={['black']} />
      <ambientLight intensity={.9} />
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      <Suspense fallback={null}>
        <Rig>
          <MyFrame color="#00c2ba" scale={0.008} position={[-1.75, 1.3, -.1]} rotation={[0, 0, 0]} />

          <MySvg filename="/web/V.svg" color="#ff26ba" scale={0.0060} position={[-2.2, 1.49, -.12]} rotation={[0, 0.05, -0.01]} />
          <MySvg filename="/web/K.svg" color="#ff26ba" scale={0.0060} position={[-0.4, 1.45, -0.2]} rotation={[0, -0.1, -.02]} />
          <MySvg filename="/web/url.svg" color="#ffffff" scale={0.0008} position={[-0.9, 1.1, 1.2]} rotation={[0, 0, 0]} />
          <Ground mirror={1.0} blur={[1000, 100]} mixBlur={20} mixStrength={0.7} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position-y={-0.8} />
        </Rig>
        <EffectComposer multisampling={10}>
          <Bloom kernelSize={1} luminanceThreshold={0} luminanceSmoothing={0.4} intensity={0.7} />
          <Bloom kernelSize={4} luminanceThreshold={0} luminanceSmoothing={0.4} intensity={0.7} />
          <Bloom kernelSize={KernelSize.HUGE} luminanceThreshold={0} luminanceSmoothing={0} intensity={.5} />
        </EffectComposer>
      </Suspense>
      <CameraShake yawFrequency={0.02} pitchFrequency={0.02} rollFrequency={0.02} />
    </Canvas>
  )
}
