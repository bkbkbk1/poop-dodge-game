import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const GAME_CONFIG = {
  // 화면 크기
  SCREEN_WIDTH: width,
  SCREEN_HEIGHT: height,

  // 플레이어 설정
  PLAYER_WIDTH: 50,
  PLAYER_HEIGHT: 50,
  PLAYER_SPEED: 15,

  // 똥 설정
  POOP_WIDTH: 40,
  POOP_HEIGHT: 40,
  POOP_INITIAL_SPEED: 5,
  POOP_SPEED_INCREMENT: 0.5, // 시간에 따른 속도 증가
  POOP_SPAWN_INTERVAL: 800, // ms

  // 코인 설정
  COIN_WIDTH: 30,
  COIN_HEIGHT: 30,
  COIN_SPEED: 4,
  COIN_SPAWN_INTERVAL: 2000, // ms
  COIN_POINTS: 10,

  // 게임 설정
  INITIAL_LIVES: 3,
  SURVIVAL_POINTS_PER_SECOND: 1,

  // 게임 영역
  GAME_AREA_TOP: 100,
  GAME_AREA_BOTTOM: height - 100,
};

export const COLORS = {
  background: '#87CEEB', // 하늘색 배경
  ground: '#8B4513', // 갈색 땅
  player: '#FFD700', // 금색 플레이어
  poop: '#8B4513', // 갈색 똥
  coin: '#FFD700', // 금색 코인
  text: '#FFFFFF',
  scoreBoard: 'rgba(0, 0, 0, 0.7)',
};
