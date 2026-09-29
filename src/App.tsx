import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GameScreen } from './ui/game/GameScreen'
import { Home } from './ui/Home'
import { Backup } from './ui/parents/Backup'
import { Packs } from './ui/parents/Packs'
import { Parents } from './ui/parents/Parents'
import { PlayerEditor, PlayerList } from './ui/parents/Players'
import { SettingsPanel } from './ui/parents/SettingsPanel'
import { Progress } from './ui/stats/Progress'
import { Ranking } from './ui/stats/Ranking'
import { UpdatePrompt } from './ui/UpdatePrompt'
import { AudioSync } from './ui/useTrack'
import { BatchAdd } from './ui/words/BatchAdd'
import { WordEditor } from './ui/words/WordEditor'
import { WordList } from './ui/words/WordList'

// HashRouter : GitHub Pages ne sait pas rediriger les URL profondes vers index.html.
export default function App() {
  return (
    <HashRouter>
      <UpdatePrompt />
      <AudioSync />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/partie" element={<GameScreen />} />
        <Route path="/ajouter" element={<WordEditor />} />
        <Route path="/ajouter/lot" element={<BatchAdd />} />
        <Route path="/classement" element={<Ranking />} />
        <Route path="/progres/:id" element={<Progress />} />
        <Route path="/parents/mots/:id" element={<WordEditor />} />
        <Route path="/parents/joueurs/:id" element={<PlayerEditor />} />
        <Route path="/parents" element={<Parents />}>
          <Route index element={<Navigate to="mots" replace />} />
          <Route path="mots" element={<WordList />} />
          <Route path="joueurs" element={<PlayerList />} />
          <Route path="paquets" element={<Packs />} />
          <Route path="reglages" element={<SettingsPanel />} />
          <Route path="sauvegarde" element={<Backup />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
