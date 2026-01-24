export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 두 객체가 충돌했는지 확인 (AABB 충돌 감지)
export const checkCollision = (obj1: GameObject, obj2: GameObject): boolean => {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
};

// 객체가 화면 밖으로 나갔는지 확인
export const isOutOfScreen = (obj: GameObject, screenHeight: number): boolean => {
  return obj.y > screenHeight;
};
