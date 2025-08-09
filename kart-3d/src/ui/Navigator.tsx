import { useAppStore } from '../core/store'
import SplashScreen from './boot/SplashScreen'
import LoadingScreen from './boot/LoadingScreen'
import MainMenu from './menu/MainMenu'
import CharacterSelect from './CharacterSelect'
import TrackSelect from './TrackSelect'
import Garage from './Garage'

export default function Navigator() {
  const screen = useAppStore(s => s.screen)
  if (screen === 'splash') return <SplashScreen />
  if (screen === 'loading') return <LoadingScreen />
  if (screen === 'menu') return <MainMenu />
  if (screen === 'character') return <CharacterSelect />
  if (screen === 'track') return <TrackSelect />
  if (screen === 'garage') return <Garage />
  return null
}


