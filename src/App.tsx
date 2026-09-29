import { HashRouter, Route, Routes } from 'react-router-dom'
import { Home } from './ui/Home'
import { Parents } from './ui/Parents'
import { UpdatePrompt } from './ui/UpdatePrompt'

// HashRouter : GitHub Pages ne sait pas rediriger les URL profondes vers index.html.
export default function App() {
  return (
    <HashRouter>
      <UpdatePrompt />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/parents" element={<Parents />} />
      </Routes>
    </HashRouter>
  )
}
