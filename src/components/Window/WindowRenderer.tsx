// ============================================
// Window Renderer - Renders all open windows
// ============================================
import { useWindowManager } from '../../stores/windowManager';
import { useAppRegistry, getAppComponent } from '../../core/appRegistry';
import Window from './Window';

export default function WindowRenderer() {
  const windows = useWindowManager(s => s.windows);
  const apps = useAppRegistry(s => s.apps);

  return (
    <>
      {windows.map(win => {
        const app = apps[win.appId];
        if (!app) return null;

        const AppComponent = getAppComponent(win.appId);
        if (!AppComponent) return null;

        return (
          <Window key={win.id} windowId={win.id}>
            <AppComponent windowId={win.id} />
          </Window>
        );
      })}
    </>
  );
}
