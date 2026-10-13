export const DOORS = {
  start: {
    label: 'I’m ready to start something.',
    prompt: 'What have you been waiting to begin? Give it a first sentence.',
  },
  decide: {
    label: 'I have a decision to make.',
    prompt: 'What are you deciding? Put it into words.',
  },
  letgo: {
    label: 'I’m ready to let something go.',
    prompt: 'Some sentences deserve an ending. What are you ready to leave behind?',
  },
  unknown: {
    label: 'I don’t know what comes next.',
    prompt: 'You don’t need the whole story. Start with what you know right now.',
  },
} as const;

export type DoorKey = keyof typeof DOORS;
export const DOOR_KEYS = Object.keys(DOORS) as DoorKey[];
export const isDoor = (k: unknown): k is DoorKey => typeof k === 'string' && k in DOORS;

export const GENERIC_PROMPT = 'Write the sentence that comes next.';

export const NOTE_MAX = 400;
export const NOTE_MIN = 2;
export const NAME_MAX = 40;
export const PAGE_SIZE = 30;
