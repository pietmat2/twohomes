import { getISOWeek } from 'date-fns'

/**
 * Six notes on what helps children through a separation. Deliberately short
 * and practical: a parent reads this on a phone, usually at a bad moment.
 *
 * The wording lives in the message catalogues under `guide.<topic>.title`,
 * `.body` and `.tip1`–`.tip3`, so it translates like everything else.
 */
export const GUIDE_TOPICS = [
  'conflict',
  'messages',
  'handovers',
  'rules',
  'words',
  'yourself',
] as const

export type GuideTopic = (typeof GUIDE_TOPICS)[number]

/**
 * One topic a week on Today. Six principles dropped on someone at once is a
 * leaflet nobody finishes; one at a time is something they might act on.
 */
export function topicOfTheWeek(date = new Date()): GuideTopic {
  return GUIDE_TOPICS[getISOWeek(date) % GUIDE_TOPICS.length]
}
