// Découverte des mots nouveaux : pas de points, pas de chrono.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Word } from '../../domain/types'
import { Sentence, useImageUrl } from '../common'
import { IconArrow, IconBack, IconPause, IconStar } from '../icons'

export function Discovery({ words, onDone }: { words: Word[]; onDone: () => void }) {
  const [i, setI] = useState(0)
  const word = words[i]
  const image = useImageUrl(word?.imageId)
  if (!word) {
    queueMicrotask(onDone)
    return null
  }
  const last = i === words.length - 1

  return (
    <main className="screen">
      <header className="row" style={{ justifyContent: 'space-between' }}>
        <Link to="/" className="btn">
          <IconPause /> Pause
        </Link>
        <div className="eyebrow">
          <span style={{ color: 'var(--lime)' }}>Découverte</span> · mot nouveau {i + 1} / {words.length}
        </div>
        <span style={{ width: 120 }} />
      </header>

      <div className="row wrap rise" style={{ gap: 14 }}>
        <span style={{ color: 'var(--gold)', display: 'flex' }}>
          <IconStar size={40} />
        </span>
        <h1 className="disp" style={{ fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 800 }}>
          Relis-le à voix haute, puis invente une phrase.
        </h1>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 14px 14px 0' }}>
        <div key={word.id} className="card cardin" style={{ boxShadow: '14px 14px 0 var(--lime)' }}>
          <div className="row wrap" style={{ gap: 10 }}>
            <span className="card-chip">{word.kind === 'expression' ? `Expression · ${word.category}` : word.category}</span>
            <span className="card-chip gold">{word.knownSense ? 'Sens nouveau' : 'Mot nouveau'}</span>
            {word.partOfSpeech && <span className="card-chip">{word.partOfSpeech}</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: image ? 'minmax(0,1fr) auto' : '1fr', gap: 28, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <p className="card-sentence">
                <Sentence sentence={word.sentence} word={word.word} />
              </p>
              <div className="card-answer" style={{ paddingTop: 16 }}>
                <span className="eyebrow">Le sens</span>
                <span className="card-answer-text">{word.definition}</span>
                {word.knownSense && <span style={{ fontSize: 19, color: 'var(--card-muted)' }}>Sens déjà connu : {word.knownSense}</span>}
              </div>
            </div>
            {image && <img src={image} alt={`Illustration de « ${word.word} »`} style={{ width: 'min(260px, 26vw)', aspectRatio: '1', objectFit: 'cover', borderRadius: 16, transform: 'rotate(3deg)' }} />}
          </div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button className="btn" onClick={() => setI(i - 1)} disabled={i === 0}>
          <IconBack /> Précédent
        </button>
        <button className="btn btn-primary disp" style={{ minHeight: 84, fontSize: 24, padding: '0 36px', borderRadius: 26 }} onClick={() => (last ? onDone() : setI(i + 1))}>
          {last ? 'Commencer la partie' : 'Mot suivant'} <IconArrow size={26} />
        </button>
      </div>
    </main>
  )
}
