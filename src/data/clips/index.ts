// ── Curated clip library ──────────────────────────────────────────────
// These video clips power BOTH the Listening step (train your ear) and the
// Shadowing step (speak along with the full script).
//
// Each clip needs a real, working YouTube video id and an accurate transcript.
// The seed set below reuses transcripts already verified in this repo so the
// videos are guaranteed to embed and the scripts are accurate.
//
// TO ADD MORE (toward 30): append objects to EXTRA_CLIPS at the bottom. For
// each one paste the 11-character YouTube id (the `v=...` part of the URL) and
// the transcript as an array of lines. No timestamps or syncing required.
// ──────────────────────────────────────────────────────────────────────

import simonSinek from '@/data/scripts/simon-sinek-ted.json'
import steveJobs from '@/data/scripts/steve-jobs-stanford.json'
import breneBrown from '@/data/scripts/brene-brown-vulnerability.json'
import obama from '@/data/scripts/obama-yes-we-can.json'
import mcConaughey from '@/data/scripts/matthew-mcconaughey-oscar.json'
import type { TimedSentence } from '@/data/scripts/index'

// How fast / natural the speech is — pick harder ones as your ear improves.
export type ClipPace = 'clear' | 'native' | 'fast'

export interface Clip {
  id: string
  title: string
  source: string
  youtube_id: string
  accent: string
  pace: ClipPace
  transcript: string[]
}

export const PACE_META: Record<ClipPace, { label: string; hint: string }> = {
  clear: { label: 'Clear', hint: 'Slow, well-articulated — easiest to follow' },
  native: { label: 'Natural', hint: 'Real conversational rhythm' },
  fast: { label: 'Fast / Native', hint: 'Quick, connected speech — most challenging' },
}

type SeedScript = { id: string; title: string; youtube_id?: string; sentences: (string | TimedSentence)[] }

function fromScript(
  s: SeedScript,
  meta: { source: string; accent: string; pace: ClipPace }
): Clip {
  return {
    id: s.id,
    title: s.title,
    source: meta.source,
    youtube_id: s.youtube_id!,
    accent: meta.accent,
    pace: meta.pace,
    transcript: s.sentences.map((x) => (typeof x === 'string' ? x : x.text)),
  }
}

// Verified, working videos with accurate transcripts.
const SEED_CLIPS: Clip[] = [
  fromScript(mcConaughey as SeedScript, { source: 'Oscars 2014', accent: 'American (Texan)', pace: 'fast' }),
  fromScript(breneBrown as SeedScript, { source: 'TEDx Houston', accent: 'American', pace: 'native' }),
  fromScript(obama as SeedScript, { source: 'Campaign Speech', accent: 'American', pace: 'native' }),
  fromScript(simonSinek as SeedScript, { source: 'TEDx Puget Sound', accent: 'British/American', pace: 'clear' }),
  fromScript(steveJobs as SeedScript, { source: 'Stanford Commencement', accent: 'American', pace: 'clear' }),
]

// ── Add your own daily-life / TV / drama clips here ─────────────────────
// Template:
// {
//   id: 'unique-slug',
//   title: 'Friends — Coffee shop scene',
//   source: 'Friends S01E01',
//   youtube_id: 'XXXXXXXXXXX',          // the 11-char id from the YouTube URL
//   accent: 'American',
//   pace: 'fast',                        // 'clear' | 'native' | 'fast'
//   transcript: [
//     'First line of what is said.',
//     'Second line...',
//   ],
// },
// Classic movie scenes — great for both ear-training and shadowing.
// Every youtube_id below was verified to be live and embeddable.
const EXTRA_CLIPS: Clip[] = [
  {
    id: 'forrest-gump-chocolates',
    title: 'Forrest Gump — "Life is like a box of chocolates"',
    source: 'Forrest Gump (1994)',
    youtube_id: 'SqOnkiQRCUU',
    accent: 'American (Southern)',
    pace: 'native',
    transcript: [
      "Hello. My name's Forrest. Forrest Gump.",
      'Do you want a chocolate?',
      'I could eat about a million and a half of these.',
      'My mama always said life was like a box of chocolates.',
      "You never know what you're gonna get.",
      'Those must be comfortable shoes.',
      "I bet you could walk all day in shoes like that and not feel a thing.",
      'I wish I had shoes like that.',
      'My feet hurt.',
      'Mama always said there\u2019s an awful lot you can tell about a person by their shoes \u2014 where they\u2019re going, where they\u2019ve been.',
      "I've worn lots of shoes.",
      'I bet if I think about it real hard, I could remember my first pair of shoes.',
      'Mama said they\u2019d take me anywhere.',
      'She said they was my magic shoes.',
    ],
  },
  {
    id: 'pursuit-happyness-dream',
    title: 'The Pursuit of Happyness — "Protect your dream"',
    source: 'The Pursuit of Happyness (2006)',
    youtube_id: 'UZb2NOHPA2A',
    accent: 'American',
    pace: 'native',
    transcript: [
      "All right. Go ahead and take the shot. Don't fall in love with the ball, though.",
      "I'm going pro!",
      'Okay.',
      "Well, you\u2019ll probably be about as good as I was. That\u2019s kind of the thing, you know?",
      'I was below average, you know, so you\u2019ll probably ultimately rank somewhere around there.',
      "You'll excel at a lot of things, just not this.",
      "I don't want you shooting this ball all day and night, all right?",
      'Hey. Don\u2019t ever let somebody tell you you can\u2019t do something. Not even me. All right?',
      'You got a dream, you gotta protect it.',
      "People can't do somethin' themselves, they wanna tell you you can't do it.",
      'If you want something, go get it. Period.',
      'All right? Come on. Let\u2019s go.',
    ],
  },
  {
    id: 'dead-poets-carpe-diem',
    title: 'Dead Poets Society — "Carpe diem"',
    source: 'Dead Poets Society (1989)',
    youtube_id: 'vi0Lbjs5ECI',
    accent: 'American',
    pace: 'clear',
    transcript: [
      'The Latin term for that sentiment is carpe diem.',
      'Now, who knows what that means?',
      'Carpe diem. That\u2019s "seize the day."',
      'Now I would like you to step forward over here and peruse some of the faces from the past.',
      "You've walked past them many times, but I don't think you've really looked at them.",
      'They\u2019re not that different from you, are they?',
      'Same haircuts. Full of hormones, just like you.',
      'Invincible, just like you feel.',
      'The world is their oyster. They believe they\u2019re destined for great things, just like many of you.',
      'Their eyes are full of hope, just like yours.',
      'Did they wait until it was too late to make from their lives even one iota of what they were capable?',
      'Because, you see, gentlemen, these boys are now fertilizing daffodils.',
      'But if you listen real close, you can hear them whisper their legacy to you.',
      'Go on, lean in. Listen. You hear it?',
      'Carpe. Carpe diem.',
      'Seize the day, boys. Make your lives extraordinary.',
    ],
  },
  {
    id: 'devil-wears-prada-cerulean',
    title: 'The Devil Wears Prada — The cerulean monologue',
    source: 'The Devil Wears Prada (2006)',
    youtube_id: 'Ja2fgquYTCg',
    accent: 'American',
    pace: 'fast',
    transcript: [
      'Something funny?',
      "No. No, no. Nothing's... You know, it's just that both those belts look exactly the same to me.",
      "I'm still learning about all this stuff.",
      "This... stuff? Oh, okay. I see.",
      'You think this has nothing to do with you.',
      'You go to your closet, and you select, I don\u2019t know, that lumpy blue sweater, for instance,',
      'because you\u2019re trying to tell the world that you take yourself too seriously to care about what you put on your back.',
      'But what you don\u2019t know is that that sweater is not just blue.',
      'It\u2019s not turquoise. It\u2019s not lapis. It\u2019s actually cerulean.',
      'And you\u2019re also blithely unaware of the fact that in 2002, Oscar de la Renta did a collection of cerulean gowns.',
      'And then I think it was Yves Saint Laurent, wasn\u2019t it, who showed cerulean military jackets?',
      'And then cerulean quickly showed up in the collections of eight different designers.',
      'And then it filtered down through the department stores and then trickled on down into some tragic Casual Corner,',
      'where you, no doubt, fished it out of some clearance bin.',
      'However, that blue represents millions of dollars and countless jobs,',
      'and it\u2019s sort of comical how you think that you\u2019ve made a choice that exempts you from the fashion industry,',
      'when, in fact, you\u2019re wearing a sweater that was selected for you by the people in this room from a pile of stuff.',
    ],
  },
  {
    id: 'shawshank-rehabilitated',
    title: 'The Shawshank Redemption — "Rehabilitated?"',
    source: 'The Shawshank Redemption (1994)',
    youtube_id: 'cGo5rXUAH2o',
    accent: 'American',
    pace: 'native',
    transcript: [
      'Ellis Boyd Redding, your files say you\u2019ve served forty years of a life sentence.',
      'You feel you\u2019ve been rehabilitated?',
      "Rehabilitated? Well, now, let me see. You know, I don't have any idea what that means.",
      'I know what you think it means, sonny.',
      "To me, it's just a made-up word, a politician's word,",
      'so that young fellas like yourself can wear a suit and a tie and have a job.',
      'What do you really want to know? Am I sorry for what I did?',
      "There's not a day goes by I don't feel regret.",
      'Not because I\u2019m in here, or because you think I should.',
      'I look back on the way I was then \u2014 a young, stupid kid who committed that terrible crime.',
      'I want to talk to him. I want to try to talk some sense to him, tell him the way things are.',
      "But I can't. That kid's long gone, and this old man is all that's left.",
      'I gotta live with that.',
      'Rehabilitated? It\u2019s just a bullshit word.',
      'So you go on and stamp your forms, sonny, and stop wasting my time.',
      'Because, to tell you the truth, I don\u2019t give a shit.',
    ],
  },
  {
    id: 'good-will-hunting-not-your-fault',
    title: 'Good Will Hunting — "It\u2019s not your fault"',
    source: 'Good Will Hunting (1997)',
    youtube_id: 'ZQht2yOX9Js',
    accent: 'American (Boston)',
    pace: 'native',
    transcript: [
      "I don't know a lot, Will, but you see this? All this? It\u2019s not your fault.",
      'Yeah, I know.',
      'No. It\u2019s not your fault.',
      'I know.',
      'It\u2019s not your fault.',
      'I know.',
      "No, no, you don't. It\u2019s not your fault.",
      'I know.',
      'It\u2019s not your fault.',
      'All right.',
      'It\u2019s not your fault.',
      "Don't mess with me.",
      'It\u2019s not your fault.',
      'It\u2019s not your fault.',
      "I'm so sorry.",
    ],
  },
  {
    id: 'any-given-sunday-inches',
    title: 'Any Given Sunday — "Game of inches"',
    source: 'Any Given Sunday (1999)',
    youtube_id: 'isr4-tsfhsg',
    accent: 'American',
    pace: 'fast',
    transcript: [
      "I don't know what to say, really.",
      'Three minutes to the biggest battle of our professional lives, all comes down to today.',
      "Now, either we heal as a team, or we're gonna crumble.",
      "Inch by inch, play by play, till we're finished.",
      "We're in hell right now, gentlemen, believe me.",
      'And we can stay here, get the shit kicked out of us, or we can fight our way back into the light.',
      'We can climb out of hell one inch at a time.',
      "Now, I can't do it for you. I'm too old.",
      'I look around, I see these young faces, and I think \u2014 I mean, I\u2019ve made every wrong choice a middle-aged man can make.',
      "You find out life's this game of inches. So is football.",
      'Because in either game \u2014 life or football \u2014 the margin for error is so small.',
      "One half a step too late or too early, and you don't quite make it.",
      "One half second too slow, too fast, and you don't quite catch it.",
      'The inches we need are everywhere around us.',
      "They're in every break of the game, every minute, every second.",
      'On this team, we fight for that inch.',
      'On this team, we tear ourselves and everyone else around us to pieces for that inch.',
      'We claw with our fingernails for that inch,',
      'because we know when we add up all those inches, that\u2019s gonna make the difference between winning and losing,',
      'between living and dying.',
      "In any fight, it's the guy who's willing to die who's gonna win that inch.",
    ],
  },
  {
    id: 'godfather-offer',
    title: 'The Godfather — "An offer he can\u2019t refuse"',
    source: 'The Godfather (1972)',
    youtube_id: 'D6me2-OurCw',
    accent: 'American (Italian-American)',
    pace: 'native',
    transcript: [
      'You look terrible. I want you to eat. I want you to rest well.',
      "And a month from now, this Hollywood big shot's gonna give you what you want.",
      'Too late. They start shooting in a week.',
      "I'm gonna make him an offer he can't refuse.",
      'You spend time with your family?',
      'Sure I do.',
      "Good. Because a man who doesn't spend time with his family can never be a real man.",
      'You just go outside and enjoy yourself, and forget about all this nonsense.',
      'I want you to leave it all to me.',
    ],
  },
  {
    id: 'whiplash-my-tempo',
    title: 'Whiplash — "Not quite my tempo"',
    source: 'Whiplash (2014)',
    youtube_id: 'ZQ_6VUs2VCk',
    accent: 'American',
    pace: 'fast',
    transcript: [
      'Not quite my tempo.',
      'Five, six, seven \u2014 here we go.',
      'Not quite my tempo.',
      'Were you rushing, or were you dragging?',
      "I don't know.",
      'Start playing.',
      'Were you rushing, or were you dragging?',
      "I don't know.",
      'Now, was I rushing, or was I dragging?',
      "Rushing.",
      "So you do know the difference.",
      'Here we go. Five, six, and\u2026',
      "You're rushing.",
      'Here we go.',
      'Dragging, just a hair.',
      'Not quite my tempo.',
    ],
  },
  {
    id: 'social-network-opening',
    title: 'The Social Network — Opening scene',
    source: 'The Social Network (2010)',
    youtube_id: 'VUFqhChmHCc',
    accent: 'American',
    pace: 'fast',
    transcript: [
      'Did you know there are more people with genius IQs living in China than there are people of any kind living in the United States?',
      "That can't possibly be true.",
      'It is.',
      'What would account for that?',
      'Well, first, an awful lot of people live in China.',
      "But here's my question: How do you distinguish yourself in a population of people who all got 1600 on their SATs?",
      "I didn't know they take SATs in China.",
      "They don't. I wasn't talking about China anymore, I was talking about me.",
      'You got 1600?',
      'I could sing in an a cappella group, but I can\u2019t sing.',
      'Does that mean you actually got nothing wrong?',
      'I can row crew, or invent a twenty-five-dollar PC.',
      'Or you can get into a final club.',
      'Or I can get into a final club.',
      "Mark, I'm trying to have a conversation.",
      'I am too.',
      "Sometimes you say two things at once and I'm not sure which one I'm supposed to be aiming at.",
      "You don't have to study.",
      "How do you know I don't have to study?",
      'Because you go to BU.',
      'Dating you is like dating a StairMaster.',
    ],
  },
]

export const ALL_CLIPS: Clip[] = [...SEED_CLIPS, ...EXTRA_CLIPS]

export function getClip(id: string): Clip | undefined {
  return ALL_CLIPS.find((c) => c.id === id)
}
