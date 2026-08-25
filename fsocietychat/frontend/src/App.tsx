import { useState } from 'react';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import ChatLayout from './components/chat/ChatLayout';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');

  if (isAuthenticated) {
    return <ChatLayout />;
  }

  return (
    <div className="flex h-screen items-center justify-center bg-black font-mono text-green-400 px-4">
      {authView === 'signin' ? (
        <SignIn onSwitchToSignUp={() => setAuthView('signup')} />
      ) : (
        <SignUp onSwitchToSignIn={() => setAuthView('signin')} />
      )}
    </div>
  );
}
