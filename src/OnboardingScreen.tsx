import React from 'react';
import { ArrowRight} from 'lucide-react';

type OnboardingProps = {
  onStart: () => void;
  setAiName: (name: string) => void;
  aiName: string;
};

const OnboardingScreen: React.FC<OnboardingProps> = ({ onStart, setAiName, aiName }) => {

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 via-rose-100 to-lime-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.2] bg-[length:20px_20px] pointer-events-none"></div>
      
      {/* デザイン要素 */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-pink-400 to-orange-300 rounded-full opacity-20 blur-3xl"></div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-5xl mx-auto backdrop-blur-xl bg-white/30 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20 overflow-hidden">
          {/* ヒーローセクション */}
          <div className="p-8 md:p-12 text-center">
            <div className="inline-block p-3 bg-white/30 backdrop-blur-sm rounded-2xl mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl px-4 py-2 text-sm font-medium">
                AO入学試験
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              AI会話クローン
            </h1>
            <p className="text-gray-800/90 text-lg md:text-xl mb-8 max-w-3xl mx-auto">
              あなたの性格を反映したAIクローンを作成し、まるであなた自身が話しているかのような自然な対話を実現します。
            </p>

            {/* AIの名前入力とスタートボタン */}
            <div className="max-w-md mx-auto">
              <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl">
                <label className="block text-gray-800/90 mb-2 font-medium">AIクローンの名前</label>
                <input
                  type="text"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  className="w-full bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500/50 text-gray-800 mb-4"
                  placeholder="AIの名前を入力してください。"
                />
                <button
                  onClick={onStart}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-2xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  AIクローンを作成する
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
          
          {/* フッター */}
          <div className="px-8 py-4 bg-black/5 backdrop-blur-sm border-t border-white/10 text-center text-gray-600 text-sm">
            © 2025 AI会話クローン | AO入学試験 | <a href="#" className="text-purple-600 hover:underline">利用規約</a> | <a href="#" className="text-purple-600 hover:underline">プライバシーポリシー</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen; 