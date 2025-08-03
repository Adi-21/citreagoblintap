import Header from '@/components/Header';
import GoblinTapGame from '@/components/GoblinTapGame';
// import WalletSetup from '@/components/WalletSetup';
import { BettingDebugPanel } from '@/components/BettingDebugPanel';
import AuthFlow from '@/components/AuthFlow';
import PrivyDebugLogin from '@/components/PrivyDebugLogin';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-4">
        <PrivyDebugLogin />
        <BettingDebugPanel className="mb-6" />
      </div>
      <GoblinTapGame />
      {/* <WalletSetup /> */}
      <AuthFlow />
    </main>
  );
}
