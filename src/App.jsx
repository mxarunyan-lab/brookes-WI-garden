import React, { useEffect, useState } from 'react';
import { BookOpen, UserRound } from 'lucide-react';
import {
  BottomNav, DetailModal, GardenScreen, MenuDrawer, PlantScreen, SimpleScreen, TodayScreen,
} from './screens.jsx';

function App() {
  const [page, setPage] = useState(() => localStorage.getItem('brookes-garden-page') || 'today');
  const [completed, setCompleted] = useState(() => JSON.parse(localStorage.getItem('brookes-garden-completed') || '[]'));
  const [filter, setFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => localStorage.setItem('brookes-garden-page', page), [page]);
  useEffect(() => localStorage.setItem('brookes-garden-completed', JSON.stringify(completed)), [completed]);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(window.__gardenToast);
    window.__gardenToast = window.setTimeout(() => setToast(''), 2200);
  };

  const navigate = (next) => {
    setPage(next);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleDone = (id) => {
    setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    showToast(completed.includes(id) ? 'Task moved back to today.' : 'Nice work — task marked done.');
  };

  return (
    <div className="site-stage">
      <div className={`app-shell page-${page}`}>
        {page === 'today' && (
          <TodayScreen
            completed={completed}
            toggleDone={toggleDone}
            onMenu={() => setDrawerOpen(true)}
            onBell={() => setNoticeOpen((v) => !v)}
            noticeOpen={noticeOpen}
            setModal={setModal}
          />
        )}
        {page === 'plant' && (
          <PlantScreen filter={filter} setFilter={setFilter} setModal={setModal} navigate={navigate} />
        )}
        {page === 'garden' && (
          <GardenScreen setModal={setModal} />
        )}
        {page === 'learn' && (
          <SimpleScreen
            icon={<BookOpen />}
            title="Garden Guide"
            eyebrow="WISCONSIN KNOW-HOW"
            body="Simple, local answers for planting, pests, harvests, and the odd Wisconsin cold snap."
            button="Browse starter guides"
            onClick={() => setModal({ type: 'guide' })}
          />
        )}
        {page === 'profile' && (
          <SimpleScreen
            icon={<UserRound />}
            title="Brooke’s Profile"
            eyebrow="YOUR GARDEN SETTINGS"
            body="Green Bay, Wisconsin • Zone 5b • Raised beds, greenhouse, and hydroponics."
            button="Review garden setup"
            onClick={() => setModal({ type: 'profile' })}
          />
        )}

        <BottomNav page={page} navigate={navigate} />

        {drawerOpen && <MenuDrawer close={() => setDrawerOpen(false)} navigate={navigate} />}
        {modal && <DetailModal modal={modal} close={() => setModal(null)} showToast={showToast} />}
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </div>
  );
}


export default App;
