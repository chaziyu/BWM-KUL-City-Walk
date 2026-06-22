export const DAILY_RIDDLES = [
  { q: "My 41-meter clock tower houses a one-ton bell that first chimed for Queen Victoria's birthday. What am I?", a: '1' },
  { q: 'I was designed by A.B. Hubback to perfectly match my famous neighbor, the Sultan Abdul Samad Building.', a: '2' },
  { q: 'I am a 6-storey Art Deco building named after a famous tin tycoon, Loke Yew.', a: '3' },
  { q: "I sit at the 'muddy confluence' of two rivers, the very birthplace of Kuala Lumpur.", a: '4' },
  { q: 'My Art Deco clock tower was built in 1937 to commemorate the coronation of King George VI.', a: '5' },
  { q: "I am KL's oldest Chinese temple, and I am uniquely angled to follow Feng Shui principles.", a: '6' },
  { q: "I am an unusual triangular building with no 'five-foot way' and whimsical garlic-shaped finials on my roof.", a: '7' },
  { q: 'In 1932, I was the tallest building in KL, standing at 85 feet. I also housed Radio Malaya.', a: '9' },
  { q: 'My prayer services are held in both Arabic and Tamil, a unique feature for a mosque in this area.', a: '11' },
  { q: "I am Malaysia's oldest existing jewellers, founded by a man who was shipwrecked!", a: '12' },
  { q: "I was KL's only theatre, but I was heavily damaged by a major fire in the 1980s.", a: '13' },
];

export function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / (1000 * 60 * 60 * 24));
}

export function getDailyRiddle(day = getDayOfYear(), riddles = DAILY_RIDDLES) {
  return riddles[day % riddles.length];
}
