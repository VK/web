import * as THREE from 'three'
import { useState, useRef, Suspense, useMemo, useEffect } from 'react'
import { Canvas, useThree, useFrame, useLoader } from '@react-three/fiber'
import { Reflector, CameraShake, OrbitControls, useTexture, fog } from '@react-three/drei'
import { KernelSize } from 'postprocessing'
import { EffectComposer, Bloom, Glitch, Outline, SSAO, DepthOfField, GodRays } from '@react-three/postprocessing'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'
import { TextureLoader } from 'three'
import { BlendFunction } from 'postprocessing'

import {/* webpackMode: "lazy-once", webpackChunkName: "media", webpackPrefetch: true */ default as colorImage } from './img/Ice001_1K_Color.jpg'
import {/*  webpackIgnore: true */ default as normalImage } from './img/Ice001_1K_NormalDX.jpg'

import { default as frameSVG } from '-!file-loader!./img/frame.svg'

import { default as kSVG } from '-!file-loader!./img/K.svg'
import { default as vSVG } from '-!file-loader!!./img/V.svg'
import { default as urlSVG } from '-!file-loader!./img/url.svg'



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
  useFrame((_) => (ref.current.position.y = -1.75 + Math.sin(_.clock.elapsedTime * 0.2 + r) / 40))

  const { paths: [path] } = useLoader(SVGLoader, frameSVG) // prettier-ignore
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

  useFrame((_) => (ref.current.position.y = -1.75 + Math.sin(_.clock.elapsedTime * 1.2 * sc + r) / 60))

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
    camera.position.lerp(vec.set(mouse.x * .5, -.4, 3.5), 0.05)
    ref.current.position.lerp(vec.set(mouse.x * .02, mouse.y * 0.02, 0), 0.1)
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, (-mouse.x * Math.PI) / 10, 0.1)
  })
  return <group ref={ref}>{children}</group>
}

function Ground({ dark, ...props }) {
  //const [floor, normal] = useTexture(['/web/Ice001_1K_Color.jpg', '/web/Ice001_1K_NormalDX.jpg'])
  const [floor, normal] = useLoader(TextureLoader, [colorImage, normalImage])

  return (
    <Reflector resolution={1024} args={[12, 80]} {...props}>
      {(Material, props) => <Material color={(dark) ? "#ddd" : "#fff"} metalness={(dark) ? .2 : 0} roughnessMap={floor} roughness={0.2} normalMap={normal} normalScale={[.2, .2]} {...props} />}
    </Reflector>
  )
}

const useThemeDetector = () => {
  const app = document.getElementById("app");

  const [isDarkTheme, setIsDarkTheme] = useState(app.classList.contains("theme--dark"));

  function callback(mutationsList, observer) {

    mutationsList.forEach( (mutation) => {

      if(mutation.type === "attributes") {
        setIsDarkTheme(mutation.target.classList.contains("theme--dark"));
        
      }
    });
    
  }
  const mutationObserver = new MutationObserver(callback);
  mutationObserver.observe(app, { attributes: true } );
  
  return isDarkTheme;
}


export default function App() {

  const dark = useThemeDetector();

  console.log(dark);

  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 120, position: [0, -1, 15] }}>
      <color attach="background" args={[(dark) ? "#000" : "#fff"]} />


      <ambientLight intensity={(dark) ? 0.9 : 1.9} />
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      <Suspense fallback={null}>

        <Rig>
          <MyFrame color={(dark) ? "#00c2ba" : "#00c2ba"} scale={0.008} position={[-1.55, 1.3, -.1]} rotation={[0, 0, 0]} />

          <MySvg filename={vSVG} color="#ff26ba" scale={0.0060} position={[-1.92, 1.52, -.12]} rotation={[0, 0.05, -0.015]} />
          <MySvg filename={kSVG} color="#ff26ba" scale={0.0060} position={[-0.22, 1.49, -0.2]} rotation={[0, -0.1, -.02]} />
          <MySvg filename={urlSVG} color={(dark) ? "#fff" : "#000"} scale={0.0008} position={[-0.7, 1.05, 1.6]} rotation={[0, 0, 0]} />
          <Ground dark={dark} mirror={1.0} blur={[500, 500]} mixBlur={20} mixStrength={0.9} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position-y={-0.8} />
        </Rig>
        {dark && <EffectComposer multisampling={10}>
          <Bloom kernelSize={1} luminanceThreshold={0} luminanceSmoothing={0.4} intensity={0.7} />
          <Bloom kernelSize={4} luminanceThreshold={0} luminanceSmoothing={0.4} intensity={0.4} />
          <Bloom kernelSize={KernelSize.HUGE} luminanceThreshold={0} luminanceSmoothing={0} intensity={.5} />
        </EffectComposer>}

        {!dark && <EffectComposer>

          <Bloom kernelSize={1} blendFunction={BlendFunction.OVERLAY} luminanceThreshold={0.1} intensity={0.6} opacity={0.1} />
          <Bloom kernelSize={3} blendFunction={BlendFunction.DARKEN} luminanceThreshold={0.1} intensity={1.1} opacity={0.9} />
          <Bloom kernelSize={KernelSize.HUGE} blendFunction={BlendFunction.DARKEN} luminanceThreshold={0.1} intensity={1.2} opacity={1.5} />

        </EffectComposer>}

      </Suspense>
      <CameraShake yawFrequency={0.2} pitchFrequency={0.2} rollFrequency={0.2} maxRoll={0.02} maxPitch={0.05} maxYaw={0.05} />
      {(!dark) && <fog attach="fog" args={['white', 2.9, 9]} />}
    </Canvas>
  )
}
