// SPDX-License-Identifier: AGPL-3.0-only
/** The word lists the objective preview reads a goal by: shared by the lesson scorer and the knowledge-model resolver. */

export const STOP = new Set(
  (
    'a an the and or but of in on at to for from by with without about as is are was were be been being it its this that these those ' +
    'i me my we our us you your they their he she him her what which who whom how why when where can could should would will shall may might must do does did ' +
    'want wants wanted need needs able get gets make makes use uses using like just also more most some any all each very so if then than into over under ' +
    'learn learning understand know knowing build builds help helps new one two three first next ' +
    'review design plan prepare create explain brief explore study cover covers covering'
  ).split(' ')
)

/** Words that name the whole subject: a goal made only of these is too broad to map. */
export const BROAD = new Set(
  (
    'pqc post quantum cryptography cryptographic crypto security secure cyber cybersecurity everything anything general overview ' +
    'introduction intro basics basic fundamentals topic topics stuff things safe resistant postquantum quantumsafe'
  ).split(' ')
)

export function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}
