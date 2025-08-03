import Header from '@/components/Header';
import GoblinTapGame from '@/components/GoblinTapGame';
import PoolStatus from '@/components/PoolStatus';
import DebugInfo from '@/components/DebugInfo';
import WalletSetup from '@/components/WalletSetup';
import { BettingDebugPanel } from '@/components/BettingDebugPanel';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-4">
        {/* <PoolStatus /> */}
        <BettingDebugPanel className="mb-6" />
      </div>
      <GoblinTapGame />
      {/* <DebugInfo /> */}
      <WalletSetup />
    </main>
  );
}
