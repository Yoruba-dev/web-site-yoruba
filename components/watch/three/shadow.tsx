"use client";

// ---------------------------------------------------------------------------
// SOMBRA DE CONTACTO horneada a petición (la técnica de ContactShadows de
// drei: profundidad vista desde el suelo hacia arriba, dos desenfoques), pero
// con un `bake()` propio: se hornea UNA vez cuando la forma cambia (al acabar
// un barrido, al cerrar la correa, al cambiar de correa) y para la foto de
// estudio, nunca en cada fotograma. Una sola instancia para toda la vida del
// lienzo (sus render targets no se recrean).
//
// Solo hacen sombra las piezas REALES: la cámara de la sombra ve la capa 0
// (el cristal está en la 1) y lo apagado (visible = false) no se pinta.
// ---------------------------------------------------------------------------
import { useEffect, useImperativeHandle, useMemo, type Ref } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { HorizontalBlurShader, VerticalBlurShader } from "three-stdlib";

export interface ShadowHandle {
  /** Hornear en el próximo fotograma. */
  request(): void;
  /** Hornear ya (la foto de estudio). */
  bakeNow(): void;
  /** Multiplica la opacidad (0 con la correa abierta). */
  setFade(f: number): void;
  setBase(opacity: number): void;
  /** (QA) El render target horneado. */
  target(): THREE.WebGLRenderTarget;
}

export function ContactShadow({
  ref,
  y,
  z,
  scale,
  far,
  blur,
  opacity,
  resolution,
}: {
  ref?: Ref<ShadowHandle>;
  y: number;
  z: number;
  scale: number;
  far: number;
  blur: number;
  opacity: number;
  resolution: number;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const r = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(resolution, resolution);
    const rtBlur = new THREE.WebGLRenderTarget(resolution, resolution);
    rt.texture.generateMipmaps = rtBlur.texture.generateMipmaps = false;
    const plane = new THREE.PlaneGeometry(scale, scale).rotateX(Math.PI / 2);
    // El plano del desenfoque, CENTRADO bajo la cámara de la sombra y a media
    // profundidad de su vista (la sombra va desplazada a z = −27: con el
    // plano en el origen, como en drei, cada pasada correría la textura
    // 27 mm hasta vaciarla).
    const blurPlane = new THREE.Mesh(plane);
    blurPlane.position.set(0, y + far / 2, z);
    const depth = new THREE.MeshDepthMaterial();
    depth.depthTest = depth.depthWrite = false;
    depth.onBeforeCompile = (shader) => {
      shader.uniforms.ucolor = { value: new THREE.Color("#000000") };
      shader.fragmentShader = shader.fragmentShader
        .replace("void main() {", "uniform vec3 ucolor;\nvoid main() {")
        .replace("vec4( vec3( 1.0 - fragCoordZ ), opacity );", "vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );");
    };
    const hBlur = new THREE.ShaderMaterial(HorizontalBlurShader);
    const vBlur = new THREE.ShaderMaterial(VerticalBlurShader);
    hBlur.depthTest = vBlur.depthTest = false;
    const group = new THREE.Group();
    group.name = "sombra";
    group.rotation.x = Math.PI / 2;
    group.position.set(0, y, z);
    const mat = new THREE.MeshBasicMaterial({ transparent: true, map: rt.texture, opacity, depthWrite: false });
    const mesh = new THREE.Mesh(plane, mat);
    mesh.scale.set(1, -1, 1);
    mesh.rotation.x = -Math.PI / 2;
    mesh.raycast = () => null;
    const cam = new THREE.OrthographicCamera(-scale / 2, scale / 2, scale / 2, -scale / 2, 0, far);
    group.add(mesh, cam);
    return { rt, rtBlur, plane, blurPlane, depth, hBlur, vBlur, group, mesh, mat, cam, base: opacity, fade: 1, pending: true };
    // Una sola vez: cambiar estos valores no recrea nada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(
    () => () => {
      [r.rt, r.rtBlur, r.plane, r.depth, r.hBlur, r.vBlur, r.mat].forEach((x) => x.dispose());
    },
    [r],
  );

  const blurPass = (amount: number) => {
    r.blurPlane.visible = true;
    r.blurPlane.material = r.hBlur;
    r.hBlur.uniforms.tDiffuse.value = r.rt.texture;
    r.hBlur.uniforms.h.value = amount / 256;
    gl.setRenderTarget(r.rtBlur);
    gl.render(r.blurPlane, r.cam);
    r.blurPlane.material = r.vBlur;
    r.vBlur.uniforms.tDiffuse.value = r.rtBlur.texture;
    r.vBlur.uniforms.v.value = amount / 256;
    gl.setRenderTarget(r.rt);
    gl.render(r.blurPlane, r.cam);
    r.blurPlane.visible = false;
  };

  const bake = () => {
    r.pending = false;
    const bg = scene.background;
    const ov = scene.overrideMaterial;
    const prevRT = gl.getRenderTarget();
    r.group.visible = false;
    scene.background = null;
    scene.overrideMaterial = r.depth;
    gl.setRenderTarget(r.rt);
    gl.clear();
    gl.render(scene, r.cam);
    blurPass(blur);
    blurPass(blur * 0.4);
    gl.setRenderTarget(prevRT);
    r.group.visible = true;
    scene.overrideMaterial = ov;
    scene.background = bg;
  };

  const apply = () => {
    r.mat.opacity = r.base * r.fade;
    r.group.visible = r.mat.opacity > 0.001;
  };

  useImperativeHandle(
    ref,
    () => ({
      request() {
        r.pending = true;
        invalidate();
      },
      bakeNow() {
        bake();
      },
      setFade(f: number) {
        if (Math.abs(r.fade - f) < 1e-4) return;
        r.fade = f;
        apply();
      },
      setBase(o: number) {
        r.base = o;
        apply();
      },
      target: () => r.rt,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [r, invalidate],
  );

  useEffect(() => {
    r.base = opacity;
    apply();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opacity]);

  // Antes del render principal (prioridad negativa: no toma el bucle).
  useFrame(() => {
    if (r.pending) bake();
  }, -2);

  return <primitive object={r.group} />;
}
