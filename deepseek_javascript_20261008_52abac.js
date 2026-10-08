import * as THREE from 'three';

export class Physics {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.raycaster = new THREE.Raycaster();
  }

  addCollider(mesh) { this.colliders.push(mesh); }

  // AABB vs AABB, centre + demi-taille pour le joueur
  checkAABB(pos, halfSize) {
    const playerBox = new THREE.Box3(
      new THREE.Vector3(pos.x - halfSize.x, pos.y, pos.z - halfSize.z),
      new THREE.Vector3(pos.x + halfSize.x, pos.y + halfSize.y, pos.z + halfSize.z)
    );
    for (const col of this.colliders) {
      const box = new THREE.Box3().setFromObject(col);
      if (box.intersectsBox(playerBox)) return true;
    }
    return false;
  }

  raycastFromCamera(camera, maxDist = 3) {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    this.raycaster.set(camera.position, dir);
    this.raycaster.far = maxDist;
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    return hits.length > 0 ? hits[0] : null;
  }

  raycastForShot(camera, maxDist, targets) {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    this.raycaster.set(camera.position, dir);
    this.raycaster.far = maxDist;
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    return hits;
  }
}