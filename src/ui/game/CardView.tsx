// Une carte de jeu, selon son mode. La réponse ne s'affiche qu'une fois la carte retournée.

import { useState } from 'react'
import type { Card } from '../../domain/game'
import { otherSenses } from '../../domain/modes'
import type { Box, Word } from '../../domain/types'
import { Sentence, useImageUrl } from '../common'
import { IconEye, IconRetry } from '../icons'

interface Props {
  card: Card
  word: Word
  words: Word[]
  box: Box | 0
  playerName: string
  revealed: boolean
  onReveal: () => void
  accent: string
}

export function CardView({ card, word, words, box, playerName, revealed, onReveal, accent }: Props) {
  const [picked, setPicked] = useState<number>()
  const [peek, setPeek] = useState(false)

  const chips = (
    <div className="row wrap" style={{ gap: 10 }}>
      <span className="card-chip">{word.kind === 'expression' ? `Expression · ${word.category}` : word.category}</span>
      <span className="card-chip dark">{box === 0 ? 'Nouveau' : box === 6 ? 'Acquis' : `Boîte ${box}`}</span>
      {word.partOfSpeech && <span className="card-chip">{word.partOfSpeech}</span>}
      {word.knownSense && card.mode !== 'quel-sens' && <span className="card-chip gold">Sens nouveau</span>}
      {card.retry && <span className="card-chip gold">Deuxième essai</span>}
    </div>
  )

  const revealButton = (label = 'Retourner la carte') =>
    !revealed && (
      <button className="card-btn" onClick={onReveal}>
        <IconRetry size={24} />
        {label}
      </button>
    )

  let body: React.ReactNode
  switch (card.mode) {
    case 'bon-sens':
      body = (
        <>
          <p className="card-sentence">
            <Sentence sentence={word.sentence} word={word.word} />
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {card.options!.map((opt, i) => {
              const state = revealed ? (i === card.answer ? 'good' : i === picked ? 'bad' : '') : i === picked ? 'good' : ''
              return (
                <button
                  key={i}
                  className={`option ${state}`}
                  aria-pressed={picked === i}
                  onClick={() => {
                    setPicked(i)
                    onReveal()
                  }}
                  disabled={revealed}
                >
                  <span className="letter">{'ABC'[i]}</span>
                  {opt}
                </button>
              )
            })}
          </div>
        </>
      )
      break

    case 'vrai-faux':
      body = (
        <>
          <p className="card-sentence">
            <Sentence sentence={card.shownSentence!} word={word.word} />
          </p>
          {revealed ? (
            <div className="card-answer flip">
              <span className="disp" style={{ fontSize: 28, fontWeight: 800, color: card.isTrue ? '#4d6d12' : '#b34a2f' }}>
                {card.isTrue ? 'Vrai : le mot est bien employé.' : 'Faux : la phrase est absurde !'}
              </span>
              <Answer word={word} showSentence={!card.isTrue} />
            </div>
          ) : (
            revealButton('Voir la réponse')
          )}
        </>
      )
      break

    case 'mot-cache':
      body = (
        <>
          <p className="card-sentence">
            <Sentence sentence={word.sentence} word={word.word} hide={!revealed} />
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="eyebrow" style={{ color: '#5b4fa8' }}>
              Indice : le sens
            </span>
            <span style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.25 }}>{word.definition}</span>
          </div>
          {revealed ? (
            <div className="card-answer flip">
              <span className="eyebrow">Le mot</span>
              <span className="disp" style={{ fontSize: 40, fontWeight: 800 }}>
                {word.word}
              </span>
              <Extras word={word} />
            </div>
          ) : (
            revealButton('Voir le mot')
          )}
        </>
      )
      break

    case 'quel-sens': {
      const sibling = otherSenses(word, words)[0]
      body = (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p className="card-sentence" style={{ fontSize: 'clamp(22px, 2.8vw, 32px)' }}>
              <span className="disp" style={{ color: '#5b4fa8', marginRight: 10 }}>
                1
              </span>
              <Sentence sentence={word.sentence} word={word.word} />
            </p>
            <p className="card-sentence" style={{ fontSize: 'clamp(22px, 2.8vw, 32px)' }}>
              <span className="disp" style={{ color: '#5b4fa8', marginRight: 10 }}>
                2
              </span>
              {sibling ? <Sentence sentence={sibling.sentence} word={sibling.word} /> : <span className="mark">{word.word}</span>}
              {!sibling && <span style={{ fontSize: '0.7em' }}> dans son sens de tous les jours</span>}
            </p>
          </div>
          {revealed ? (
            <div className="card-answer flip">
              <span className="eyebrow">Sens 1</span>
              <span className="card-answer-text">{word.definition}</span>
              <span className="eyebrow" style={{ marginTop: 8 }}>
                Sens 2
              </span>
              <span className="card-answer-text">{sibling ? sibling.definition : word.knownSense}</span>
            </div>
          ) : (
            revealButton('Voir les deux sens')
          )}
        </>
      )
      break
    }

    case 'a-toi-la-phrase':
      body = (
        <>
          <span className="disp" style={{ fontSize: 'clamp(40px, 5vw, 60px)', fontWeight: 800 }}>
            <span className="mark" style={{ fontSize: '1em' }}>
              {word.word}
            </span>
          </span>
          <p style={{ fontSize: 22, fontWeight: 600, color: 'var(--card-muted)' }}>
            {playerName}, invente une phrase à toi qui emploie ce mot. La famille juge si elle est juste.
          </p>
          {revealed ? (
            <div className="card-answer flip">
              <Answer word={word} showSentence />
            </div>
          ) : (
            revealButton('Voir le sens et un exemple')
          )}
        </>
      )
      break

    case 'fais-deviner':
      body = revealed ? (
        <div className="flip" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="disp" style={{ fontSize: 'clamp(40px, 5vw, 60px)', fontWeight: 800 }}>
            <span className="mark" style={{ fontSize: '1em' }}>
              {word.word}
            </span>
          </span>
          <Answer word={word} showSentence />
        </div>
      ) : peek ? (
        <>
          <span className="eyebrow" style={{ color: '#b34a2f' }}>
            Seulement {playerName} !
          </span>
          <span className="disp" style={{ fontSize: 'clamp(40px, 5vw, 60px)', fontWeight: 800 }}>
            <span className="mark" style={{ fontSize: '1em' }}>
              {word.word}
            </span>
          </span>
          <span style={{ fontSize: 22, fontWeight: 600 }}>{word.definition}</span>
          <div className="row wrap">
            <button className="card-btn" onClick={() => setPeek(false)}>
              Cacher le mot
            </button>
            <button className="card-btn" onClick={onReveal}>
              Mot trouvé ou abandon : montrer à tous
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ fontSize: 26, fontWeight: 700 }}>
            {playerName} regarde le mot en secret, puis le fait deviner sans le dire, ni un mot de la même famille.
          </p>
          <div className="row wrap">
            <button className="card-btn" onClick={() => setPeek(true)}>
              <IconEye /> Voir le mot (seulement {playerName})
            </button>
          </div>
        </>
      )
      break

    default:
      body = (
        <>
          <p className="card-sentence">
            <Sentence sentence={word.sentence} word={word.word} />
          </p>
          {revealed ? (
            <div className="card-answer flip">
              <Answer word={word} />
            </div>
          ) : (
            revealButton()
          )}
        </>
      )
  }

  return (
    <div className="card cardin" style={{ boxShadow: `14px 14px 0 ${accent}` }}>
      {chips}
      {body}
    </div>
  )
}

function Answer({ word, showSentence = false }: { word: Word; showSentence?: boolean }) {
  const image = useImageUrl(word.imageId)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: image ? 'minmax(0, 1fr) auto' : '1fr', gap: 24, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="eyebrow" style={{ color: '#5b4fa8' }}>
          Le sens
        </span>
        <span className="card-answer-text">{word.definition}</span>
        {word.knownSense && <span style={{ fontSize: 19, color: 'var(--card-muted)' }}>Sens déjà connu : {word.knownSense}</span>}
        {showSentence && (
          <span style={{ fontSize: 20, color: 'var(--card-muted)' }}>
            Exemple : <Sentence sentence={word.sentence} word={word.word} />
          </span>
        )}
        <Extras word={word} />
      </div>
      {image && (
        <figure className="pop" style={{ margin: 0, padding: '10px 10px 12px', background: '#fff', borderRadius: 6, boxShadow: '0 10px 24px rgba(18,15,42,.28)', transform: 'rotate(4deg)' }}>
          <img src={image} alt={`Illustration de « ${word.word} »`} style={{ display: 'block', width: 'min(240px, 28vw)', aspectRatio: '1', objectFit: 'cover', borderRadius: 3 }} />
        </figure>
      )}
    </div>
  )
}

function Extras({ word }: { word: Word }) {
  if (!word.synonyms?.length && !word.antonyms?.length) return null
  return (
    <div className="row wrap" style={{ gap: 10, marginTop: 4 }}>
      {word.synonyms?.length ? (
        <span className="pop" style={{ minHeight: 44, padding: '0 16px', borderRadius: 22, background: '#ddf7ff', color: '#0e4a5c', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700 }}>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>Pareil</span>
          {word.synonyms.join(', ')}
        </span>
      ) : null}
      {word.antonyms?.length ? (
        <span className="pop" style={{ minHeight: 44, padding: '0 16px', borderRadius: 22, background: '#ffe3da', color: '#6b2410', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700 }}>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>Contraire</span>
          {word.antonyms.join(', ')}
        </span>
      ) : null}
    </div>
  )
}
