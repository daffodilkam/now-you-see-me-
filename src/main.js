import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 8);

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const vidaTxt = document.getElementById('vida');
const estadoTxt = document.getElementById('estado');
vidaTxt.style.color = "white";
estadoTxt.style.color = "white";

const textureLoader = new THREE.TextureLoader();
const forestTexture = textureLoader.load('/textures/floor.jpg');
forestTexture.wrapS = THREE.RepeatWrapping;
forestTexture.wrapT = THREE.RepeatWrapping;
forestTexture.repeat.set(8, 8);

const sueloGeo = new THREE.PlaneGeometry(200, 200);
const sueloMat = new THREE.MeshStandardMaterial({ map: forestTexture });
const suelo = new THREE.Mesh(sueloGeo, sueloMat);
suelo.rotation.x = -Math.PI / 2;
scene.add(suelo);

let vida = 100;
let jugador, cabaña;
let ojos = [];
let juegoIniciado = false;

let mixer;
const clock = new THREE.Clock();
const loader = new GLTFLoader();

function ajustarModelo(modelo, tamañoObjetivo = 2) {
  const box = new THREE.Box3().setFromObject(modelo);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const escala = tamañoObjetivo / maxDim;
  modelo.scale.set(escala, escala, escala);
  box.setFromObject(modelo);
  const center = new THREE.Vector3();
  box.getCenter(center);
  modelo.position.sub(center);
  modelo.position.y = 0;
}

loader.load('/models/dogfinal.glb',
  (gltf) => {
    jugador = gltf.scene;
    ajustarModelo(jugador, 2);
    jugador.position.set(0, 0.5, 5);
    jugador.rotation.y = Math.PI;
    scene.add(jugador);

    if (gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(jugador);
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
    }
  }
);

loader.load('/models/medieval_house.glb',
  (gltf) => {
    cabaña = gltf.scene;
    ajustarModelo(cabaña, 10);
    cabaña.position.set(0, 0, -80);
    scene.add(cabaña);
  }
);

function spawnOjo() {
  loader.load('/models/eye_blend.glb', (gltf) => {
    const ojo = gltf.scene;
    ajustarModelo(ojo, 1.5);
    ojo.position.set(cabaña.position.x + (Math.random() - 0.5) * 10, 0, cabaña.position.z);
    ojos.push(ojo);
    scene.add(ojo);
  });
}
setInterval(() => { if (juegoIniciado) spawnOjo(); }, 3000);

const teclas = { ArrowLeft: false, ArrowRight: false };
window.addEventListener('keydown', (e) => { if (e.key in teclas) teclas[e.key] = true; });
window.addEventListener('keyup', (e) => { if (e.key in teclas) teclas[e.key] = false; });

function animate() {
  requestAnimationFrame(animate);

  if (mixer) mixer.update(clock.getDelta());

  if (juegoIniciado && jugador) {
    if (teclas.ArrowLeft) jugador.position.x -= 0.1;
    if (teclas.ArrowRight) jugador.position.x += 0.1;
  }
  ojos.forEach((ojo) => {
    if (jugador) {
      const dir = new THREE.Vector3().subVectors(jugador.position, ojo.position).normalize();
      ojo.position.addScaledVector(dir, 0.05);


      if (jugador.position.distanceTo(ojo.position) < 1.5) {
        vida = 0;
        estadoTxt.innerText = "Game Over";
        juegoIniciado = false;
      }


      if (ojo.position.z > camera.position.z + 15) {
        scene.remove(ojo);
        ojos = ojos.filter(o => o !== ojo);
      }
    }
  });

  if (cabaña && juegoIniciado) {
    cabaña.position.z += 0.01;
  }


  if (jugador && cabaña && jugador.position.distanceTo(cabaña.position) < 3) {
    estadoTxt.innerText = "¡Victoria!";
    juegoIniciado = false;
  }

  vidaTxt.innerText = "Vida: " + vida;

  renderer.render(scene, camera);
}
animate();

window.addEventListener('click', () => {
  if (!juegoIniciado) {
    juegoIniciado = true;
    estadoTxt.innerText = "Jugando...";
    vida = 100;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});